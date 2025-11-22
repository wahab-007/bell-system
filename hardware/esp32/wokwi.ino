#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <LiquidCrystal_I2C.h>
#include <mbedtls/md.h>
#include <mbedtls/aes.h>
#include <mbedtls/base64.h>

// --------- Wokwi WiFi ----------
const char *WIFI_SSID = "Wokwi-GUEST";
const char *WIFI_PASS = "";

// --------- Device / Server ----------
const char *DEVICE_ID = "esp-001";
const char *DEVICE_SECRET = "espxyz098";  // must match server bell record

// put your REAL server secrets here:
const char *DEVICE_HMAC_SECRET = "39fhs873HJbas92";   // shared HMAC key (server env DEVICE_HMAC_SECRET)
const char *DEVICE_AES_SECRET  = "Abf93ns87hs9QNf2";  // 16 chars AES-128 key

// Render server base (HTTPS)
const char *SERVER_HOST = "https://bell-system-server.onrender.com";
const char *SERVER_WS_HOST = "bell-system-server.onrender.com";
const uint16_t SERVER_WS_PORT = 443;

#define USE_AES_PAYLOADS 0  // server expects plain sessionToken (no AES wrap)

const int RELAY_PIN = 25;

LiquidCrystal_I2C lcd(0x27, 16, 2);
WebSocketsClient wsClient;

String sessionToken;
int nextBellMinutes = -1;

// ---------- forward declarations ----------
String hmacSHA256(String payload);
String encryptAES_B64(const String &plain);
String decryptAES_B64(const String &b64);

void requestSession();
void connectWebsocket();
void sendRegistration();
void handleWsMessage(const String &message);
void triggerRelay(int seconds);

// ---------- setup ----------
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  lcd.init();
  lcd.backlight();
  lcd.print("Universal Bell");
  delay(1200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  lcd.clear();
  lcd.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  lcd.clear();
  lcd.print("WiFi Connected");
  delay(800);

  requestSession();
  connectWebsocket();
}

void loop() {
  wsClient.loop();
}

// ---------- HMAC SHA256 signature ----------
String hmacSHA256(String payload) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);

  mbedtls_md_hmac_starts(&ctx,
                         (const unsigned char *)DEVICE_HMAC_SECRET,
                         strlen(DEVICE_HMAC_SECRET));
  mbedtls_md_hmac_update(&ctx,
                         (const unsigned char *)payload.c_str(),
                         payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  char hexResult[65];
  for (int i = 0; i < 32; i++) {
    sprintf(&hexResult[i * 2], "%02x", (unsigned int)hmacResult[i]);
  }
  hexResult[64] = '\0';
  return String(hexResult);
}

// ---------- PKCS7 padding helpers ----------
static size_t pkcs7Pad(uint8_t *buf, size_t len, size_t blockSize) {
  size_t padLen = blockSize - (len % blockSize);
  for (size_t i = 0; i < padLen; i++) buf[len + i] = (uint8_t)padLen;
  return len + padLen;
}

static size_t pkcs7Unpad(uint8_t *buf, size_t len) {
  if (len == 0) return 0;
  uint8_t padLen = buf[len - 1];
  if (padLen == 0 || padLen > 16) return len;
  for (size_t i = 0; i < padLen; i++) {
    if (buf[len - 1 - i] != padLen) return len;
  }
  return len - padLen;
}

// ---------- AES-128-CBC encrypt -> base64(IV + CIPHERTEXT) ----------
String encryptAES_B64(const String &plain) {
  uint8_t key[16];
  memcpy(key, DEVICE_AES_SECRET, 16);

  size_t inLen = plain.length();
  size_t bufLen = inLen + 16;
  uint8_t *inBuf = (uint8_t *)malloc(bufLen);
  memcpy(inBuf, plain.c_str(), inLen);

  size_t paddedLen = pkcs7Pad(inBuf, inLen, 16);

  uint8_t iv[16];
  for (int i = 0; i < 16; i++) iv[i] = (uint8_t)esp_random();

  uint8_t *outBuf = (uint8_t *)malloc(paddedLen);

  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, key, 128);

  uint8_t ivCopy[16];
  memcpy(ivCopy, iv, 16);

  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT,
                        paddedLen, ivCopy, inBuf, outBuf);
  mbedtls_aes_free(&aes);

  size_t packLen = 16 + paddedLen;
  uint8_t *packBuf = (uint8_t *)malloc(packLen);
  memcpy(packBuf, iv, 16);
  memcpy(packBuf + 16, outBuf, paddedLen);

  size_t b64Len = 4 * ((packLen + 2) / 3) + 1;
  unsigned char *b64Out = (unsigned char *)malloc(b64Len);

  size_t outLenActual = 0;
  mbedtls_base64_encode(b64Out, b64Len, &outLenActual, packBuf, packLen);
  b64Out[outLenActual] = '\0';

  String result((char *)b64Out);

  free(inBuf);
  free(outBuf);
  free(packBuf);
  free(b64Out);

  return result;
}

