# MausamGPT - React Native Weather Chatbot

A sophisticated React Native weather chatbot application with voice input capabilities and intelligent conversation features.

## 🌟 Features

### 🎤 Voice Input & Output
- **Real Audio Recording**: Actual microphone input with visual feedback
- **Speech-to-Text Ready**: Infrastructure ready for integration with OpenAI Whisper, Google Speech-to-Text, or Azure Cognitive Services
- **Text-to-Speech**: Automatic language detection with streaming speech output
- **Multi-language Support**: Hindi, English, and Hinglish with smart transliteration

### 💬 Smart Chat Interface
- **Streaming Responses**: Real-time token-by-token response display
- **Auto-collapsing Questions**: Suggested questions automatically minimize after user interaction
- **Location-aware Suggestions**: Context-aware question suggestions based on user location
- **Message Actions**: Copy, speak, and save message options

### 📱 Mobile-Optimized UI
- **Perfect Safe Area Handling**: Properly avoids status bar, notches, and navigation buttons
- **Smart Keyboard Management**: Seamless keyboard handling without layout issues
- **Cross-platform Compatible**: Optimized for both iOS and Android devices
- **Responsive Design**: Adapts to different screen sizes and orientations

### 🌤️ Weather Integration
- **Today's Weather Card**: Current weather conditions and details
- **Hourly Forecast**: Hour-by-hour weather predictions
- **Weekly Outlook**: Extended weather forecast cards
- **Real-time Data**: Integration with weather APIs for live updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ramp00786/chatbot_react_native.git
   cd chatbot_react_native
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/emulator**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **UI Components**: Custom components with Expo Vector Icons
- **Styling**: React Native StyleSheet with LinearGradient
- **Audio**: Expo AV for audio recording and playback
- **Speech**: Expo Speech for text-to-speech functionality
- **Safe Areas**: react-native-safe-area-context for proper device handling
- **HTTP Client**: Axios for API communications
- **Storage**: AsyncStorage for local data persistence

## 📁 Project Structure

```
src/
├── components/
│   ├── Chatbot.js              # Main chatbot component
│   ├── TodayWeatherCard.js     # Current weather display
│   ├── HourlyWeatherCard.js    # Hourly forecast component
│   └── WeeklyWeatherCard.js    # Weekly forecast component
├── lib/
│   ├── apiClient.js            # API communication utilities
│   ├── speechUtils.js          # Speech processing utilities
│   ├── detectLangSmart.js      # Language detection logic
│   ├── geolocation.js          # Location services
│   ├── suggestedQuestions.js   # Dynamic question generation
│   └── weatherData.js          # Weather data processing
└── screens/
    └── ChatScreen.js           # Main chat screen wrapper
```

## 🔧 Configuration

### API Integration
Update the API endpoint in `src/lib/apiClient.js`:
```javascript
const API_BASE_URL = 'your-weather-api-endpoint';
```

### Speech-to-Text Integration
For production deployment, integrate with a speech recognition service in `src/components/Chatbot.js`:

#### OpenAI Whisper Integration
```javascript
const formData = new FormData();
formData.append('file', {
  uri: audioUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});
```

## 🎨 Customization

### Theme Colors
Modify the color scheme in the StyleSheet:
```javascript
const colors = {
  primary: '#2563eb',
  secondary: '#1d4ed8',
  background: '#f3f4f6',
  // ... other colors
};
```

### Voice Input Languages
Add new languages in `src/lib/speechUtils.js`:
```javascript
const supportedLanguages = {
  'en-US': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  // Add more languages
};
```

## 📱 Device Compatibility

- **iOS**: iOS 12.0 and above
- **Android**: Android API level 21 (Android 5.0) and above
- **Screen Sizes**: Optimized for phones and tablets
- **Orientations**: Portrait and landscape support

## 🔐 Permissions

The app requires the following permissions:
- **Microphone**: For voice input functionality
- **Location**: For location-based weather suggestions (optional)
- **Internet**: For API communications

## 🚦 Performance Optimizations

- **Lazy Loading**: Components load on demand
- **Memory Management**: Proper cleanup of audio resources
- **Caching**: Intelligent caching of API responses and suggestions
- **Debouncing**: Optimized user input handling

## 🔄 State Management

The app uses React hooks for state management:
- `useState` for component-level state
- `useEffect` for lifecycle management
- `useRef` for direct DOM/component references
- Custom hooks for reusable logic

## 🐛 Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Ensure microphone permissions are granted in device settings
   - Check Audio.requestPermissionsAsync() implementation

2. **Keyboard Layout Issues**
   - Verify KeyboardAvoidingView configuration
   - Check SafeAreaView edges configuration

3. **API Connection Issues**
   - Verify API endpoint URLs
   - Check network connectivity
   - Validate API authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ramakant Sharma**
- GitHub: [@ramp00786](https://github.com/ramp00786)

## 🙏 Acknowledgments

- Expo team for the excellent development platform
- React Native community for continuous improvements
- OpenAI for speech processing inspiration
- Weather API providers for data services

---

## 📈 Future Enhancements

- [ ] Real-time weather alerts
- [ ] Offline mode with cached responses
- [ ] User preference settings
- [ ] Multiple weather data sources
- [ ] Enhanced voice commands
- [ ] Dark mode support
- [ ] Widget integration
- [ ] Push notifications for weather updates

---

*Built with ❤️ using React Native and Expo*