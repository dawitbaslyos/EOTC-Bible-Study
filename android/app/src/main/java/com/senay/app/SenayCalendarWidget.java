package com.senay.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Simple home‑screen widget showing today's Ethiopian date and a compact heatmap bar.
 *
 * NOTE: This reads data that the web app persists into SharedPreferences via Capacitor or
 * another bridge. For now, it will fallback gracefully if no data is present.
 */
public class SenayCalendarWidget extends AppWidgetProvider {

    // Use Capacitor's default storage so we don't need a custom plugin
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_SNAPSHOT = "widget_snapshot";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);

        for (int appWidgetId : appWidgetIds) {
            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            updateWidget(context, appWidgetManager, appWidgetId, options);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateWidget(context, appWidgetManager, appWidgetId, newOptions);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        // Allow manual refresh broadcasts if needed later
        if ("com.senay.app.ACTION_REFRESH_WIDGET".equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            ComponentName cn = new ComponentName(context, SenayCalendarWidget.class);
            int[] ids = mgr.getAppWidgetIds(cn);
            onUpdate(context, mgr, ids);
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle options) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_senay_calendar);

        // Load snapshot JSON from shared prefs
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String snapshotJson = prefs.getString(KEY_SNAPSHOT, null);

        String dateLabel = "Ethiopian Calendar";
        String yearLabel = "";
        String saintOrHoliday = "";
        int streak = 0;
        int[] intensities = new int[0];

        if (snapshotJson != null) {
            try {
                JSONObject obj = new JSONObject(snapshotJson);
                dateLabel = obj.optString("dateLabel", dateLabel);
                yearLabel = obj.optString("yearLabel", yearLabel);
                saintOrHoliday = obj.optString("saintOrHoliday", "");
                streak = obj.optInt("streak", 0);

                JSONArray arr = obj.optJSONArray("monthHeatmap");
                if (arr != null) {
                    intensities = new int[arr.length()];
                    for (int i = 0; i < arr.length(); i++) {
                        intensities[i] = arr.optInt(i, 0);
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        views.setTextViewText(R.id.widget_date, dateLabel);
        views.setTextViewText(R.id.widget_year, yearLabel);
        views.setTextViewText(R.id.widget_saint, saintOrHoliday);

        String streakText = streak > 0 ? "\uD83D\uDD6F " + streak + " days" : "";
        views.setTextViewText(R.id.widget_streak, streakText);

        // Simple visualization: map first 7 intensity values to small blocks
        int[] barIds = {
                R.id.widget_bar_1,
                R.id.widget_bar_2,
                R.id.widget_bar_3,
                R.id.widget_bar_4,
                R.id.widget_bar_5,
                R.id.widget_bar_6,
                R.id.widget_bar_7
        };

        for (int i = 0; i < barIds.length; i++) {
            int intensity = (intensities.length > i) ? intensities[i] : 0;
            int color = mapIntensityToColor(intensity);
            views.setInt(barIds[i], "setBackgroundColor", color);
        }

        // Adjust visibility based on widget size (portrait vs landscape, small vs large)
        int minWidth = 0;
        int minHeight = 0;
        if (options != null) {
            minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
            minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        }
        boolean isPortrait = minHeight > minWidth;
        int area = minWidth * minHeight;

        // Very small area: only show date + saint
        if (area > 0 && area < 4000) {
            views.setViewVisibility(R.id.widget_year, View.GONE);
            views.setViewVisibility(R.id.widget_streak, View.GONE);
            for (int barId : barIds) {
                views.setViewVisibility(barId, View.GONE);
            }
        }
        // Medium area or tall portrait: show date, saint, year; hide bars if too cramped
        else if (area > 0 && area < 9000) {
            views.setViewVisibility(R.id.widget_year, View.VISIBLE);
            views.setViewVisibility(R.id.widget_streak, isPortrait ? View.VISIBLE : View.GONE);
            for (int barId : barIds) {
                views.setViewVisibility(barId, isPortrait ? View.GONE : View.VISIBLE);
            }
        }
        // Large area: show everything
        else {
            views.setViewVisibility(R.id.widget_year, View.VISIBLE);
            views.setViewVisibility(R.id.widget_streak, View.VISIBLE);
            for (int barId : barIds) {
                views.setViewVisibility(barId, View.VISIBLE);
            }
        }

        // Tap widget → open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                Build.VERSION.SDK_INT >= 31
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private int mapIntensityToColor(int intensity) {
        // 0–4 scale matching monthHeatmap
        switch (intensity) {
            case 1:
                return Color.parseColor("#33212b3a"); // light gold-ish
            case 2:
                return Color.parseColor("#66212b3a");
            case 3:
                return Color.parseColor("#99212b3a");
            case 4:
                return Color.parseColor("#FFD4AF37"); // full gold
            default:
                return Color.parseColor("#222222"); // background
        }
    }
}

