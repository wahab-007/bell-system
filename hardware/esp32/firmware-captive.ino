#include <WiFi.h>
#include <WiFiManager.h>     // Captive portal library
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <esp_timer.h>
#include <LiquidCrystal_I2C.h>
#include <mbedtls/md.h>

const char *DEVICE_ID = "esp-001";
const char *DEVICE_SECRET = "espxyz098";            // must match server bell record
const char *DEVICE_HMAC_SECRET = "39fhs873HJbas92"; // server env DEVICE_HMAC_SECRET
const char *SERVER_HOST = "https://bell-system-server.onrender.com";  // HTTP API base
const char *SERVER_WS_HOST = "bell-system-server.onrender.com";       // WebSocket host (no protocol)
const uint16_t SERVER_WS_PORT = 443;
const int RELAY_PIN = 25;

// Optional setup button (hold LOW at boot to force portal)
const int SETUP_BTN = 27;

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebSocketsClient wsClient;

String sessionToken;
int nextBellMinutes = -1;
uint64_t nextBellTargetMs = 0;
int lastShownSeconds = -2;
bool socketConnected = false;

// ---------- forward declarations ----------
String hmac(String payload);
void requestSession();
void connectWebsocket();
void onSocketEvent(WStype_t type, uint8_t *payload, size_t length);
void handleWsMessage(const String &message);
void sendRegistration();
void triggerRelay(int seconds);
void displayNextBell();
int computeRemainingSeconds();

// ---------- WiFiManager callbacks ----------
void configModeCallback(WiFiManager *wm) {
  lcd.clear();
  lcd.print("Setup WiFi AP:");
  lcd.setCursor(0, 1);
  lcd.print(wm->getConfigPortalSSID());  // Bell-Provision
}

void saveConfigCallback() {
  lcd.clear();
  lcd.print("WiFi saved!");
  delay(800);
}

// ---------- setup ----------
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  pinMode(SETUP_BTN, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();
  lcd.print("Universal Bell");
  delay(1200);

  WiFi.mode(WIFI_STA);

  WiFiManager wm;
  wm.setAPCallback(configModeCallback);
  wm.setSaveConfigCallback(saveConfigCallback);

  // Portal stays open for 3 minutes if user doesn't configure
  wm.setConfigPortalTimeout(180);

  lcd.clear();
  lcd.print("Connecting WiFi");

  bool forcePortal = (digitalRead(SETUP_BTN) == LOW);

  bool res;
  if (forcePortal) {
    // User forced setup
    res = wm.startConfigPortal("Bell-Provision", "belltower");
  } else {
    // Auto connect; if fail -> captive portal
    res = wm.autoConnect("Bell-Provision", "belltower");
  }

  if (!res) {
    lcd.clear();
    lcd.print("WiFi not set");
    lcd.setCursor(0,1);
    lcd.print("Rebooting...");
    delay(1500);
    ESP.restart();
  }

  lcd.clear();
  lcd.print("WiFi Connected");
  delay(800);

  // Continue your existing workflow
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

// ---------- HMAC SHA256 signature ----------
String hmac(String payload) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)DEVICE_HMAC_SECRET, strlen(DEVICE_HMAC_SECRET));
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  char hexResult[65];
  for (int i = 0; i < 32; i++) {
    sprintf(&hexResult[i * 2], "%02x", (unsigned int)hmacResult[i]);
  }
  return String(hexResult);
}

// ---------- Request session token ----------
void requestSession() {
  HTTPClient client;
  String url = String(SERVER_HOST) + "/api/device/session";
  client.begin(url);
  client.addHeader("Content-Type", "application/json");

  String timestamp = String(millis());

  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceSecret"] = DEVICE_SECRET;
  doc["timestamp"] = timestamp;
  doc["signature"] = hmac(String(DEVICE_ID) + ":" + DEVICE_SECRET + ":" + timestamp);

  String payload;
  serializeJson(doc, payload);

  int status = client.POST(payload);

  if (status == 200) {
    DynamicJsonDocument response(512);
    deserializeJson(response, client.getString());
    sessionToken = response["sessionToken"].as<String>();
    nextBellMinutes = response["nextBell"]["minutes"] | -1;
    if (nextBellMinutes >= 0) {
      uint64_t nowMs = (uint64_t)esp_timer_get_time() / 1000ULL;
      nextBellTargetMs = nowMs + (uint64_t)nextBellMinutes * 60000ULL;
    } else {
      nextBellTargetMs = 0;
    }

    lcd.clear();
    lcd.print("Server linked");
    displayNextBell();
    if (socketConnected) {
      sendRegistration();
    }
  } else {
    lcd.clear();
    lcd.print("Auth failed");
  }
  client.end();
}

// ---------- Socket.IO over WebSocketsClient ----------
void connectWebsocket() {
  wsClient.beginSSL(SERVER_WS_HOST, SERVER_WS_PORT, "/socket.io/?EIO=4&transport=websocket");
  wsClient.setReconnectInterval(5000);
  wsClient.onEvent(onSocketEvent);
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
      triggerRelay(duration);
      requestSession();
    } else if (strcmp(event, "emergency_on") == 0) {
      triggerRelay(10);
      requestSession();
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
  wsClient.sendTXT("42" + message);
}

// ---------- Relay trigger ----------
void triggerRelay(int seconds) {
  lcd.clear();
  lcd.print("Ringing ");
  lcd.print(seconds);
  lcd.print("s");

  digitalWrite(RELAY_PIN, HIGH);
  delay(seconds * 1000);
  digitalWrite(RELAY_PIN, LOW);

  lcd.clear();
  lcd.print("Idle");
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
  uint64_t now = (uint64_t)esp_timer_get_time() / 1000ULL;
  uint64_t remainingMs = (nextBellTargetMs > now) ? (nextBellTargetMs - now) : 0;
  if (remainingMs == 0) return 0;
  return (int)((remainingMs + 999ULL) / 1000ULL);
}
