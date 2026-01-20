/*
 * Arduino relay driver (serial-controlled) for 1 bell + 3 bulbs.
 *
 * Wiring:
 * - ESP8266 TX (D7) -> Arduino RX0 (D0). Common GND between ESP and Arduino.
 * - Relay module INs: Bulb1=D4, Bulb2=D5, Bulb3=D6, Bell=D7.
 * - Relay VCC=5V, GND shared.
 *
 * Protocol (9600 baud, line-based):
 * - RING <sec>      : energize bell relay for <sec> seconds
 * - ON              : latch bell relay ON
 * - OFF             : latch bell relay OFF
 * - BULB <1-3> ON   : bulb channel on
 * - BULB <1-3> OFF  : bulb channel off
 * - BULB <1-3> RING <sec> : bulb on for <sec> seconds
 *
 * Notes:
 * - Avoid using Serial Monitor while ESP is sending commands on D0 (contention).
 */

const int BELL_RELAY_PIN = 7; // Bell relay (channel 4)
const bool BELL_ACTIVE_HIGH = true;

const int BULB_COUNT = 3;
const int BULB_PINS[BULB_COUNT] = {4, 5, 6}; // Bulbs on channels 1-3
const bool BULB_ACTIVE_HIGH = true;

unsigned long bellOffAt = 0;
bool bellLatched = false;

bool bulbLatched[BULB_COUNT] = {false, false, false};
unsigned long bulbOffAt[BULB_COUNT] = {0, 0, 0};

void setup() {
  Serial.begin(9600);

  pinMode(BELL_RELAY_PIN, OUTPUT);
  setBell(false);
  for (int i = 0; i < BULB_COUNT; i++) {
    pinMode(BULB_PINS[i], OUTPUT);
    setBulb(i, false);
  }

  Serial.println(F("Relay driver ready (RX on D0)."));
}

void loop() {
  handleSerial();
  autoOffBell();
  autoOffBulbs();
}

void handleSerial() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toUpperCase();
  if (!line.length()) return;

  if (line.startsWith("RING")) {
    int sep = line.indexOf(' ');
    int seconds = (sep > 0) ? line.substring(sep + 1).toInt() : 5;
    if (seconds <= 0) seconds = 5;
    ringBell(seconds);
    return;
  }
  if (line == "ON") {
    bellLatched = true;
    setBell(true);
    return;
  }
  if (line == "OFF") {
    bellLatched = false;
    setBell(false);
    return;
  }
  if (line.startsWith("BULB")) {
    handleBulbCommand(line);
    return;
  }
  Serial.println(F("Unknown cmd"));
}

void ringBell(int seconds) {
  bellLatched = false;
  setBell(true);
  bellOffAt = millis() + (unsigned long)seconds * 1000UL;
}

void autoOffBell() {
  if (bellLatched) return;
  if (bellOffAt > 0 && millis() >= bellOffAt) {
    setBell(false);
    bellOffAt = 0;
  }
}

void setBell(bool on) {
  digitalWrite(BELL_RELAY_PIN, on == BELL_ACTIVE_HIGH ? HIGH : LOW);
}

void handleBulbCommand(const String &line) {
  // BULB <ch> ON|OFF|RING <sec?>
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
  if (count < 2) return;
  int ch = parts[1].toInt() - 1;
  if (ch < 0 || ch >= BULB_COUNT) return;

  String cmd = (count >= 3) ? parts[2] : String("");
  cmd.trim();
  if (cmd == "ON") {
    bulbLatched[ch] = true;
    setBulb(ch, true);
  } else if (cmd == "OFF") {
    bulbLatched[ch] = false;
    setBulb(ch, false);
  } else if (cmd.startsWith("RING")) {
    int seconds = 5;
    int sep = cmd.indexOf(' ');
    if (sep > 0) seconds = cmd.substring(sep + 1).toInt();
    if (seconds <= 0) seconds = 5;
    bulbLatched[ch] = false;
    setBulb(ch, true);
    bulbOffAt[ch] = millis() + (unsigned long)seconds * 1000UL;
  }
}

void autoOffBulbs() {
  for (int i = 0; i < BULB_COUNT; i++) {
    if (bulbLatched[i]) continue;
    if (bulbOffAt[i] > 0 && millis() >= bulbOffAt[i]) {
      setBulb(i, false);
      bulbOffAt[i] = 0;
    }
  }
}

void setBulb(int idx, bool on) {
  digitalWrite(BULB_PINS[idx], on == BULB_ACTIVE_HIGH ? HIGH : LOW);
}
