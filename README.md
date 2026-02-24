# barkoder_app_capacitor

Capacitor + React implementation of the existing `BarkoderApp` React Native demo, keeping the same general screen structure and scanner modes:

- Home
- Scanner
- Barcode Details
- Recent Scans
- About

## Implemented Barkoder Features

- License key registration (`registerWithLicenseKey`)
- Native scanner view initialization (`initialize`)
- Live scanning (`startScanning`, `stopScanning`)
- Gallery scan (`scanImage`)
- Barcode type enable/disable + mode-specific presets
- VIN / DPM / DotCode / AR / Deblur mode presets
- OCR VIN demo screen with one-tap start button (enables OCR + VIN restrictions)
- Runtime scanner settings (ROI, speed, resolution, continuous scanning, etc.)
- Result events via `barkoderResultEvent`
- History persistence + per-mode settings persistence

## Prerequisites

- Node.js 20+
- Android Studio / Xcode for native builds

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your Barkoder key:
   ```bash
   VITE_BARKODER_LICENSE_KEY=YOUR_BARKODER_LICENSE_KEY
   ```
3. Build web assets:
   ```bash
   npm run build
   ```
4. Add native platforms (first time only):
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```
5. Sync Capacitor:
   ```bash
   npm run cap:sync
   ```
6. Open native project:
   ```bash
   npm run cap:android
   npm run cap:ios
   ```

## Useful Commands

- `npm run dev` - run Vite dev server (UI preview)
- `npm run lint` - ESLint checks
- `npm run build` - TypeScript + Vite production build
- `npm run build:cap` - build + `cap sync`

## Reference Used

- Installation: https://barkoder.com/docs/v1/capacitor/capacitor-installation
- API: https://barkoder.com/docs/v1/capacitor/capacitor-sdk-api-reference
- Examples: https://barkoder.com/docs/v1/capacitor/capacitor-examples