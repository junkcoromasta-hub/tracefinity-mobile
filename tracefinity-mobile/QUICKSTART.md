# Quick Start Guide

## 1-Minute Setup

```bash
# Clone/download project
cd tracefinity-mobile

# Install dependencies
npm install

# Set up API key
cp .env.local.example .env.local
# Edit .env.local with your Gemini key from https://aistudio.google.com/apikey

# Build native modules
npx expo prebuild --clean

# Run on Android
npx expo start --android
```

## What Happens Next

1. **Expo dev server starts** on `http://localhost:8081`
2. **Android emulator (or device) opens** with the app
3. **App initializes database** on first run
4. **You're ready to capture tools!**

## First Test

1. Tap the **+** button on Tools tab
2. Take a photo of any tool or object
3. Wait for Gemini to trace it (5-10 seconds)
4. Select the traced shape
5. Save it to library

## Troubleshooting First Run

### "Cannot find module expo/router"
```bash
npm install expo-router expo
npx expo prebuild --clean
```

### "GEMINI_API_KEY not set"
Make sure `.env.local` has:
```
EXPO_PUBLIC_GEMINI_KEY=sk-...your-key...
```

### App crashes on startup
- Check console: `npx expo start`
- Clear cache: `npm run clean && npm install`
- Rebuild: `npx expo prebuild --clean`

### Phone doesn't connect
- Both phone and computer on same WiFi
- Scan QR code with Expo Go app (Android)
- Or use `npx expo start --tunnel` for different networks

## Next Steps

1. **Trace a few tools** and build your library
2. **Create a bin** and set dimensions
3. **Export STL** and test on your printer
4. **Customize** tool names, bin sizes

## Development

- **Hot reload**: Changes to JS/TS reload instantly
- **Native changes**: Need `npx expo prebuild --clean`
- **Debug**: Shake device → Open dev menu → Enable dev tools

## File Structure Reference

```
app/                    ← Screen components
lib/
  ├── db.ts            ← SQLite queries
  ├── store.ts         ← App state (Zustand)
  └── ml/
      ├── trace.ts     ← Gemini API calls
      └── contours.ts  ← Polygon math
```

## Common Tasks

### Add a new screen
1. Create file in `app/` folder
2. Use Expo Router convention: `app/myscreen.tsx`
3. Auto-linked in navigation

### Query the database
```typescript
import { getTools, getTool } from '@/lib/db';

const tools = await getTools();
```

### Update app state
```typescript
import { useAppStore } from '@/lib/store';

const addTool = useAppStore(state => state.addTool);
await addTool(toolObject);
```

## Ready?

Run:
```bash
npx expo start --android
```

Let's build! 🚀
