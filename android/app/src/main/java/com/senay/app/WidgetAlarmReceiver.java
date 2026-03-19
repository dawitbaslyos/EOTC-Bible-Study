package com.senay.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WidgetAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_DATE_CHANGED.equals(action)
                || WidgetAlarmScheduler.ACTION_WIDGET_MINUTE_TICK.equals(action)
                || WidgetAlarmScheduler.ACTION_WIDGET_MIDNIGHT.equals(action)) {

            SenayCalendarWidget.refreshAll(context);

            // Alarms are cleared after reboot — reschedule when anything time-related changes.
            if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                    || Intent.ACTION_TIME_CHANGED.equals(action)
                    || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                    || Intent.ACTION_DATE_CHANGED.equals(action)) {
                WidgetAlarmScheduler.startIfWidgetsExist(context);
            }

            if (WidgetAlarmScheduler.ACTION_WIDGET_MINUTE_TICK.equals(action)) {
                WidgetAlarmScheduler.scheduleNextMinuteTick(context);
            }
            if (WidgetAlarmScheduler.ACTION_WIDGET_MIDNIGHT.equals(action)) {
                WidgetAlarmScheduler.scheduleNextMidnight(context);
            }
        }
    }
}
