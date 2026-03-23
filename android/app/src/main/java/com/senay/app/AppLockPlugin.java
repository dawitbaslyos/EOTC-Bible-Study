package com.senay.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "AppLock")
public class AppLockPlugin extends Plugin {

    @PluginMethod
    public void getState(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("enabled", AppLockPrefs.isEnabled(ctx));
        ret.put("mode", AppLockPrefs.getMode(ctx));
        ret.put("packages", jsonFromSet(AppLockPrefs.getLockedPackages(ctx)));
        ret.put("hasGateReadingContent", BibleGateNavigator.assetExists(ctx));
        ret.put("accessibilityServiceEnabled", isAccessibilityServiceEnabled(ctx));
        ret.put("usageStatsPermissionGranted", UsageStatsHelper.hasUsageAccess(ctx));
        ret.put("displayOverOtherAppsGranted", canDrawOverlays(ctx));
        call.resolve(ret);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        AppLockPrefs.setEnabled(getContext(), enabled);
        call.resolve();
    }

    @PluginMethod
    public void setMode(PluginCall call) {
        String mode = call.getString("mode", "paragraph");
        AppLockPrefs.setMode(getContext(), mode);
        call.resolve();
    }

    @PluginMethod
    public void setLockedPackages(PluginCall call) {
        JSArray arr = call.getArray("packages", new JSArray());
        Set<String> set = new HashSet<>();
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                try {
                    String p = arr.getString(i);
                    if (!TextUtils.isEmpty(p)) {
                        set.add(p);
                    }
                } catch (Exception ignored) {
                }
            }
        }
        AppLockPrefs.setLockedPackages(getContext(), set);
        call.resolve();
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /** Settings → Special app access → Usage access (official foreground detection). */
    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
        call.resolve();
    }

    /** Display over other apps — some OEMs tie full-screen overlays to this grant. */
    @PluginMethod
    public void openDisplayOverOtherAppsSettings(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + ctx.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                ctx.startActivity(intent);
            } catch (Exception e) {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + ctx.getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getLauncherApps(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN, null);
        main.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> infos = pm.queryIntentActivities(main, PackageManager.MATCH_ALL);
        List<JSObject> out = new ArrayList<>();

        String self = ctx.getPackageName();
        for (ResolveInfo ri : infos) {
            if (ri.activityInfo == null) continue;
            String pkg = ri.activityInfo.packageName;
            if (self.equals(pkg)) continue;

            CharSequence label = ri.loadLabel(pm);
            JSObject row = new JSObject();
            row.put("packageName", pkg);
            row.put("label", label != null ? label.toString() : pkg);
            out.add(row);
        }

        Collections.sort(out, Comparator.comparing(o -> o.optString("label", "")));

        JSONArray jarr = new JSONArray();
        for (JSObject row : out) {
            jarr.put(row);
        }
        JSObject ret = new JSObject();
        ret.put("apps", jarr);
        call.resolve(ret);
    }

    /**
     * Human-readable app names for locked package ids (uses {@link PackageManager#getApplicationLabel}).
     */
    @PluginMethod
    public void consumePendingGateCompletions(PluginCall call) {
        String json = AppLockPrefs.consumePendingGateQueue(getContext());
        JSArray out = new JSArray();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                JSObject row = new JSObject();
                row.put("bookId", o.optString("bookId", ""));
                row.put("chapter", o.optInt("chapter", 1));
                row.put("mode", o.optString("mode", "paragraph"));
                out.put(row);
            }
        } catch (JSONException e) {
            // leave empty
        }
        JSObject ret = new JSObject();
        ret.put("items", out);
        call.resolve(ret);
    }

    @PluginMethod
    public void getLabelsForPackages(PluginCall call) {
        JSArray arr = call.getArray("packages", new JSArray());
        PackageManager pm = getContext().getPackageManager();
        JSArray out = new JSArray();
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                String pkg = null;
                try {
                    pkg = arr.getString(i);
                } catch (Exception ignored) {
                    continue;
                }
                if (TextUtils.isEmpty(pkg)) continue;
                JSObject row = new JSObject();
                row.put("packageName", pkg);
                String label = pkg;
                try {
                    ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                    CharSequence cs = pm.getApplicationLabel(ai);
                    if (cs != null && cs.length() > 0) {
                        label = cs.toString();
                    }
                } catch (Exception ignored) {
                }
                row.put("label", label);
                out.put(row);
            }
        }
        JSObject ret = new JSObject();
        ret.put("labels", out);
        call.resolve(ret);
    }

    private static JSONArray jsonFromSet(Set<String> set) {
        JSONArray arr = new JSONArray();
        for (String s : set) {
            arr.put(s);
        }
        return arr;
    }

    private static boolean isAccessibilityServiceEnabled(Context ctx) {
        int accessibilityEnabled = 0;
        try {
            accessibilityEnabled = Settings.Secure.getInt(
                    ctx.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            return false;
        }

        if (accessibilityEnabled != 1) return false;

        String setting = Settings.Secure.getString(
                ctx.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (setting == null) return false;
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(setting);
        String pkg = ctx.getPackageName();
        String className = ReadingGateAccessibilityService.class.getName();
        while (splitter.hasNext()) {
            String next = splitter.next();
            if (next == null) continue;
            ComponentName cn = ComponentName.unflattenFromString(next);
            if (cn != null
                    && pkg.equals(cn.getPackageName())
                    && className.equals(cn.getClassName())) {
                return true;
            }
        }
        return false;
    }

    private static boolean canDrawOverlays(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        return Settings.canDrawOverlays(ctx);
    }
}
