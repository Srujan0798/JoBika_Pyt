# JoBika Mobile App - React Native

## 🚀 Quick Start

This is the mobile version of JoBika - AI-powered job application platform.

### **Prerequisites**
- Node.js 18+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

### **Installation**

```bash
# Install dependencies
npm install

# iOS (Mac only)
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### **Features**
- ✅ User authentication
- ✅ Resume upload from mobile
- ✅ Job browsing with swipe gestures
- ✅ Push notifications for new jobs
- ✅ Auto-apply on the go
- ✅ Offline mode

### **Tech Stack**
- React Native 0.73
- React Navigation
- Redux Toolkit
- Axios
- React Native Paper (UI)
- Firebase (Push notifications)

### **API Integration**

```javascript
// API Base URL
const API_URL = 'https://your-railway-app.up.railway.app/api';

// Or local development
const API_URL = 'http://localhost:5000/api';
```

### **Build for Production**

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace JoBika.xcworkspace -scheme JoBika -configuration Release
```

### **App Store Deployment**
- Google Play: Follow `docs/ANDROID_DEPLOYMENT.md`
- Apple App Store: Follow `docs/IOS_DEPLOYMENT.md`

---

**Status**: 🚧 In Development  
**Timeline**: 4-6 weeks  
**Cost**: $0 (React Native is free)
