#include <WiFi.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>
#include <mbedtls/md.h>
#include <mbedtls/aes.h>

const char *DEVICE_ID = "ESP32-UNIVERSAL-001";
const char *SERVER_HOST = "http://192.168.1.5:5000";
const char *DEVICE_SECRET = "device-shared-secret";
const int RELAY_PIN = 25;

LiquidCrystal_I2C lcd(0x27, 16, 2);
Preferences preferences;
WebSocketsClient websocket;

String wifiSsid;
String wifiPassword;
String sessionToken;

void setup()
{
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  lcd.init();
  lcd.backlight();
  lcd.print("Universal Bell");

  preferences.begin("bell", false);
  wifiSsid = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("pass", "");

  if (wifiSsid.isEmpty())
  {
    openProvisioningMode();
  }
  connectWiFi();
  requestSession();
  connectWebsocket();
}

void loop()
{
  websocket.loop();
}

void openProvisioningMode()
{
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("Bell-Provision", "belltower");
  lcd.clear();
  lcd.print("AP: Bell-Provision");
  // Implement captive portal or serial provisioning as needed
  while (wifiSsid.isEmpty())
  {
    delay(1000);
  }
}

void connectWiFi()
{
  lcd.clear();
  lcd.print("Connecting WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid.c_str(), wifiPassword.c_str());
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  lcd.clear();
  lcd.print("WiFi Connected");
}

String hmac(String payload)
{
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
  for (int i = 0; i < 32; i++)
  {
    sprintf(&hexResult[i * 2], "%02x", (unsigned int)hmacResult[i]);
  }
  return String(hexResult);
}

void requestSession()
{
  HTTPClient client;
  String url = String(SERVER_HOST) + "/api/device/session";
  client.begin(url);
  client.addHeader("Content-Type", "application/json");
  String timestamp = String(millis());
  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = timestamp;
  doc["signature"] = hmac(DEVICE_ID + String(":") + timestamp);
  String payload;
  serializeJson(doc, payload);
  int status = client.POST(payload);
  if (status == 200)
  {
    DynamicJsonDocument response(512);
    deserializeJson(response, client.getString());
    sessionToken = response["sessionToken"].as<String>();
    lcd.clear();
    lcd.print("Server linked");
  }
  else
  {
    lcd.clear();
    lcd.print("Auth failed");
  }
  client.end();
}

void connectWebsocket()
{
  websocket.begin("192.168.1.5", 5000, "/socket.io/?EIO=4&transport=websocket");
  websocket.onEvent(onSocketEvent);
  websocket.setReconnectInterval(5000);
}

void onSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
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

void sendRegistration()
{
  DynamicJsonDocument doc(256);
  doc["event"] = "device:register";
  doc["data"]["sessionToken"] = sessionToken;
  String message;
  serializeJson(doc, message);
  websocket.sendTXT(message);
}

void handleMessage(const String &message)
{
  DynamicJsonDocument doc(512);
  deserializeJson(doc, message);
  const char *event = doc["event"];
  if (strcmp(event, "ring") == 0)
  {
    int duration = doc["data"]["duration"] | 5;
    triggerRelay(duration);
  }
  else if (strcmp(event, "emergency_on") == 0)
  {
    triggerRelay(10);
  }
}

void triggerRelay(int seconds)
{
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
