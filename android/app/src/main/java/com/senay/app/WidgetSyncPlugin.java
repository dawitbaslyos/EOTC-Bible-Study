package com.senay.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@NativePlugin(name = "WidgetSync")
public class WidgetSyncPlugin extends Plugin {

    private static final String PREFS_NAME = "senay_widget_prefs";
    private static final String KEY_SNAPSHOT = "senay_widget_snapshot";

    @PluginMethod
    public void saveSnapshot(PluginCall call) {
        String snapshot = call.getString("snapshot", null);
        if (snapshot == null) {
            call.reject("Missing snapshot");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_SNAPSHOT, snapshot).apply();

        // Trigger widget update
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName cn = new ComponentName(context, SenayCalendarWidget.class);
        int[] ids = mgr.getAppWidgetIds(cn);
        if (ids != null && ids.length > 0) {
            new SenayCalendarWidget().onUpdate(context, mgr, ids);
        }

        call.resolve(new JSObject().put("status", "ok"));
    }
}

