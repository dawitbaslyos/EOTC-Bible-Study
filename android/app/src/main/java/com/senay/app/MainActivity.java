package com.senay.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppLockPlugin.class);
        super.onCreate(savedInstanceState);
        WidgetAlarmScheduler.startIfWidgetsExist(this);
    }

    @Override
    public void onResume() {
        super.onResume();
        WidgetAlarmScheduler.startIfWidgetsExist(this);
    }
}
