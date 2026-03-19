package com.senay.app;

import android.accessibilityservice.AccessibilityService;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.Html;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Two-step gate: (1) prompt + "Unlock app" (2) Bible passage from assets, scroll, then open locked app.
 * Progress is stored in {@link GateBibleProgress}; mode paragraph vs chapter from {@link AppLockPrefs#getMode}.
 */
public class ReadingGateAccessibilityService extends AccessibilityService {

    public static final String PACKAGE_SENAY = "com.senay.app";

    private static final long EVALUATE_DEBOUNCE_MS = 320L;
    private static final int SCROLL_END_SLACK_PX = 48;

    private static final ExecutorService GATE_IO = Executors.newSingleThreadExecutor();

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable debouncedEvaluate = this::evaluateAfterDebounce;
    private WindowManager windowManager;
    private View overlayView;
    private String overlayTargetPackage;
    private String lastStableForeground;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }
        mainHandler.removeCallbacks(debouncedEvaluate);
        mainHandler.postDelayed(debouncedEvaluate, EVALUATE_DEBOUNCE_MS);
    }

    private void evaluateAfterDebounce() {
        String packageName = resolveForegroundPackage();
        if (packageName == null) {
            return;
        }
        evaluateForeground(packageName);
    }

    private String resolveForegroundPackage() {
        AccessibilityNodeInfo root = null;
        try {
            root = getRootInActiveWindow();
            if (root != null) {
                CharSequence p = root.getPackageName();
                if (p != null) {
                    return p.toString();
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (root != null) {
                try {
                    root.recycle();
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }

    private void evaluateForeground(String packageName) {
        if (!AppLockPrefs.isEnabled(this)) {
            removeOverlay();
            lastStableForeground = packageName;
            return;
        }

        if (overlayView != null) {
            return;
        }

        if (lastStableForeground != null && !lastStableForeground.equals(packageName)) {
            if (AppLockPrefs.isLockedPackage(this, lastStableForeground)) {
                AppLockPrefs.markUserLeftLockedApp(this, lastStableForeground);
            }
        }
        lastStableForeground = packageName;

        if (shouldAlwaysAllow(packageName)) {
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

        showOverlay(packageName);
    }

    private boolean shouldAlwaysAllow(String packageName) {
        if (PACKAGE_SENAY.equals(packageName)) return true;
        return packageName.startsWith("com.android.settings")
                || packageName.startsWith("com.google.android.permissioncontroller")
                || "com.android.packageinstaller".equals(packageName)
                || "com.google.android.packageinstaller".equals(packageName)
                || "com.android.systemui".equals(packageName);
    }

    private void showOverlay(String blockedPackage) {
        if (overlayView != null && blockedPackage.equals(overlayTargetPackage)) {
            return;
        }
        if (overlayView != null) {
            removeOverlay();
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        overlayView = inflater.inflate(R.layout.app_lock_overlay, null);
        overlayTargetPackage = blockedPackage;

        LinearLayout phasePrompt = overlayView.findViewById(R.id.app_lock_phase_prompt);
        LinearLayout phaseReading = overlayView.findViewById(R.id.app_lock_phase_reading);
        TextView promptTitle = overlayView.findViewById(R.id.app_lock_prompt_title);
        Button btnStart = overlayView.findViewById(R.id.app_lock_btn_start_reading);

        TextView headerTitle = overlayView.findViewById(R.id.app_lock_header_title);
        TextView headerSub = overlayView.findViewById(R.id.app_lock_header_sub);
        TextView body = overlayView.findViewById(R.id.app_lock_reading_body);
        TextView hint = overlayView.findViewById(R.id.app_lock_scroll_hint);
        ScrollView scroll = overlayView.findViewById(R.id.app_lock_scroll);
        Button openApp = overlayView.findViewById(R.id.app_lock_open_app);
        TextView nextLockFooter = overlayView.findViewById(R.id.app_lock_next_lock_footer);

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
                    if (overlayView == null || !blockedPackage.equals(overlayTargetPackage)) return;

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
                        GateBibleProgress.advanceAfterCompletion(ReadingGateAccessibilityService.this);
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

        try {
            windowManager.addView(overlayView, params);
        } catch (Exception e) {
            overlayView = null;
            overlayTargetPackage = null;
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
        return BibleGateNavigator.loadParagraph(this, b, c, v);
    }

    private void updateOpenButtonState(ScrollView scroll, Button openApp, TextView hint) {
        if (scroll == null || openApp == null || overlayView == null) return;
        View child = scroll.getChildAt(0);
        if (child == null) return;
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
        if (overlayView == null) return;
        try {
            windowManager.removeView(overlayView);
        } catch (Exception ignored) {
        }
        overlayView = null;
        overlayTargetPackage = null;
    }

    @Override
    public void onInterrupt() {
        mainHandler.removeCallbacks(debouncedEvaluate);
        removeOverlay();
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(debouncedEvaluate);
        removeOverlay();
        super.onDestroy();
    }
}
