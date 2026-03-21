package com.senay.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/**
 * Home-screen widget: Ethiopian month (gold) + day + weekday, optional saint/feast + streak.
 * When the widget is resized shorter, rows are hidden (weekday → extras) so the day digit keeps room.
 * Month + day stay visible for almost all sizes; day-only is only for extreme 1-row micro heights.
 */
public class SenayCalendarWidget extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_SNAPSHOT = "widget_snapshot";

    /** OPTION_* values are in dp. */
    /** Only below this (≈1 launcher row): hide month — otherwise month + day always. */
    private static final int HEIGHT_DAY_ONLY_DP = 54;
    private static final int HEIGHT_NO_WEEKDAY_DP = 120;
    private static final int HEIGHT_NO_EXTRAS_DP = 152;

    /** Matches default layout widget_day; Java overrides for squeezed sizes. */
    private static final float DAY_SP_FULL = 46f;
    private static final float DAY_SP_COMPACT = 38f;
    private static final float DAY_SP_TINY = 32f;

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
        Calendar now = Calendar.getInstance(Locale.getDefault());

        String weekday = EthiopianDateHelper.weekdayNameAmharic(now);

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

        views.setTextViewText(R.id.widget_month, eth.monthName);
        views.setTextViewText(R.id.widget_day, String.valueOf(eth.day));
        views.setTextViewText(R.id.widget_weekday, weekday);
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
        boolean hasSize = minWidth > 0 && minHeight > 0;

        boolean hasSaint = saintOrHoliday != null && !saintOrHoliday.trim().isEmpty();
        boolean hasStreak = streak > 0;

        boolean tierTiny = area > 0 && area < 4500;
        boolean tierWeekdayOnly = area > 0 && area < 12000;
        boolean tierMid = area > 0 && area < 22000;

        // Vertical squeeze: weekday & extras drop first; month + day unless height is microscopic
        boolean dayOnlyMode = hasSize && minHeight < HEIGHT_DAY_ONLY_DP;
        boolean noWeekdayMode = hasSize && minHeight < HEIGHT_NO_WEEKDAY_DP;
        boolean noExtrasMode = hasSize && minHeight < HEIGHT_NO_EXTRAS_DP;

        boolean showMonth = !dayOnlyMode;
        boolean showWeekday = showMonth && !noWeekdayMode && !tierTiny;
        boolean showSaint = showMonth && !noWeekdayMode && !noExtrasMode && !tierTiny && !tierWeekdayOnly && hasSaint;
        boolean showStreak = showMonth && !noWeekdayMode && !noExtrasMode && !tierTiny && !tierWeekdayOnly && hasStreak && (!tierMid || isPortrait);

        boolean showDivider = showWeekday && (showSaint || showStreak);

        views.setViewVisibility(R.id.widget_month, showMonth ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_weekday, showWeekday ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_saint, showSaint ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_streak, showStreak ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_divider, showDivider ? View.VISIBLE : View.GONE);

        // Scale day text when vertically compressed (layout default is DAY_SP_FULL sp)
        float daySp = DAY_SP_FULL;
        if (dayOnlyMode) {
            daySp = minHeight < 44 ? DAY_SP_TINY : (minHeight < 50 ? DAY_SP_TINY + 2f : DAY_SP_COMPACT);
        } else if (noWeekdayMode) {
            // Month + day: step down before dropping weekday, so short widgets still read well
            if (minHeight < 80) {
                daySp = DAY_SP_COMPACT;
            } else if (minHeight < 100) {
                daySp = 41f;
            } else {
                daySp = DAY_SP_FULL;
            }
        }
        // Only override XML when squeezed; default + layout-small/large keep their own base sizes
        if (dayOnlyMode || (noWeekdayMode && daySp != DAY_SP_FULL)) {
            views.setTextViewTextSize(R.id.widget_day, TypedValue.COMPLEX_UNIT_SP, daySp);
        }

        // Tighter outer padding when cramped
        Resources res = context.getResources();
        float density = res.getDisplayMetrics().density;
        int padPx = Math.round(8f * density);
        if (dayOnlyMode) {
            padPx = Math.round(4f * density);
        } else if (noWeekdayMode && minHeight < 88) {
            padPx = Math.round(6f * density);
        } else if (noWeekdayMode) {
            padPx = Math.round(7f * density);
        }
        views.setViewPadding(R.id.widget_root, padPx, padPx, padPx, padPx);

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
