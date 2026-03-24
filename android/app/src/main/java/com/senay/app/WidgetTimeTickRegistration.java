package com.senay.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

/**
 * Registers for {@link Intent#ACTION_TIME_TICK} so the calendar widget can refresh its clock without
 * waking the device every minute via {@link android.app.AlarmManager}. TIME_TICK must be registered
 * dynamically (not in the manifest).
 */
public final class WidgetTimeTickRegistration {

    private static final Object LOCK = new Object();
    private static BroadcastReceiver receiver;
    private static boolean registered;

    private WidgetTimeTickRegistration() {}

    public static void register(Context context) {
        synchronized (LOCK) {
            if (registered) {
                return;
            }
            Context app = context.getApplicationContext();
            if (!WidgetAlarmScheduler.hasWidgets(app)) {
                return;
            }
            receiver =
                    new BroadcastReceiver() {
                        @Override
                        public void onReceive(Context ctx, Intent intent) {
                            if (intent == null || !Intent.ACTION_TIME_TICK.equals(intent.getAction())) {
                                return;
                            }
                            if (WidgetAlarmScheduler.hasWidgets(ctx)) {
                                SenayCalendarWidget.refreshAll(ctx);
                            } else {
                                unregister(ctx);
                            }
                        }
                    };
            IntentFilter filter = new IntentFilter(Intent.ACTION_TIME_TICK);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                app.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                app.registerReceiver(receiver, filter);
            }
            registered = true;
        }
    }

    public static void unregister(Context context) {
        synchronized (LOCK) {
            if (!registered || receiver == null) {
                return;
            }
            try {
                context.getApplicationContext().unregisterReceiver(receiver);
            } catch (IllegalArgumentException ignored) {
                // Already unregistered
            }
            receiver = null;
            registered = false;
        }
    }
}
