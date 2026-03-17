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

    private static final String PREFS_NAME = "senay_widget_prefs";
    private static final String KEY_SNAPSHOT = "senay_widget_snapshot";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_senay_calendar);

            // Load snapshot JSON from shared prefs
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String snapshotJson = prefs.getString(KEY_SNAPSHOT, null);

            String dateLabel = "Ethiopian Calendar";
            String yearLabel = "";
            String saintOrHoliday = "";
            int[] intensities = new int[0];

            if (snapshotJson != null) {
                try {
                    JSONObject obj = new JSONObject(snapshotJson);
                    dateLabel = obj.optString("dateLabel", dateLabel);
                    yearLabel = obj.optString("yearLabel", yearLabel);
                    saintOrHoliday = obj.optString("saintOrHoliday", "");

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

