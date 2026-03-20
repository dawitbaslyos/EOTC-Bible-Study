package com.senay.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Home-screen widget: Ethiopian date from {@link EthiopianDateHelper}; saint/holiday/streak from
 * {@code widget_snapshot}. Refreshes on schedule via {@link WidgetAlarmScheduler}.
 */
public class SenayCalendarWidget extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_SNAPSHOT = "widget_snapshot";

    public static void refreshAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName cn = new ComponentName(context, SenayCalendarWidget.class);
        int[] ids = mgr.getAppWidgetIds(cn);
        for (int appWidgetId : ids) {
            Bundle options = mgr.getAppWidgetOptions(appWidgetId);
            updateAppWidget(context, mgr, appWidgetId, options);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);
        for (int appWidgetId : appWidgetIds) {
            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            updateAppWidget(context, appWidgetManager, appWidgetId, options);
        }
        WidgetAlarmScheduler.startIfWidgetsExist(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        WidgetAlarmScheduler.startIfWidgetsExist(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetAlarmScheduler.stop(context);
        super.onDisabled(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId, newOptions);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if ("com.senay.app.ACTION_REFRESH_WIDGET".equals(intent.getAction())) {
            refreshAll(context);
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle options) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_senay_calendar);

        EthiopianDateHelper.EthiopianDate eth = EthiopianDateHelper.getEthiopianDateNow();
        String dateLabel = eth.dateLabel();
        String yearLabel = eth.yearName;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String snapshotJson = prefs.getString(KEY_SNAPSHOT, null);

        String saintOrHoliday = "";
        int streak = 0;

        if (snapshotJson != null) {
            try {
                JSONObject obj = new JSONObject(snapshotJson);
                saintOrHoliday = obj.optString("saintOrHoliday", "");
                streak = obj.optInt("streak", 0);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        views.setTextViewText(R.id.widget_date, dateLabel);
        views.setTextViewText(R.id.widget_year, yearLabel);
        views.setTextViewText(R.id.widget_saint, saintOrHoliday);

        String streakText = streak > 0 ? "\uD83D\uDD6F " + streak + " days" : "";
        views.setTextViewText(R.id.widget_streak, streakText);

        int minWidth = 0;
        int minHeight = 0;
        if (options != null) {
            minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
            minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        }
        boolean isPortrait = minHeight > minWidth;
        int area = minWidth * minHeight;

        if (area > 0 && area < 4000) {
            views.setViewVisibility(R.id.widget_year, View.GONE);
            views.setViewVisibility(R.id.widget_streak, View.GONE);
        } else if (area > 0 && area < 9000) {
            views.setViewVisibility(R.id.widget_year, View.VISIBLE);
            views.setViewVisibility(R.id.widget_streak, isPortrait ? View.VISIBLE : View.GONE);
        } else {
            views.setViewVisibility(R.id.widget_year, View.VISIBLE);
            views.setViewVisibility(R.id.widget_streak, View.VISIBLE);
        }

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
