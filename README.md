<div align="center">
<img width="1200" height="475" alt="GHBanner" src="Banner.JPG" />
</div>

# Senay: EOTC Bible Study

Track-progress, Daily check-in and Read EOTC Bible.

## Features

✨ **Complete Spiritual Guide**
- Daily Wudase (ውዳሴ) liturgy with preparation and reflection phases
- Full 80-book EOTC Bible with multi-language support (Geez, Amharic, English)
- AI-powered spiritual guide ("Memhir") for theological questions
- Ethiopian calendar integration with saints, holidays, and fasting seasons

📊 **Progress Tracking**
- Study streak counter
- Heatmap visualization of reading history
- Chapter-by-chapter progress tracking
- Days practiced counter

🎨 **Modern UX**
- Dark/Light theme support
- Smooth animations and transitions
- Offline support with service workers
- Progressive Web App (PWA) capabilities
- Error boundaries and loading states

📱 **Mobile Ready**
- Capacitor integration for Android/iOS
- Touch gestures for navigation
- Responsive design
- Native app features

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Android Studio (for Android builds)
- Gemini API key (for AI features)

### Development Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### Android Build Setup

1. **Install Capacitor CLI (if not already installed):**
   ```bash
   npm install -g @capacitor/cli
   ```

2. **Sync Capacitor:**
   ```bash
   npm run cap:sync
   ```

3. **Set up app icons:**
   - See [ICON_SETUP.md](./ICON_SETUP.md) for detailed instructions
   - Icons must be properly configured for the APK build

4. **Build Android APK:**
   ```bash
   # Debug build
   npm run android:build
   
   # Release build
   npm run android:build:release
   ```

5. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

## Project Structure

```
senay/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── ReadingPhase.tsx
│   ├── AskMemhir.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useProgress.ts
│   ├── useNotifications.ts
│   └── useLazyData.ts
├── services/          # External services
│   └── geminiService.ts
├── utils/            # Utility functions
│   ├── ethiopianCalendar.ts
│   ├── analytics.ts
│   └── capacitorInit.ts
├── public/data/      # Static JSON data files
├── android/          # Android native project
└── dist/            # Build output
```

## Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Capacitor** - Native mobile bridge
- **Tailwind CSS** - Styling
- **Google Gemini AI** - Spiritual guidance
- **Workbox** - Service workers & offline support

## New Features Added

✅ **Error Handling**
- Error boundaries for graceful error recovery
- Comprehensive error messages
- Development error details

✅ **Performance**
- Code splitting with React.lazy
- Lazy loading for large data files
- Optimized bundle sizes
- Service worker caching

✅ **Offline Support**
- Progressive Web App (PWA)
- Service worker for offline functionality
- Cached data and assets

✅ **Analytics**
- Event tracking system
- User engagement metrics
- Reading progress analytics

✅ **Capacitor Integration**
- Full Capacitor plugin setup
- Native app lifecycle handling
- Status bar and splash screen configuration

## Troubleshooting

### Icon Not Appearing in APK
See [ICON_SETUP.md](./ICON_SETUP.md) for detailed icon setup instructions.

### Build Errors
1. Clean the build: `cd android && ./gradlew clean`
2. Sync Capacitor: `npm run cap:sync`
3. Rebuild: `npm run android:build`

### API Key Issues
- Ensure `.env.local` exists with `GEMINI_API_KEY`
- Restart dev server after adding env variables
- Check API key permissions in Google Cloud Console

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run cap:sync` - Sync web assets to native projects
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run android:build` - Build Android debug APK
- `npm run android:build:release` - Build Android release APK

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private project - All rights reserved
