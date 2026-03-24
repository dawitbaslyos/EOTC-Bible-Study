package com.senay.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/**
 * Keeps the calendar widget correct: Ethiopian date at local midnight via {@link AlarmManager}, and
 * clock text via {@link Intent#ACTION_TIME_TICK} (see {@link WidgetTimeTickRegistration}) — no
 * per-minute alarms.
 */
public final class WidgetAlarmScheduler {

    public static final String ACTION_WIDGET_MIDNIGHT = "com.senay.app.ACTION_WIDGET_MIDNIGHT";

    private static final int REQ_MINUTE_LEGACY = 4401;
    private static final int REQ_MIDNIGHT = 4402;

    private WidgetAlarmScheduler() {}

    public static boolean hasWidgets(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SenayCalendarWidget.class));
        return ids != null && ids.length > 0;
    }

    public static void startIfWidgetsExist(Context context) {
        if (!hasWidgets(context)) return;
        cancelLegacyMinuteTickAlarm(context);
        WidgetTimeTickRegistration.register(context);
        scheduleNextMidnight(context);
    }

    public static void stop(Context context) {
        WidgetTimeTickRegistration.unregister(context);
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        cancelLegacyMinuteTickAlarm(context);
        am.cancel(midnightPendingIntent(context));
    }

    /** Cancels older builds’ per-minute widget alarms (replaced by {@link Intent#ACTION_TIME_TICK}). */
    private static void cancelLegacyMinuteTickAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(legacyMinutePendingIntent(context));
    }

    private static PendingIntent legacyMinutePendingIntent(Context context) {
        Intent i = new Intent(context, WidgetAlarmReceiver.class);
        i.setAction("com.senay.app.ACTION_WIDGET_MINUTE_TICK");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, REQ_MINUTE_LEGACY, i, flags);
    }

    static void scheduleNextMidnight(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 3);
        c.set(Calendar.MILLISECOND, 0);
        long next = c.getTimeInMillis();

        PendingIntent pi = midnightPendingIntent(context);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                am.setExact(AlarmManager.RTC_WAKEUP, next, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, next, pi);
            }
        } catch (SecurityException ignored) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi);
        }
    }

    private static PendingIntent midnightPendingIntent(Context context) {
        Intent i = new Intent(context, WidgetAlarmReceiver.class);
        i.setAction(ACTION_WIDGET_MIDNIGHT);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, REQ_MIDNIGHT, i, flags);
    }
}
