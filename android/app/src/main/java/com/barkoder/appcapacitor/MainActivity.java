package com.barkoder.appcapacitor;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the Capacitor WebView transparent so native camera preview can
        // be rendered behind it and UI controls can be overlaid from the web layer.
        if (getBridge() != null && getBridge().getWebView() != null) {
            View webView = getBridge().getWebView();
            webView.setBackgroundColor(Color.TRANSPARENT);
            if (webView.getBackground() != null) {
                webView.getBackground().setAlpha(0);
            }

            View webViewParent = (View) webView.getParent();
            if (webViewParent != null) {
                webViewParent.setBackgroundColor(Color.TRANSPARENT);
            }

            getWindow().getDecorView().setBackgroundColor(Color.TRANSPARENT);
        }
    }
}
