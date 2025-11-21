#include <WiFi.h>
#include <WiFiManager.h>     // Captive portal library
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <LiquidCrystal_I2C.h>
#include <mbedtls/md.h>

const char *DEVICE_ID = "ESP32-UNIVERSAL-001";
const char *DEVICE_SECRET = "device-shared-secret";  // must match the portal entry
const char *SERVER_HOST = "http://127.0.0.1:5000";   // HTTP API base
const char *SERVER_WS_HOST = "127.0.0.1";            // WebSocket host (no protocol)
const uint16_t SERVER_WS_PORT = 5000;
const int RELAY_PIN = 25;

// Optional setup button (hold LOW at boot to force portal)
const int SETUP_BTN = 27;

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebSocketsClient websocket;

String sessionToken;

// ---------- forward declarations ----------
String hmac(String payload);
void requestSession();
void connectWebsocket();
void onSocketEvent(WStype_t type, uint8_t *payload, size_t length);
void sendRegistration();
void handleMessage(const String &message);
void triggerRelay(int seconds);

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
  websocket.loop();
}

// ---------- HMAC SHA256 signature ----------
String hmac(String payload) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)DEVICE_SECRET, strlen(DEVICE_SECRET));
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

    lcd.clear();
    lcd.print("Server linked");
  } else {
    lcd.clear();
    lcd.print("Auth failed");
  }
  client.end();
}

// ---------- Websocket ----------
void connectWebsocket() {
  websocket.begin(SERVER_WS_HOST, SERVER_WS_PORT, "/socket.io/?EIO=4&transport=websocket");
  websocket.onEvent(onSocketEvent);
  websocket.setReconnectInterval(5000);
}

void onSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      lcd.clear();
      lcd.print("Socket online");
      sendRegistration();
      break;

    case WStype_TEXT:
      handleMessage((char *)payload);
      break;

    case WStype_DISCONNECTED:
      lcd.clear();
      lcd.print("Socket lost");
      break;

    default:
      break;
  }
}

void sendRegistration() {
  DynamicJsonDocument doc(256);
  doc["event"] = "device:register";
  doc["data"]["sessionToken"] = sessionToken;

  String message;
  serializeJson(doc, message);
  websocket.sendTXT(message);
}

// ---------- Handle messages ----------
void handleMessage(const String &message) {
  DynamicJsonDocument doc(512);
  deserializeJson(doc, message);
  const char *event = doc["event"];

  if (strcmp(event, "ring") == 0) {
    int duration = doc["data"]["duration"] | 5;
    triggerRelay(duration);
  }
  else if (strcmp(event, "emergency_on") == 0) {
    triggerRelay(10);
  }
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
