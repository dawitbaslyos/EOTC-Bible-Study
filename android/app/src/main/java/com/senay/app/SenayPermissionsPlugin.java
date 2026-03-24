package com.senay.app;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

/**
 * Batch runtime permissions for Senay (notifications + microphone) via Capacitor’s
 * permission flow. Exact alarms use a settings intent when needed.
 *
 * <p>{@code POST_NOTIFICATIONS} is required for the JS layer (Capacitor Local Notifications) to
 * schedule daily Wudase / routine reminders and streak nudges. This plugin only requests the permission;
 * scheduling is done from the WebView via Capacitor.</p>
 */
@CapacitorPlugin(
        name = "SenayPermissions",
        permissions = {
                @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone"),
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        }
)
public class SenayPermissionsPlugin extends Plugin {

    @PluginMethod
    public void requestAll(PluginCall call) {
        List<String> aliases = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= 33) {
            PermissionState n = getPermissionState("notifications");
            if (n != PermissionState.GRANTED) {
                aliases.add("notifications");
            }
        }
        PermissionState m = getPermissionState("microphone");
        if (m != PermissionState.GRANTED) {
            aliases.add("microphone");
        }
        if (aliases.isEmpty()) {
            call.resolve(buildStatus());
            return;
        }
        requestPermissionForAliases(aliases.toArray(new String[0]), call, "onRuntimePermsDone");
    }

    @PermissionCallback
    private void onRuntimePermsDone(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void checkStatus(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (am != null && !am.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    getContext().startActivity(intent);
                } catch (Exception e) {
                    openAppDetails();
                }
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        openAppDetails();
        call.resolve();
    }

    private void openAppDetails() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (Exception ignored) {
        }
    }

    private JSObject buildStatus() {
        JSObject o = new JSObject();
        if (Build.VERSION.SDK_INT >= 33) {
            PermissionState n = getPermissionState("notifications");
            boolean granted = n == PermissionState.GRANTED;
            o.put("notifications", granted ? "granted" : "denied");
        } else {
            o.put("notifications", "granted");
        }
        PermissionState mic = getPermissionState("microphone");
        o.put("microphone", mic == PermissionState.GRANTED ? "granted" : "denied");

        boolean exact = true;
        if (Build.VERSION.SDK_INT >= 31) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            exact = am != null && am.canScheduleExactAlarms();
        }
        o.put("exactAlarms", exact);
        return o;
    }
}
