# Tracefinity Mobile

AI-powered tool tracing and Gridfinity bin generator for Android (and iOS).

## Features

- 📸 **Photo Capture**: Photograph tools on paper, set scale
- 🤖 **AI Tracing**: Uses Google Gemini to detect tool outlines
- 🛠️ **Tool Library**: Save and organize traced tools locally
- 📦 **Bin Designer**: Arrange tools into Gridfinity-compatible bins
- 🖨️ **STL Export**: Generate 3D-printable models ready for your printer
- 💾 **Offline**: All data stored locally on your device

## Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Android device or emulator
- Google Gemini API key (free at https://aistudio.google.com/apikey)

### Installation

1. **Clone and install**:
```bash
cd tracefinity-mobile
npm install
```

2. **Set up environment**:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your Gemini API key:
# EXPO_PUBLIC_GEMINI_KEY=your_api_key_here
```

3. **Prebuild native modules**:
```bash
npx expo prebuild --clean
```

4. **Run on Android**:
```bash
# On emulator
npx expo start --android

# Or on physical device (scan QR code with Expo Go app)
npx expo start
```

## How to Use

### 1. Add a Tool
- Go to **Tools** tab
- Tap the **+** button
- Take a photo of a tool on A4/Letter paper
- Tap "Trace Tool"
- Select which outlines to save
- Tool is saved to your library

### 2. Edit a Tool
- Tap any tool in the library
- Edit vertices on the canvas
- Tap **Save**

### 3. Create a Bin
- Go to **Bins** tab
- Tap the **+** button
- Configure bin dimensions (width × height in Gridfinity units)
- Adjust wall thickness
- Tap **Save & Export**
- STL file is exported to your device

## Project Structure

```
app/                    # Expo Router navigation
├── (tabs)/            # Main tab navigation
│   ├── index.tsx      # Tools library
│   ├── bins.tsx       # Bins list
│   └── projects.tsx   # Projects organization
├── camera.tsx         # Photo capture
├── tools/[id]/
│   ├── editor.tsx     # Edit tool vertices
│   └── trace.tsx      # Trace results & selection
└── bins/[id]/
    └── layout.tsx     # Bin configuration & export

lib/
├── types.ts           # TypeScript interfaces
├── db.ts              # SQLite database
├── store.ts           # Zustand state management
├── stl.ts             # STL generation
└── ml/
    ├── trace.ts       # Gemini API integration
    └── contours.ts    # Polygon simplification
```

## How It Works

1. **Photo Upload**: You photograph tools on paper (for scale reference)
2. **AI Tracing**: Image sent to Google Gemini, which detects tool silhouettes
3. **Mask Extraction**: Binary mask returned (black tools, white background)
4. **Contour Detection**: Polygons extracted from mask using contour algorithms
5. **Tool Library**: Simplified polygons saved locally to SQLite
6. **Bin Layout**: You drag tools into a virtual bin grid
7. **3D Generation**: Backend generates STL with:
   - Tool-shaped pockets
   - Gridfinity base profile
   - Magnet holes
   - Stacking lips
8. **Export**: STL saved to device, ready to slice for 3D printer

## Technology Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **State**: Zustand
- **Database**: SQLite (expo-sqlite)
- **Camera**: expo-camera
- **UI**: React Native built-ins + Skia Canvas
- **AI**: Google Gemini API
- **3D**: STL generation (custom binary format)

## Troubleshooting

### "API key not found"
- Make sure `.env.local` exists with `EXPO_PUBLIC_GEMINI_KEY` set
- Keys must start with `EXPO_PUBLIC_` to be accessible in the app
- Restart dev server after changing .env

### "Tracing failed"
- Check internet connection (Gemini API requires it for now)
- Verify API key is valid and has quota remaining
- Try again with better photo (good lighting, clear tool shapes)

### App crashes on camera open
- Grant camera permission when prompted
- On Android, check if app has camera permission in Settings

### Can't find exported STL
- STL files save to device document directory
- On Android: usually `/data/data/com.tracefinity.mobile/files`
- Use file manager app to browse and move files

## Future Improvements

- [ ] Local AI tracing (TensorFlow Lite) - no API key needed
- [ ] Bin layout canvas - drag tools around visually
- [ ] Finger holes & cutout customization
- [ ] Multi-color support (3MF export)
- [ ] Cloud sync (optional)
- [ ] Project templates

## API Reference

### Gemini API
Requires `EXPO_PUBLIC_GEMINI_KEY` (free tier available at https://aistudio.google.com/apikey)

Uses `gemini-3.1-flash-image-preview` by default.

## License

MIT

## Support

- GitHub Issues: https://github.com/tracefinity/tracefinity-mobile
- Documentation: https://tracefinity.net/docs

---

**Made with ❤️ for makers and 3D printing enthusiasts**
