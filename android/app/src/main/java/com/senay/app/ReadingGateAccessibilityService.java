package com.senay.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.TextView;

/**
 * Detects when a locked app comes to the foreground and shows a blocking overlay
 * until the user earns an unlock token by reading in Senay.
 */
public class ReadingGateAccessibilityService extends AccessibilityService {

    public static final String PACKAGE_SENAY = "com.senay.app";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private WindowManager windowManager;
    private View overlayView;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        int type = event.getEventType();
        if (type != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String pkg = pkgSeq.toString();

        mainHandler.post(() -> evaluateForeground(pkg));
    }

    private void evaluateForeground(String packageName) {
        if (!AppLockPrefs.isEnabled(this)) {
            removeOverlay();
            return;
        }

        if (shouldAlwaysAllow(packageName)) {
            removeOverlay();
            return;
        }

        if (!AppLockPrefs.isLockedPackage(this, packageName)) {
            removeOverlay();
            return;
        }

        if (AppLockPrefs.tryConsumeUnlockForLockedApp(this, packageName)) {
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
        if (overlayView != null) {
            return;
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        overlayView = inflater.inflate(R.layout.app_lock_overlay, null);

        TextView title = overlayView.findViewById(R.id.app_lock_title);
        TextView msg = overlayView.findViewById(R.id.app_lock_message);
        Button openSenay = overlayView.findViewById(R.id.app_lock_open_senay);

        String mode = AppLockPrefs.getMode(this);
        String modeHint = "chapter".equals(mode)
                ? getString(R.string.app_lock_mode_chapter_hint)
                : getString(R.string.app_lock_mode_paragraph_hint);
        msg.setText(getString(R.string.app_lock_overlay_message_fmt, modeHint));

        try {
            CharSequence label = getPackageManager().getApplicationLabel(
                    getPackageManager().getApplicationInfo(blockedPackage, 0));
            title.setText(getString(R.string.app_lock_overlay_title_fmt, label));
        } catch (Exception e) {
            title.setText(R.string.app_lock_overlay_title);
        }

        openSenay.setOnClickListener(v -> {
            Intent intent = getPackageManager().getLaunchIntentForPackage(PACKAGE_SENAY);
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
            }
            removeOverlay();
        });

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT);

        try {
            windowManager.addView(overlayView, params);
        } catch (Exception e) {
            overlayView = null;
        }
    }

    private void removeOverlay() {
        if (overlayView == null) return;
        try {
            windowManager.removeViewImmediate(overlayView);
        } catch (Exception ignored) {
        }
        overlayView = null;
    }

    @Override
    public void onInterrupt() {
        removeOverlay();
    }

    @Override
    public void onDestroy() {
        removeOverlay();
        super.onDestroy();
    }
}
