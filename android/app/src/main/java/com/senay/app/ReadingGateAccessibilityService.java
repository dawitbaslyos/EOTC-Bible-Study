package com.senay.app;

import android.accessibilityservice.AccessibilityService;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.Html;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Two-step gate: (1) prompt + start reading (2) Bible passage from assets, scroll, then Finish.
 * Foreground: accessibility windows + active window root (no usage-stats permission).
 * Overlay: {@link WindowManager.LayoutParams#TYPE_ACCESSIBILITY_OVERLAY} with
 * {@link WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY} fallback when allowed.
 */
public class ReadingGateAccessibilityService extends AccessibilityService {

    public static final String PACKAGE_SENAY = "com.senay.app";

    private static final long EVALUATE_DEBOUNCE_MS = 75L;
    /** Second pass catches rapid app switches before focus settles. */
    private static final long FOLLOW_UP_EVALUATE_MS = 170L;
    private static final int SCROLL_END_SLACK_PX = 48;

    private static final ExecutorService GATE_IO = Executors.newSingleThreadExecutor();

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable debouncedEvaluate = this::evaluateAfterDebounce;
    private final Runnable followUpEvaluate = this::evaluateAfterDebounce;
    private final Object overlayLock = new Object();
    private WindowManager windowManager;
    private final AtomicReference<View> overlayViewRef = new AtomicReference<>();
    private volatile String overlayTargetPackage;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }
        int type = event.getEventType();
        if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            scheduleEvaluation();
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
                && type == AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            scheduleEvaluation();
            return;
        }
        if (type == AccessibilityEvent.TYPE_VIEW_FOCUSED) {
            CharSequence p = event.getPackageName();
            if (p != null && AppLockPrefs.isLockedPackage(this, p.toString())) {
                scheduleEvaluation();
            }
        }
    }

    private void scheduleEvaluation() {
        mainHandler.removeCallbacks(debouncedEvaluate);
        mainHandler.removeCallbacks(followUpEvaluate);
        mainHandler.postDelayed(debouncedEvaluate, EVALUATE_DEBOUNCE_MS);
        mainHandler.postDelayed(followUpEvaluate, EVALUATE_DEBOUNCE_MS + FOLLOW_UP_EVALUATE_MS);
    }

    private void evaluateAfterDebounce() {
        String packageName = resolveForegroundPackage();
        if (packageName == null) {
            return;
        }
        evaluateForeground(packageName);
    }

    /**
     * Lock screen / keyguard / system UI: do not count as "user left" the locked app.
     * Settings and installers still count as leaving (stricter pass invalidation).
     */
    private static boolean isTransientForegroundNavigation(String packageName) {
        if (packageName == null || packageName.isEmpty()) {
            return true;
        }
        if ("com.android.systemui".equals(packageName)) {
            return true;
        }
        if (packageName.contains("keyguard")) {
            return true;
        }
        return packageName.contains(".dreams.");
    }

    /** Foregrounds where we never draw the reading gate (Senay itself, system flows, transient UI). */
    private boolean shouldSkipGateOverlay(String packageName) {
        if (PACKAGE_SENAY.equals(packageName)) {
            return true;
        }
        if (isTransientForegroundNavigation(packageName)) {
            return true;
        }
        return packageName.startsWith("com.android.settings")
                || packageName.startsWith("com.google.android.permissioncontroller")
                || "com.android.packageinstaller".equals(packageName)
                || "com.google.android.packageinstaller".equals(packageName);
    }

    private String packageFromRoot(AccessibilityNodeInfo root) {
        if (root == null) {
            return null;
        }
        try {
            CharSequence p = root.getPackageName();
            return p != null ? p.toString() : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private AccessibilityNodeInfo getRootInActiveWindowSafe() {
        try {
            return getRootInActiveWindow();
        } catch (Exception ignored) {
            return null;
        }
    }

    /** Package reported by the active accessibility root (recycled safely). */
    private String foregroundFromActiveRoot() {
        AccessibilityNodeInfo root = getRootInActiveWindowSafe();
        try {
            return packageFromRoot(root);
        } finally {
            if (root != null) {
                try {
                    root.recycle();
                } catch (Exception ignored) {
                }
            }
        }
    }

    /**
     * Split-screen / multi-window: if any application window shows a locked package, prefer it for gating
     * even when focus is briefly on launcher or another pane.
     */
    private String pickForegroundFromWindows() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return null;
        }
        List<AccessibilityWindowInfo> windows = getWindows();
        if (windows == null || windows.isEmpty()) {
            return null;
        }
        String focusedPkg = null;
        List<String> visibleLockedPackages = new ArrayList<>();
        String firstApplicationPkg = null;
        Set<String> locked = AppLockPrefs.getLockedPackages(this);
        try {
            for (AccessibilityWindowInfo w : windows) {
                if (w == null) {
                    continue;
                }
                if (w.getType() == AccessibilityWindowInfo.TYPE_ACCESSIBILITY_OVERLAY) {
                    continue;
                }
                Rect b = new Rect();
                w.getBoundsInScreen(b);
                if (b.width() < 16 || b.height() < 16) {
                    continue;
                }
                AccessibilityNodeInfo nodeRoot = w.getRoot();
                if (nodeRoot == null) {
                    continue;
                }
                try {
                    String pkg = packageFromRoot(nodeRoot);
                    if (pkg == null || pkg.isEmpty()) {
                        continue;
                    }
                    if (w.getType() == AccessibilityWindowInfo.TYPE_APPLICATION && firstApplicationPkg == null) {
                        firstApplicationPkg = pkg;
                    }
                    if (w.isFocused()) {
                        focusedPkg = pkg;
                    }
                    if (!locked.isEmpty() && locked.contains(pkg)
                            && w.getType() == AccessibilityWindowInfo.TYPE_APPLICATION) {
                        visibleLockedPackages.add(pkg);
                    }
                } finally {
                    try {
                        nodeRoot.recycle();
                    } catch (Exception ignored) {
                    }
                }
            }
        } finally {
            for (AccessibilityWindowInfo w : windows) {
                try {
                    w.recycle();
                } catch (Exception ignored) {
                }
            }
        }
        if (!visibleLockedPackages.isEmpty()) {
            if (focusedPkg != null && visibleLockedPackages.contains(focusedPkg)) {
                return focusedPkg;
            }
            return visibleLockedPackages.get(0);
        }
        return focusedPkg != null ? focusedPkg : firstApplicationPkg;
    }

    private String resolveForegroundPackage() {
        String fromRoot = foregroundFromActiveRoot();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            String fromWindows = pickForegroundFromWindows();
            if (fromWindows != null) {
                if (AppLockPrefs.isLockedPackage(this, fromWindows)) {
                    return fromWindows;
                }
                if (fromRoot != null
                        && AppLockPrefs.isLockedPackage(this, fromRoot)
                        && !fromRoot.equals(fromWindows)) {
                    return fromRoot;
                }
                return fromWindows;
            }
        }
        return fromRoot;
    }

    private void evaluateForeground(String packageName) {
        if (!AppLockPrefs.isEnabled(this)) {
            removeOverlay();
            return;
        }

        synchronized (overlayLock) {
            if (overlayViewRef.get() != null) {
                return;
            }
        }

        synchronized (AppLockPrefs.GATE_STATE_LOCK) {
            if (shouldSkipGateOverlay(packageName)) {
                removeOverlay();
                return;
            }

            if (!AppLockPrefs.isLockedPackage(this, packageName)) {
                removeOverlay();
                return;
            }

            if (AppLockPrefs.hasValidGatePass(this, packageName)) {
                removeOverlay();
                return;
            }
        }

        showOverlay(packageName);
    }

    private void showOverlay(String blockedPackage) {
        synchronized (overlayLock) {
            View existing = overlayViewRef.get();
            if (existing != null && blockedPackage.equals(overlayTargetPackage)) {
                return;
            }
            if (existing != null) {
                removeOverlayLocked();
            }
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        View overlay = inflater.inflate(R.layout.app_lock_overlay, null);
        overlayTargetPackage = blockedPackage;

        LinearLayout phasePrompt = overlay.findViewById(R.id.app_lock_phase_prompt);
        LinearLayout phaseReading = overlay.findViewById(R.id.app_lock_phase_reading);
        TextView promptTitle = overlay.findViewById(R.id.app_lock_prompt_title);
        Button btnStart = overlay.findViewById(R.id.app_lock_btn_start_reading);

        TextView headerTitle = overlay.findViewById(R.id.app_lock_header_title);
        TextView headerSub = overlay.findViewById(R.id.app_lock_header_sub);
        TextView body = overlay.findViewById(R.id.app_lock_reading_body);
        TextView hint = overlay.findViewById(R.id.app_lock_scroll_hint);
        ScrollView scroll = overlay.findViewById(R.id.app_lock_scroll);
        Button openApp = overlay.findViewById(R.id.app_lock_open_app);
        TextView nextLockFooter = overlay.findViewById(R.id.app_lock_next_lock_footer);

        String appLabel;
        try {
            CharSequence lb = getPackageManager().getApplicationLabel(
                    getPackageManager().getApplicationInfo(blockedPackage, 0));
            appLabel = lb != null ? lb.toString() : blockedPackage;
        } catch (Exception e) {
            appLabel = blockedPackage;
        }
        final String appLabelFinal = appLabel;

        promptTitle.setText(getString(R.string.app_lock_header_fmt, appLabelFinal));
        headerTitle.setText(getString(R.string.app_lock_header_fmt, appLabelFinal));

        phasePrompt.setVisibility(View.VISIBLE);
        phaseReading.setVisibility(View.GONE);

        btnStart.setOnClickListener(v -> {
            btnStart.setEnabled(false);
            phasePrompt.setVisibility(View.GONE);
            phaseReading.setVisibility(View.VISIBLE);
            body.setText(R.string.app_lock_loading);
            hint.setVisibility(View.GONE);
            openApp.setEnabled(false);
            openApp.setAlpha(0.45f);

            GATE_IO.execute(() -> {
                BibleGateNavigator.Segment seg = loadCurrentSegment();
                mainHandler.post(() -> {
                    synchronized (overlayLock) {
                        if (overlayViewRef.get() == null || !blockedPackage.equals(overlayTargetPackage)) {
                            return;
                        }
                    }

                    if (seg == null || TextUtils.isEmpty(seg.html)) {
                        body.setText(R.string.app_lock_bible_missing);
                        hint.setVisibility(View.GONE);
                        openApp.setText(getString(R.string.app_lock_open_app_fmt, appLabelFinal));
                        openApp.setEnabled(true);
                        openApp.setAlpha(1f);
                        openApp.setOnClickListener(v2 -> {
                            AppLockPrefs.recordGateCompletion(ReadingGateAccessibilityService.this, blockedPackage);
                            removeOverlay();
                        });
                        return;
                    }

                    if (!TextUtils.isEmpty(seg.subtitle)) {
                        headerSub.setText(seg.subtitle);
                        headerSub.setVisibility(View.VISIBLE);
                    } else {
                        headerSub.setVisibility(View.GONE);
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        body.setText(Html.fromHtml(seg.html, Html.FROM_HTML_MODE_COMPACT));
                    } else {
                        body.setText(Html.fromHtml(seg.html));
                    }

                    Runnable updateOpen = () -> updateOpenButtonState(scroll, openApp, hint);
                    openApp.setText(getString(R.string.app_lock_open_app_fmt, appLabelFinal));
                    openApp.setOnClickListener(v2 -> {
                        try {
                            int b = GateBibleProgress.getBookIndex(ReadingGateAccessibilityService.this);
                            int c = GateBibleProgress.getChapterIndex(ReadingGateAccessibilityService.this);
                            String bookId = BibleGateNavigator.getBookShortNameEn(
                                    ReadingGateAccessibilityService.this, b);
                            int chap = BibleGateNavigator.getChapterNumberAt(
                                    ReadingGateAccessibilityService.this, b, c);
                            String mode = AppLockPrefs.getMode(ReadingGateAccessibilityService.this);
                            if (mode == null) {
                                mode = "paragraph";
                            }
                            JSONObject row = new JSONObject();
                            row.put("bookId", bookId != null ? bookId : "");
                            row.put("chapter", chap);
                            row.put("mode", mode);
                            AppLockPrefs.enqueuePendingGateCompletion(ReadingGateAccessibilityService.this, row);
                        } catch (Exception ignored) {
                        }
                        if ("chapter".equals(AppLockPrefs.getMode(ReadingGateAccessibilityService.this))) {
                            GateBibleProgress.advanceChapterGate(ReadingGateAccessibilityService.this);
                        } else {
                            int steps = seg.versesInGate > 0
                                    ? seg.versesInGate
                                    : BibleGateNavigator.PARAGRAPH_GATE_VERSE_COUNT;
                            GateBibleProgress.advanceParagraphGate(ReadingGateAccessibilityService.this, steps);
                        }
                        AppLockPrefs.recordGateCompletion(ReadingGateAccessibilityService.this, blockedPackage);
                        removeOverlay();
                    });

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        scroll.setOnScrollChangeListener((a, sx, sy, osx, osy) -> updateOpen.run());
                    }
                    scroll.post(() -> {
                        updateOpen.run();
                        if (!openApp.isEnabled()) {
                            scroll.postDelayed(updateOpen, 400);
                        }
                    });
                });
            });
        });

        nextLockFooter.setText(R.string.app_lock_footer_next_lock);

        WindowManager.LayoutParams params = buildAccessibilityOverlayParams();
        synchronized (overlayLock) {
            overlayViewRef.set(overlay);
            try {
                windowManager.addView(overlay, params);
            } catch (Exception e) {
                overlayViewRef.set(null);
                overlayTargetPackage = null;
                if (tryAddApplicationOverlayFallback(overlay, params)) {
                    return;
                }
            }
        }
    }

    private WindowManager.LayoutParams buildAccessibilityOverlayParams() {
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        return params;
    }

    /**
     * When accessibility overlay is blocked, use {@link WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY}
     * if the user granted "Display over other apps".
     */
    private boolean tryAddApplicationOverlayFallback(View overlay, WindowManager.LayoutParams ignored) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || !Settings.canDrawOverlays(this)) {
            return false;
        }
        WindowManager.LayoutParams p2 = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        : WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            p2.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        synchronized (overlayLock) {
            overlayViewRef.set(overlay);
            try {
                windowManager.addView(overlay, p2);
                return true;
            } catch (Exception e2) {
                overlayViewRef.set(null);
                overlayTargetPackage = null;
                return false;
            }
        }
    }

    private BibleGateNavigator.Segment loadCurrentSegment() {
        int b = GateBibleProgress.getBookIndex(this);
        int c = GateBibleProgress.getChapterIndex(this);
        int v = GateBibleProgress.getVerseFlatIndex(this);
        boolean chapterMode = "chapter".equals(AppLockPrefs.getMode(this));
        if (chapterMode) {
            return BibleGateNavigator.loadChapter(this, b, c);
        }
        return BibleGateNavigator.loadFiveVerses(this, b, c, v);
    }

    private void updateOpenButtonState(ScrollView scroll, Button openApp, TextView hint) {
        View current;
        synchronized (overlayLock) {
            current = overlayViewRef.get();
        }
        if (scroll == null || openApp == null || current == null) {
            return;
        }
        View child = scroll.getChildAt(0);
        if (child == null) {
            return;
        }
        int range = child.getHeight() - scroll.getHeight();
        boolean atBottom = range <= SCROLL_END_SLACK_PX
                || scroll.getScrollY() >= range - SCROLL_END_SLACK_PX;
        openApp.setEnabled(atBottom);
        openApp.setAlpha(atBottom ? 1f : 0.45f);
        if (hint != null) {
            hint.setVisibility(atBottom ? View.GONE : View.VISIBLE);
        }
    }

    private void removeOverlay() {
        synchronized (overlayLock) {
            removeOverlayLocked();
        }
    }

    private void removeOverlayLocked() {
        View v = overlayViewRef.getAndSet(null);
        overlayTargetPackage = null;
        if (v == null) {
            return;
        }
        try {
            windowManager.removeView(v);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onInterrupt() {
        mainHandler.removeCallbacks(debouncedEvaluate);
        mainHandler.removeCallbacks(followUpEvaluate);
        removeOverlay();
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(debouncedEvaluate);
        mainHandler.removeCallbacks(followUpEvaluate);
        removeOverlay();
        super.onDestroy();
    }
}
