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

#include <SoftwareSerial.h>
// Serial link to Arduino relay driver (TX only)
const int ARDUINO_TX_PIN = D7; // GPIO13 -> Arduino RX
SoftwareSerial relaySerial(-1, ARDUINO_TX_PIN); // RX unused, TX on D7

// LCD pins (I2C): SDA=D2 (GPIO4), SCL=D1 (GPIO5)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Setup button (hold LOW at boot to force captive portal)
const int SETUP_BTN = D3; // GPIO0 (ensure pull-up)

WebSocketsClient wsClient;

String sessionToken;
bool socketConnected = false;
bool emergencyActive = false;
bool bellOn = false;
unsigned long lastSessionRefreshMs = 0;

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
void displayBellStatus();

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
  relaySerial.begin(9600); // TX only to Arduino
  pinMode(SETUP_BTN, INPUT_PULLUP);

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
  // periodic session refresh to keep token alive (every 5 minutes) or after a failure
  if ((millis() - lastSessionRefreshMs) > 300000) {
    requestSession();
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
    lastSessionRefreshMs = millis();
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
    lcd.clear();
    lcd.print("Server linked");
    displayBellStatus();
    if (socketConnected) sendRegistration();
    lastSessionRefreshMs = millis();
  } else {
    // Log status for debugging; back off before retrying
    Serial.print("Auth failed, status: ");
    Serial.println(status);
    // Keep current LCD content; don't overwrite with error
    lastSessionRefreshMs = millis(); // retry after interval in loop
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
      bellOn = true; // consider circuit on when socket is up
      displayBellStatus();
      Serial.println("WS connected");
      break;
    case WStype_DISCONNECTED:
      socketConnected = false;
      bellOn = false;
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
      displayBellStatus();
      return;
    }

    if (strcmp(event, "ring") == 0) {
      int duration = data["duration"] | 5;
      Serial.print("Ring event, duration: ");
      Serial.println(duration);
      triggerRelay(duration);
    } else if (strcmp(event, "emergency_on") == 0) {
      Serial.println("Emergency event ON");
      emergencyActive = true;
      bellOn = true;
      relaySerial.println("ON"); // latch bell on indefinitely
      lcd.clear();
      lcd.print("EMERGENCY ON");
    } else if (strcmp(event, "emergency_off") == 0) {
      Serial.println("Emergency event OFF");
      emergencyActive = false;
      relaySerial.println("OFF"); // stop bell
      requestSession();
      displayBellStatus();
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
  lcd.print("Bell ringing");
  lcd.setCursor(0, 1);
  lcd.print(seconds);
  lcd.print("s");
  bellOn = true;

  // Send ring command to Arduino and reset next-bell tracking
  relaySerial.print("RING ");
  relaySerial.println(seconds);

  // Show ring duration then refresh next bell
  delay(seconds * 1000);
  bellOn = true; // stay ON status after ring completes
  displayBellStatus();
}

void setBulbChannel(int channel, bool state) {
  if (channel < 1 || channel > 3) return;
  relaySerial.print("BULB ");
  relaySerial.print(channel);
  relaySerial.print(" ");
  relaySerial.println(state ? "ON" : "OFF");
  lcd.clear();
  lcd.print("Bulb ");
  lcd.print(channel);
  lcd.print(state ? " ON" : " OFF");
  delay(5000);
  displayBellStatus();
}

void displayBellStatus() {
  lcd.clear();
  lcd.print("Bell status: ");
  lcd.setCursor(0, 1);
  lcd.print(bellOn ? "ON " : "OFF");
  if (emergencyActive) {
    lcd.print(" EMERGENCY");
  }
}
