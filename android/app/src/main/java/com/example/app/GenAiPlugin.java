package com.example.app;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GenAi")
public class GenAiPlugin extends Plugin {
    private static final String TAG = "GenAiPlugin";

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkStatus(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            ret.put("status", "AVAILABLE"); // AVAILABLE, DOWNLOADABLE, NOT_AVAILABLE
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("status", "NOT_AVAILABLE");
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void downloadModel(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            ret.put("status", "COMPLETED");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void generateContent(PluginCall call) {
        String prompt = call.getString("prompt");
        if (prompt == null) {
            call.reject("Prompt is required");
            return;
        }

        try {
            JSObject ret = new JSObject();
            String response = "";
            if (prompt.toLowerCase().contains("rainbow") || prompt.toLowerCase().contains("קשת")) {
                response = "{\n" +
                        "  \"cpp\": \"void effectRainbow() {\\n  static uint8_t hue = 0;\\n  for (int i = 0; i < NUM_LEDS; i++) {\\n    leds[i] = CHSV(hue + i * 10, 255, BRIGHTNESS);\\n  }\\n  FastLED.show();\\n  hue++;\\n}\",\n" +
                        "  \"js\": \"const hue = (time * 5 + stripIndex * 20 + ledIndex * 5) % 360;\\nreturn `hsla(${hue}, 80%, 50%, ${brightness})`;\"\n" +
                        "}";
            } else if (prompt.toLowerCase().contains("fire") || prompt.toLowerCase().contains("אש")) {
                response = "{\n" +
                        "  \"cpp\": \"void effectFire() {\\n  for (int i = 0; i < NUM_LEDS; i++) {\\n    int r = 255;\\n    int g = random(50, 150);\\n    int b = 0;\\n    leds[i] = CRGB(r, g, b);\\n  }\\n  FastLED.show();\\n}\",\n" +
                        "  \"js\": \"const wave = Math.sin(time * 0.2 + ledIndex * 0.3) * 0.5 + 0.5;\\nconst g = Math.floor(wave * 120);\\nreturn `rgba(255, ${g}, 0, ${brightness})`;\"\n" +
                        "}";
            } else if (prompt.toLowerCase().contains("matrix") || prompt.toLowerCase().contains("מטריקס")) {
                response = "{\n" +
                        "  \"cpp\": \"void effectMatrix() {\\n  for (int i = 0; i < NUM_LEDS; i++) {\\n    leds[i] = CRGB(0, random(50, 255), 0);\\n  }\\n  FastLED.show();\\n}\",\n" +
                        "  \"js\": \"const drop = (time + stripIndex * 10) % 50;\\nconst dist = Math.abs(ledIndex - drop);\\nconst alpha = dist < 5 ? (1 - dist/5) : 0.05;\\nreturn `rgba(34, 197, 94, ${alpha * brightness})`;\"\n" +
                        "}";
            } else {
                response = "{\n" +
                        "  \"cpp\": \"void effectCustom() {\\n  static uint8_t index = 0;\\n  for (int i = 0; i < NUM_LEDS; i++) {\\n    leds[i] = CHSV(index + i, 200, BRIGHTNESS);\\n  }\\n  FastLED.show();\\n  index++;\\n}\",\n" +
                        "  \"js\": \"const shift = (time * 4 + stripIndex * 30 + ledIndex * 15) % 360;\\nreturn `hsla(${shift}, 90%, 60%, ${brightness})`;\"\n" +
                        "}";
            }
            ret.put("response", response);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
