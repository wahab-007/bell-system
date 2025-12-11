// ESP8266 captive portal + websocket client that forwards bell/bulb commands to an Arduino relay driver (5V) over UART.
// Uses WiFiManager for provisioning, HTTP to fetch session token, and Socket.IO-compatible WebSockets for events.
// LCD via I2C (default SDA=D2/GPIO4, SCL=D1/GPIO5). Setup button on D3/GPIO0.
// Serial logging on USB; SoftwareSerial TX to Arduino (set pin below).

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <bearssl/bearssl_hmac.h>
#include <SoftwareSerial.h>

const char *DEVICE_ID = "maju-001";
const char *DEVICE_SECRET = "majuxyz001";            // must match server bell record
const char *DEVICE_HMAC_SECRET = "39fhs873HJbas92";  // server env DEVICE_HMAC_SECRET
const char *SERVER_HOST = "https://bell-system-server.onrender.com";   // HTTP API base
const char *SERVER_WS_HOST = "bell-system-server.onrender.com";        // WebSocket host (no protocol)
const uint16_t SERVER_WS_PORT = 443;

// Direct GPIO drive to Arduino level-shifter/relay bridge (3.3V -> 5V)
// Using 3 bulb lines + 1 bell line (repurposed 4th channel)
const int BELL_OUT_PIN = D0;              // GPIO16 -> Arduino bell input
const int BULB_OUT_PINS[3] = {D5, D6, D7}; // Bulb1=B5(14), Bulb2=D6(12), Bulb3=D7(13)

// LCD pins (I2C): SDA=D2 (GPIO4), SCL=D1 (GPIO5)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Setup button (hold LOW at boot to force captive portal)
const int SETUP_BTN = D3; // GPIO0 (ensure pull-up)

WebSocketsClient wsClient;

String sessionToken;
int nextBellMinutes = -1;
uint64_t nextBellTargetMs = 0;
int lastShownSeconds = -2;
bool socketConnected = false;
bool bulbState[3] = {false, false, false};

String hmac(String payload) {
  br_hmac_key_context kc;
  br_hmac_context ctx;
  br_hmac_key_init(&kc, &br_sha256_vtable, (const unsigned char *)DEVICE_HMAC_SECRET, strlen(DEVICE_HMAC_SECRET));
  br_hmac_init(&ctx, &kc, 0);
  br_hmac_update(&ctx, (const unsigned char *)payload.c_str(), payload.length());
  unsigned char out[32];
  br_hmac_out(&ctx, out);
  char hex[65];
  for (int i = 0; i < 32; i++) {
    sprintf(&hex[i * 2], "%02x", (unsigned int)out[i]);
  }
  hex[64] = '\0';
  return String(hex);
}

void requestSession();
void connectWebsocket();
void onSocketEvent(WStype_t type, uint8_t *payload, size_t length);
void handleWsMessage(const String &message);
void sendRegistration();
void triggerRelay(int seconds);
void setBulbChannel(int channel, bool state);
void displayNextBell();
int computeRemainingSeconds();

void configModeCallback(WiFiManager *wm) {
  lcd.clear();
  lcd.print("Setup WiFi AP:");
  lcd.setCursor(0, 1);
  lcd.print(wm->getConfigPortalSSID()); // Bell-Provision
}

void saveConfigCallback() {
  lcd.clear();
  lcd.print("WiFi saved!");
  delay(800);
}

void setup() {
  Serial.begin(115200);
  pinMode(SETUP_BTN, INPUT_PULLUP);
  pinMode(BELL_OUT_PIN, OUTPUT);
  digitalWrite(BELL_OUT_PIN, LOW);
  for (int i = 0; i < 3; i++) {
    pinMode(BULB_OUT_PINS[i], OUTPUT);
    digitalWrite(BULB_OUT_PINS[i], LOW);
  }

  Wire.begin(D2, D1); // SDA, SCL
  lcd.begin();
  lcd.backlight();
  lcd.print("Universal Bell");
  delay(1200);

  WiFi.mode(WIFI_STA);

  WiFiManager wm;
  wm.setAPCallback(configModeCallback);
  wm.setSaveConfigCallback(saveConfigCallback);
  wm.setConfigPortalTimeout(180);

  lcd.clear();
  lcd.print("Connecting WiFi");

  bool forcePortal = (digitalRead(SETUP_BTN) == LOW);
  bool res = false;
  if (forcePortal) {
    res = wm.startConfigPortal("Bell-Provision", "belltower");
  } else {
    res = wm.autoConnect("Bell-Provision", "belltower");
  }

  if (!res) {
    lcd.clear();
    lcd.print("WiFi not set");
    lcd.setCursor(0, 1);
    lcd.print("Rebooting...");
    delay(1500);
    ESP.restart();
  }

  lcd.clear();
  lcd.print("WiFi Connected");
  delay(800);

  requestSession();
  connectWebsocket();
}

void loop() {
  wsClient.loop();
  int remainingSec = computeRemainingSeconds();
  if (remainingSec != lastShownSeconds) {
    nextBellMinutes = (remainingSec >= 0) ? (remainingSec + 59) / 60 : -1;
    displayNextBell();
  }
}

