/*
 * Simple Arduino relay driver for bell/bulb triggers.
 *
 * Goal:
 * - Arduino provides a solid 5V drive to a relay module (e.g., when ESP32 only outputs 3.3V).
 * - Receive trigger commands over Serial (e.g., from ESP32 via UART) with a duration in seconds.
 * - Optionally respond to a digital trigger pin (active HIGH) for fallback/manual wiring.
 *
 * Protocol (Serial, 9600 baud):
 * - Send a line like: RING 5          -> energize relay for 5 seconds
 * - Send a line like: ON              -> latch relay on
 * - Send a line like: OFF             -> latch relay off
 *
 * Wiring:
 * - Relay module IN -> RELAY_PIN (default D8)
 * - Relay VCC -> 5V, GND -> GND
 * - Arduino GND must be common with ESP32 if ESP32 is sending serial commands
 * - Optional trigger pin (TRIGGER_PIN) can be driven HIGH to energize relay (default D2)
 */

const int RELAY_PIN = 7;       // Bell relay now uses channel 4 of 4-ch board
const bool RELAY_ACTIVE_HIGH = true; // Set false if your relay is active-LOW
const int TRIGGER_PIN = 2;     // Optional manual trigger input (active HIGH)

unsigned long relayOffAt = 0;
bool relayLatched = false;

// Bulb relays (4-channel)
const int BULB_COUNT = 3;
const int BULB_PINS[BULB_COUNT] = {4, 5, 6}; // adjust to your wiring (channels 1-3)
const bool BULB_ACTIVE_HIGH = true; // set false if your bulb relays are active-LOW
bool bulbLatched[BULB_COUNT] = {false, false, false};
unsigned long bulbOffAt[BULB_COUNT] = {0, 0, 0};

// Inputs from ESP (3.3V) to mirror to relays
const int BELL_SIG_PIN = 10;              // ESP bell line
const int BULB_SIG_PINS[BULB_COUNT] = {11, 12, 13}; // ESP bulb lines; adjust as needed

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, INPUT_PULLUP);
  pinMode(BELL_SIG_PIN, INPUT);
  for (int i = 0; i < BULB_COUNT; i++) {
    pinMode(BULB_SIG_PINS[i], INPUT);
  }
  setRelay(false); // idle
  for (int i = 0; i < BULB_COUNT; i++) {
    pinMode(BULB_PINS[i], OUTPUT);
    setBulb(i, false);
  }
  Serial.println(F("Relay driver ready. Use 'RING <sec>', 'ON', 'OFF'."));
  Serial.println(F("Bulbs: 'BULB <1-4> ON|OFF|RING <sec>'"));
}

void loop() {
  handleSerial();
  mirrorSignals();
  handleTriggerPin();
  handleAutoOff();
  handleBulbAutoOff();
}

void handleSerial() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toUpperCase();
  if (line.startsWith("RING")) {
    int sep = line.indexOf(' ');
    int seconds = 0;
    if (sep > 0) {
      seconds = line.substring(sep + 1).toInt();
    }
    if (seconds <= 0) seconds = 5;
    energizeFor(seconds);
    Serial.print(F("RING for "));
    Serial.print(seconds);
    Serial.println(F("s"));
  } else if (line == "ON") {
    relayLatched = true;
    setRelay(true);
    Serial.println(F("ON"));
  } else if (line == "OFF") {
    relayLatched = false;
    setRelay(false);
    Serial.println(F("OFF"));
  } else if (line.startsWith("BULB")) {
    handleBulbCommand(line);
  } else {
    Serial.println(F("Unknown cmd. Use RING <sec>/ON/OFF"));
  }
}

void mirrorSignals() {
  // Mirror bell
  bool bellOn = digitalRead(BELL_SIG_PIN) == HIGH;
  setRelay(bellOn);

  // Mirror bulbs
  for (int i = 0; i < BULB_COUNT; i++) {
    bool bulbOn = digitalRead(BULB_SIG_PINS[i]) == HIGH;
    setBulb(i, bulbOn);
  }
}

void handleTriggerPin() {
  if (digitalRead(TRIGGER_PIN) == HIGH) {
    energizeFor(5); // default 5s on digital trigger
  }
}

void handleAutoOff() {
  if (relayLatched) return; // latched ON via command
  if (relayOffAt > 0 && millis() >= relayOffAt) {
    setRelay(false);
    relayOffAt = 0;
  }
}

void energizeFor(int seconds) {
  relayLatched = false;
  setRelay(true);
  relayOffAt = millis() + (unsigned long)seconds * 1000UL;
}

void setRelay(bool on) {
  digitalWrite(RELAY_PIN, (on == RELAY_ACTIVE_HIGH) ? HIGH : LOW);
}

void handleBulbCommand(const String &line) {
  // Expect: BULB <ch> ON|OFF|RING <sec?>
  String parts[3];
  int count = 0;
  int start = 0;
  while (count < 3) {
    int sp = line.indexOf(' ', start);
    if (sp == -1) {
      parts[count++] = line.substring(start);
      break;
    }
    parts[count++] = line.substring(start, sp);
    start = sp + 1;
  }
  if (count < 2) {
    Serial.println(F("BULB syntax: BULB <1-4> ON|OFF|RING <sec>"));
    return;
  }
  int ch = parts[1].toInt() - 1;
  if (ch < 0 || ch >= BULB_COUNT) {
    Serial.println(F("BULB channel must be 1-4"));
    return;
  }

  String cmd = (count >= 3) ? parts[2] : String("");
  cmd.trim();
  if (cmd == "") {
    Serial.println(F("BULB missing command"));
    return;
  }

  if (cmd == "ON") {
    bulbLatched[ch] = true;
    setBulb(ch, true);
    Serial.print(F("BULB "));
    Serial.print(ch + 1);
    Serial.println(F(" ON"));
  } else if (cmd == "OFF") {
    bulbLatched[ch] = false;
    setBulb(ch, false);
    Serial.print(F("BULB "));
    Serial.print(ch + 1);
    Serial.println(F(" OFF"));
  } else if (cmd.startsWith("RING")) {
    int seconds = 5;
    int sep = cmd.indexOf(' ');
    if (sep > 0) {
      seconds = cmd.substring(sep + 1).toInt();
    }
    if (seconds <= 0) seconds = 5;
    bulbLatched[ch] = false;
    setBulb(ch, true);
    bulbOffAt[ch] = millis() + (unsigned long)seconds * 1000UL;
    Serial.print(F("BULB "));
    Serial.print(ch + 1);
    Serial.print(F(" RING "));
    Serial.print(seconds);
    Serial.println(F("s"));
  } else {
    Serial.println(F("BULB cmd must be ON/OFF/RING <sec>"));
  }
}

void handleBulbAutoOff() {
  for (int i = 0; i < BULB_COUNT; i++) {
    if (bulbLatched[i]) continue;
    if (bulbOffAt[i] > 0 && millis() >= bulbOffAt[i]) {
      setBulb(i, false);
      bulbOffAt[i] = 0;
    }
  }
}

void setBulb(int idx, bool on) {
  bool level = (on == BULB_ACTIVE_HIGH);
  digitalWrite(BULB_PINS[idx], level ? HIGH : LOW);
}