// ---------- base64(IV + CIPHERTEXT) -> AES-128-CBC decrypt ----------
String decryptAES_B64(const String &b64) {
  uint8_t key[16];
  memcpy(key, DEVICE_AES_SECRET, 16);

  size_t packMaxLen = (b64.length() * 3) / 4 + 4;
  uint8_t *packBuf = (uint8_t *)malloc(packMaxLen);

  size_t packLenActual = 0;
  int rc = mbedtls_base64_decode(packBuf, packMaxLen,
                                &packLenActual,
                                (const unsigned char *)b64.c_str(),
                                b64.length());

  if (rc != 0 || packLenActual < 32) {
    free(packBuf);
    return "";
  }

  uint8_t iv[16];
  memcpy(iv, packBuf, 16);

  size_t cipherLen = packLenActual - 16;
  uint8_t *cipherBuf = packBuf + 16;

  uint8_t *plainBuf = (uint8_t *)malloc(cipherLen);

  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_dec(&aes, key, 128);

  uint8_t ivCopy[16];
  memcpy(ivCopy, iv, 16);

  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_DECRYPT,
                        cipherLen, ivCopy, cipherBuf, plainBuf);
  mbedtls_aes_free(&aes);

  size_t unpaddedLen = pkcs7Unpad(plainBuf, cipherLen);

  String result;
  for (size_t i = 0; i < unpaddedLen; i++) result += (char)plainBuf[i];

  free(plainBuf);
  free(packBuf);

  return result;
}

// ---------- Request session token (HTTPS) ----------
void requestSession() {
  WiFiClientSecure secure;
  secure.setInsecure();  // Wokwi / testing only

  HTTPClient client;
  String url = String(SERVER_HOST) + "/api/device/session";

  if (!client.begin(secure, url)) {
    lcd.clear();
    lcd.print("HTTP begin fail");
    return;
  }

  client.addHeader("Content-Type", "application/json");
  String timestamp = String(millis());

  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceSecret"] = DEVICE_SECRET;
  doc["timestamp"] = timestamp;
  doc["signature"] = hmacSHA256(String(DEVICE_ID) + ":" +
                                DEVICE_SECRET + ":" +
                                timestamp);

  String payload;
  serializeJson(doc, payload);

  int status = client.POST(payload);

  if (status == 200) {
    DynamicJsonDocument response(512);
    deserializeJson(response, client.getString());
    sessionToken = response["sessionToken"].as<String>();
    nextBellMinutes = response["nextBell"]["minutes"] | -1;

    lcd.clear();
    lcd.print("Server linked");
    if (nextBellMinutes >= 0) {
      lcd.setCursor(0, 1);
      lcd.print("Next in ");
      lcd.print(nextBellMinutes);
      lcd.print("m");
    }
  } else {
    lcd.clear();
    lcd.print("Auth failed");
    Serial.printf("Session status: %d\n", status);
    Serial.println(client.getString());
  }

  client.end();
}

// ---------- Socket.IO (manual over WebSocketsClient) ----------
// Socket.IO v4 over websocket frames:
//  server sends: 0{"sid":"...","pingInterval":25000,"pingTimeout":5000}
//  client replies: 40
//  events: 42["event", {...}]
//  ping/pong: server sends "2", client replies "3"
void connectWebsocket() {
  wsClient.beginSSL(SERVER_WS_HOST, SERVER_WS_PORT, "/socket.io/?EIO=4&transport=websocket");
  wsClient.setReconnectInterval(5000);

  wsClient.onEvent([](WStype_t type, uint8_t *payload, size_t length) {
    switch (type) {
      case WStype_CONNECTED:
        lcd.clear();
        if (nextBellMinutes >= 0) {
          lcd.print("Next bell in ");
          lcd.print(nextBellMinutes);
          lcd.print("m");
        } else {
          lcd.print("Socket online");
        }
        Serial.println("WS connected");
        break;

      case WStype_DISCONNECTED:
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
  });

  Serial.println("Connecting WebSocket...");
}

void handleWsMessage(const String &message) {
  if (message.length() == 0) return;

  // Engine.IO open frame
  if (message.startsWith("0")) {
    // reply with Socket.IO connect
    wsClient.sendTXT("40");
    return;
  }

  // Socket.IO connect ack (40 or 40{...})
  if (message.startsWith("40")) {
    if (sessionToken.length()) sendRegistration();
    return;
  }

  // Ping
  if (message == "2") {
    wsClient.sendTXT("3");
    return;
  }

  // Socket.IO event frame
  if (message.startsWith("42")) {
    String json = message.substring(2);  // strip "42"
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
      if (nextBellMinutes >= 0) {
        lcd.clear();
        lcd.print("Next bell in ");
        lcd.print(nextBellMinutes);
        lcd.print("m");
      }
      return;
    }

    if (strcmp(event, "ring") == 0) {
      int duration = data["duration"] | 5;
      triggerRelay(duration);
    } else if (strcmp(event, "emergency_on") == 0) {
      triggerRelay(10);
    }
    return;
  }

  // Unknown frame
  Serial.print("WS frame: ");
  Serial.println(message);
}

// ---------- Send registration ----------
void sendRegistration() {
  if (sessionToken.length() == 0) return;

  DynamicJsonDocument doc(256);
  JsonArray arr = doc.to<JsonArray>();
  arr.add("device:register");

#if USE_AES_PAYLOADS
  DynamicJsonDocument d(128);
  d["sessionToken"] = sessionToken;
  String dataPlain;
  serializeJson(d, dataPlain);
  DynamicJsonDocument wrap(128);
  wrap["dataEnc"] = encryptAES_B64(dataPlain);
  arr.add(wrap.as<JsonObject>());
#else
  JsonObject data = arr.createNestedObject();
  data["sessionToken"] = sessionToken;
#endif

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