void requestSession() {
  WiFiClientSecure client;
  client.setInsecure(); // for testing; replace with cert validation in production
  HTTPClient http;
  String url = String(SERVER_HOST) + "/api/device/session";

  if (!http.begin(client, url)) {
    lcd.clear();
    lcd.print("HTTP begin fail");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  String timestamp = String(millis());

  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceSecret"] = DEVICE_SECRET;
  doc["timestamp"] = timestamp;
  doc["signature"] = hmac(String(DEVICE_ID) + ":" + DEVICE_SECRET + ":" + timestamp);

  String payload;
  serializeJson(doc, payload);

  int status = http.POST(payload);
  if (status == 200) {
    DynamicJsonDocument response(512);
    deserializeJson(response, http.getString());
    sessionToken = response["sessionToken"].as<String>();
    nextBellMinutes = response["nextBell"]["minutes"] | -1;
    if (nextBellMinutes >= 0) {
      uint64_t nowMs = millis();
      nextBellTargetMs = nowMs + (uint64_t)nextBellMinutes * 60000ULL;
    } else {
      nextBellTargetMs = 0;
    }
    lcd.clear();
    lcd.print("Server linked");
    displayNextBell();
    if (socketConnected) sendRegistration();
  } else {
    lcd.clear();
    lcd.print("Auth failed");
  }
  http.end();
}

void connectWebsocket() {
  wsClient.beginSSL(SERVER_WS_HOST, SERVER_WS_PORT, "/socket.io/?EIO=4&transport=websocket");
  wsClient.setReconnectInterval(5000);
  wsClient.onEvent(onSocketEvent);
  Serial.println("Connecting websocket...");
}

void onSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      socketConnected = true;
      displayNextBell();
      Serial.println("WS connected");
      break;
    case WStype_DISCONNECTED:
      socketConnected = false;
      lcd.clear();
      lcd.print("Socket closed");
      Serial.println("WS disconnected");
      sessionToken = "";
      requestSession();
      break;
    case WStype_TEXT: {
      String msg;
      for (size_t i = 0; i < length; i++) msg += (char)payload[i];
      handleWsMessage(msg);
      break;
    }
    default:
      break;
  }
}

void handleWsMessage(const String &message) {
  if (message.length() == 0) return;

  if (message.startsWith("0")) {
    wsClient.sendTXT("40");
    return;
  }

  if (message.startsWith("40")) {
    if (sessionToken.length()) sendRegistration();
    return;
  }

  if (message == "2") {
    wsClient.sendTXT("3");
    return;
  }

  if (message.startsWith("42")) {
    String json = message.substring(2);
    DynamicJsonDocument doc(1024);
    if (deserializeJson(doc, json)) {
      Serial.println("Bad WS JSON:");
      Serial.println(json);
      return;
    }
    const char *event = doc[0] | "";
    JsonVariantConst data = doc[1];
    Serial.print("Event: ");
    Serial.println(event);

    if (strcmp(event, "device:error") == 0) {
      const char *msg = data["message"] | "";
      Serial.print("Device error: ");
      Serial.println(msg);
      sessionToken = "";
      requestSession();
      return;
    }

    if (strcmp(event, "device:ack") == 0) {
      displayNextBell();
      return;
    }

    if (strcmp(event, "ring") == 0) {
      int duration = data["duration"] | 5;
      Serial.print("Ring event, duration: ");
      Serial.println(duration);
      triggerRelay(duration);
    } else if (strcmp(event, "emergency_on") == 0) {
      Serial.println("Emergency event");
      triggerRelay(10);
    } else if (strcmp(event, "bulb:set") == 0) {
      int channel = data["channel"] | 1;
      bool state = data["state"] | false;
      Serial.print("Bulb set ch ");
      Serial.print(channel);
      Serial.print(" -> ");
      Serial.println(state ? "ON" : "OFF");
      setBulbChannel(channel, state);
    }
    return;
  }

  Serial.print("WS frame: ");
  Serial.println(message);
}

void sendRegistration() {
  if (sessionToken.length() == 0) return;
  DynamicJsonDocument doc(256);
  JsonArray arr = doc.to<JsonArray>();
  arr.add("device:register");
  JsonObject data = arr.createNestedObject();
  data["sessionToken"] = sessionToken;
  String message;
  serializeJson(doc, message);
  String payload = "42" + message;
  wsClient.sendTXT(payload);
}

void triggerRelay(int seconds) {
  lcd.clear();
  lcd.print("Ringing ");
  lcd.print(seconds);
  lcd.print("s");
  digitalWrite(BELL_OUT_PIN, HIGH);
  for (int i = seconds; i > 0; i--) {
    lcd.setCursor(0, 1);
    lcd.print("Left: ");
    lcd.print(i);
    lcd.print("s   ");
    delay(1000);
  }
  digitalWrite(BELL_OUT_PIN, LOW);
  requestSession();
  displayNextBell();
}

void setBulbChannel(int channel, bool state) {
  if (channel < 1 || channel > 3) return;
  int idx = channel - 1;
  bulbState[idx] = state;
  digitalWrite(BULB_OUT_PINS[idx], state ? HIGH : LOW);
  lcd.clear();
  lcd.print("Bulb ");
  lcd.print(channel);
  lcd.print(state ? " ON" : " OFF");
  delay(5000);
  displayNextBell();
}

void displayNextBell() {
  lcd.clear();
  int remainingSec = computeRemainingSeconds();
  if (remainingSec > 0) {
    int mins = remainingSec / 60;
    int secs = remainingSec % 60;
    lcd.print("Next in ");
    lcd.print(mins);
    lcd.print("m ");
    if (secs < 10) lcd.print("0");
    lcd.print(secs);
    lastShownSeconds = remainingSec;
  } else if (remainingSec == 0) {
    lcd.print("Next in 0m 00");
    lastShownSeconds = 0;
  } else {
    lcd.print(socketConnected ? "Socket online" : "Idle");
    lastShownSeconds = -1;
  }
}

int computeRemainingSeconds() {
  if (nextBellTargetMs == 0) return -1;
  uint64_t now = millis();
  uint64_t remainingMs = (nextBellTargetMs > now) ? (nextBellTargetMs - now) : 0;
  if (remainingMs == 0) return 0;
  return (int)((remainingMs + 999ULL) / 1000ULL);
}
