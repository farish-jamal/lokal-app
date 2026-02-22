# SawanApp 👋

A sleek, feature-rich music player built with Expo and React Native. It offers a premium streaming experience with AI-powered suggestions and persistent local storage.

## 🚀 Get Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your Gemini API key for the "Lyra" AI assistant:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### 3. Start the App
```bash
npx expo start
```

---

## 🏗️ Architecture

SawanApp follows a modern, modular architecture:

- **Routing (`/app`)**: Uses **Expo Router** for file-based navigation (Tabs, Stack, Modals).
- **State Management (`/store`)**: Powered by **Redux Toolkit**. It handles the global player state, music queue, and user library.
- **Audio Core (`/hooks`)**: A central `useAudioPlayer` hook manages `expo-av` playback logic, ensuring the music keeps playing across different screens.
- **Services (`/services`)**: Clean API integration using the Saavn API for fetching songs, albums, and artists.
- **AI Integration**: Uses **Google Gemini API** (Lyra) to suggest music based on your mood or vibes.

---

## 📂 Project Structure

- `app/`: All screens and navigation logic.
- `components/`: Reusable UI elements (Song Cards, Playback Controls).
- `store/`: Redux slices for global state.
- `services/`: API calls and data fetching.
- `hooks/`: Custom logic for audio player and persistence.

---

## ⚖️ Trade-offs & Decisions

### 1. AsyncStorage for Persistence
- **Why**: We use `AsyncStorage` to save your favorites and queue locally.
- **Trade-off**: It's simple and fast for small data but might become slow if a user has thousands of saved songs. A database like SQLite would be a better alternative for massive libraries.

### 2. Third-Party API
- **Why**: We rely on a public Saavn API wrapper for high-quality music metadata.
- **Trade-off**: If the external API goes down, search and discovery will stop working. We cache some data to mitigate this.

### 3. Expo AV for Playback
- **Why**: `expo-av` provides a unified API for audio on both iOS and Android.
- **Trade-off**: While great for standard playback, it lacks some advanced professional audio features (like gapless playback or complex crossfades) compared to native-only libraries.

---

## ✨ Features
- 🔍 **Global Search**: Find any song, artist, or album.
- 🤖 **Lyra AI**: Ask for music suggestions based on your vibe.
- 💾 **Persistence**: Your queue and favorites stay saved even after you close the app.
- 🎨 **Modern UI**: Smooth animations and beautiful linear gradients.
