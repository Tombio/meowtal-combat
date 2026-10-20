# 🐾 MEOWTAL COMBAT 🥋

[![Deploy to GitHub Pages](https://github.com/Tombio/meowtal-combat/actions/workflows/deploy.yml/badge.svg)](https://github.com/Tombio/meowtal-combat/actions/workflows/deploy.yml)
[![Play Live](https://img.shields.io/badge/🎮%20Play%20Live-GitHub%20Pages-ff007f?style=for-the-badge)](https://tombio.github.io/meowtal-combat/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Multiplayer-333333?style=flat-square&logo=webrtc)](https://webrtc.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-orange?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> **A 90s arcade 2-player sumo platform fighter featuring chonky cats battling atop a sacred Dohyo.**  
> Bump your opponent off the ring, time aerial pounces for mega knockbacks, and duel friends locally or online via peer-to-peer WebRTC!

👉 **[PLAY NOW IN BROWSER](https://tombio.github.io/meowtal-combat/)**

---

## 📸 Screenshots

### Gameplay Battle
![MEOWTAL COMBAT Gameplay](screenshots/gameplay.png)

### Arcade Cabinet & Title Screen
![Arcade Cabinet Title](screenshots/title.png)

---

## ⚡ Features

### 🥋 Chonky Sumo Physics & Combat
- **Height-Advantage Pounce Mechanic**: Collisions scale dynamically with altitude difference. Higher cats dropping onto opponents trigger screen shake, comic popups (`CLASH!`, `BONK!`, `POUNCE!`), hit-stop freeze frames, and massive horizontal knockback!
- **Jump-Over Clearance**: Leap altitude is tuned to allow vaulting cleanly over an opponent to switch sides and evade ring-outs.
- **Dohyo Ring-Out Detection**: Push your opponent off the platform into the pit to take the round. Best 3 out of 5 rounds wins the tournament.

### 🌐 Peer-to-Peer Online Multiplayer
- **Zero Server Setup**: Powered by direct WebRTC DataChannels using PeerJS with public STUN fallbacks.
- **Instant Room Codes & Share Links**: One-click room creation with 6-character room codes (`cat-xxxx`) and direct WhatsApp duel invite buttons.
- **Hybrid Client-Side Prediction Netcode**:
  - **0ms Local Prediction for Guest**: Kuro responds immediately with local client prediction for walking and jumping.
  - **Host Authority**: Authoritative combat knockbacks, ring-outs, and dohyo boundary checks originate on the host.
  - **Dynamic Reaction Equalizer**: Adaptive host input delay buffer based on live ping levels the reaction field.
  - **Real-Time Lag Meter**: Arcade HUD chip displays live ping with color-coded RTT status (🟢 `< 60ms`, 🟡 `60–130ms`, 🔴 `> 130ms`).

### ⏱️ Ready Check & "3, 2, 1, MEOW!" Countdown
- **Strictly Mapped-Button Acknowledgment**: Prior to every round, both players must acknowledge by pressing any of their mapped controls (<kbd>A</kbd>/<kbd>D</kbd>/<kbd>W</kbd>, Arrows, or touch buttons).
- **Retro Arcade Countdown**: Once both players are ready, the dohyo erupts into a pulsing countdown (`3` → `2` → `1` → **`MEOW!`**) with authentic Taiko drum strikes.

### 🎵 16-Bit Procedural Web Audio
- **Zero MP3s or Audio Assets**: 100% synthesized in real time via the native Web Audio API.
- **Dynamic Chiptune Tracks**: Multi-track procedural BGM that switches automatically across tournament rounds (Neo-Dohyo Acid, Shinobi Dub, Tokyo Metropolis, Final Climax Rave).
- **Retro Sound Effects**: Taiko Don bass drums, rim shots, cute meows, impact bonks scaled to fall height, and celebratory victory fanfares.

### 🕹️ Arcade Polish & Accessibility
- **CRT Shader & Arcade Cabinet**: Scanlines, bezel curvature, floating cherry blossom petals, and glowing rainbow marquee.
- **Mobile Touch Controls**: Responsive touch D-pad and jump button with automatic mobile device detection.
- **Custom Key Rebinding**: Rebind any control for P1 and P2 with persistent local storage saving.

---

## 🎮 Controls

| Action | Player 1 (Mochi - Ginger Tabby) | Player 2 (Kuro - Black Cat) | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **Move Left** | <kbd>A</kbd> | <kbd>←</kbd> | ◀ Button |
| **Move Right** | <kbd>D</kbd> | <kbd>→</kbd> | ▶ Button |
| **Jump / Pounce** | <kbd>W</kbd> | <kbd>↑</kbd> | 🐾 JUMP Button |
| **Ready Up (Round Start)** | Any P1 Control (<kbd>A</kbd>, <kbd>D</kbd>, <kbd>W</kbd>) | Any P2 Control (<kbd>←</kbd>, <kbd>→</kbd>, <kbd>↑</kbd>) | Touch JUMP / Movement |
| **Start / Rematch** | <kbd>Space</kbd> or <kbd>W</kbd> | <kbd>Space</kbd> or <kbd>↑</kbd> | Touch JUMP |

*Controls can be rebound at any time via the **KEYS** button on the bottom toolbar.*

---

## 🛠️ Development & Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
# Clone the repository
git clone git@github.com:Tombio/meowtal-combat.git
cd meowtal-combat

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Test Suite
```bash
# Run headless physics, collision, and netcode simulation tests
npm test
```

### Production Build
```bash
# Typecheck and build static production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 🚀 Deployment

The game automatically builds and deploys to **GitHub Pages** via the included [GitHub Actions workflow](.github/workflows/deploy.yml) on every push to `main`.

Live site: **`https://tombio.github.io/meowtal-combat/`**

---

## 📜 Architecture Overview

```
meowtal-combat/
├── src/
│   ├── audio/
│   │   ├── BGMTrack.ts         # Procedural multi-track 90s chiptune synthesizer
│   │   └── SoundSynthesizer.ts # Web Audio API sound effects & Taiko drums
│   ├── engine/
│   │   ├── Collision.ts        # Height-scaled bump & shove collision resolution
│   │   ├── Effects.ts          # Comic popups, dust particles, screen shake, hit stop
│   │   └── InputManager.ts     # Input handling, role isolation, key rebinding
│   ├── entities/
│   │   ├── Arena.ts            # Dohyo boundaries, platform coordinates, ring-out
│   │   └── Cat.ts              # Cat state machine, physics, animation frames
│   ├── network/
│   │   └── NetworkManager.ts   # WebRTC PeerJS signaling, P2P sync, ping loop
│   ├── render/
│   │   ├── ArenaRenderer.ts    # Dojo background, lanterns, Mount Fuji, moon
│   │   └── CatRenderer.ts      # Pixel art rendering for Mochi and Kuro
│   ├── ui/
│   │   ├── ArcadeHUD.ts        # Top ribbon, 3-2-1 MEOW countdown, ready banners
│   │   ├── KeyModal.ts         # Retro key rebind modal UI
│   │   ├── OnlineModal.ts      # Room hosting, joining, WhatsApp share
│   │   └── TouchController.ts  # On-screen mobile touch controls
│   └── main.ts                 # Main game loop, netcode reconciliation, lifecycle
├── test/
│   └── gameplay-simulation.test.ts # 13 headless end-to-end simulation suites
└── screenshots/                # Game screenshots for documentation
```

---

## 📄 License

MIT © [Tomi Lahtinen](https://github.com/Tombio)
