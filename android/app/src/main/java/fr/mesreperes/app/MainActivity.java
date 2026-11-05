package fr.mesreperes.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null) {
            getBridge().triggerWindowJSEvent("mes-reperes-resume");
        }
    }
}
