# Universal Bell System

End-to-end IoT bell management platform with a MERN backend, modern React dashboard, and ESP32 firmware for hardware bells.

## Repository Structure

```
.
├── server/        # Express + TypeScript API, MongoDB models, Socket.IO gateway
├── client/        # React + Vite SPA for administrators
├── hardware/      # ESP32 firmware sketch and wiring notes
├── docker-compose.yml (optional, add if you want to run Mongo/Redis locally)
└── README.md
```

## Features

- **Authentication & RBAC** – organisation signup, login, JWT access/refresh, role-aware endpoints.
- **Blocks & Bells** – CRUD APIs + UI forms to map ESP32 IDs to campus blocks, show live online/offline state.
- **Schedule Management** – unlimited bell slots with duration, days of week, and override occasions.
- **Emergency Bell** – one-click global trigger with websocket broadcast to all bells.
- **Analytics Dashboard** – metrics cards, device health feed, bell duration charts.
- **Device Security** – per-device HMAC handshake, short-lived session tokens, encrypted websocket channel.
- **ESP32 Firmware** – WiFi provisioning placeholders, REST pairing, websocket listener, relay control, LCD UX.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 6+ (Atlas or local)
- Redis 6+ (for device session tokens)
- PN532? no

### Backend

```bash
cd server
cp .env.example .env   # set secrets + DB URIs
npm install
npm run dev            # ts-node-dev with hot reload
npm run build && npm start
```

Key scripts:

- `npm run dev` – start API with autoreload
- `npm run build` – TypeScript compilation to `dist/`
- `npm start` – run compiled server

### Frontend

```bash
cd client
npm install
npm run dev     # Vite dev server on :5173
npm run build   # Production bundle into dist/
```

Set `VITE_API_URL` in a `.env` to point to the Express API (defaults to `http://localhost:5000/api`).

### Hardware

- `hardware/esp32/firmware.ino` targets Arduino framework with:
  - LCD status output
  - WiFi provisioning placeholder (turn on AP `Bell-Provision`)
  - HMAC-secured REST handshake to `/api/device/session`
  - WebSocket listener for `ring`, `emergency_on`, `emergency_off`
  - Relay trigger driver (GPIO 25)

**Components**

- ESP32 DevKitC / NodeMCU-32S
- 16x2 I2C LCD (PCF8574 backpack)
- 5V opto-isolated relay (or SSR) tied to bell circuit
- Bell (24V/230V) + snubber network, MOV for surge protection
- Power supply: 5V/2A + buck converter if sharing mains
- Tactile buttons for WiFi setup, manual emergency
- Enclosure, terminal blocks, inline fuse

**Wiring**

- LCD SDA → GPIO 21, SCL → GPIO 22 (pull-ups 4.7k)
- Relay IN → GPIO 25 (through transistor if using bare relay), `COM/NO` inline with bell supply
- Status LED / buzzer on GPIO 27 (optional)
- Buttons to GPIO 0 / 35 with pull-ups for provisioning & reset
- Share ground between ESP32, relay, PSU; add 100µF + 0.1µF decoupling caps near ESP32

## Server Highlights

- Express routers for `/auth`, `/blocks`, `/bells`, `/schedules`, `/emergency`, `/profile`, `/device`
- Mongo models for organisations, users, blocks, bells, schedules, occasions, emergency state, event logs
- Socket.IO-based `deviceGateway` with Redis-backed session tokens, online tracking, broadcast helpers
- Cron scheduler (`node-cron`) that evaluates due bells every minute per organisation timezone
- Centralized logging + error handling, rate limiting, Helmet, compression, JWT middleware

## Frontend Highlights

- React Router guarded routes, persistent auth store (Zustand)
- Dashboard components: metric cards, Recharts duration trend, bell health list
- CRUD pages for blocks, bells, schedules, occasions with responsive cards/forms
- Emergency slider UI with real-time status and action button
- Profile management for both user and organisation metadata

## Security Notes

- Store long secrets in `.env` only; never commit them
- Rotate `DEVICE_HMAC_SECRET`/`DEVICE_AES_SECRET` per environment; embed per device if possible
- Force HTTPS + WSS in production (set reverse proxy or load balancer with TLS)
- Consider MFA (TOTP), email verification, and audit logging for admin actions
- Add request validation for all routes (Zod validators in place for core payloads)
- Regularly rotate device session tokens; current TTL is 5 minutes

## Deployment

1. Build frontend (`npm run build`) and serve via CDN or Nginx.
2. Dockerize backend (Node 20 slim) and run behind reverse proxy with TLS termination.
3. Configure Mongo Atlas + Redis (or managed alternatives) with IP allowlists.
4. Use CI (GitHub Actions) to lint, test, build containers, and deploy to your target (AWS ECS, GCP Cloud Run, etc.).

## Next Steps

- Flesh out WiFi provisioning UI (captive portal) + AES encryption for websocket payloads.
- Add notifications (email/SMS/push) for offline bells and emergency triggers.
- Implement RBAC UI + audit log explorer.
- Integrate firmware OTA via HTTPS endpoint.
- Enhance scheduler with drag-and-drop timetable and CSV import/export.
