# Quickzy Native Build Guide

## Overview
This guide explains how to build native Android and iOS apps for Quickzy food delivery platform.

## Prerequisites

### For Android Development:
- Android Studio (latest version)
- Android SDK (API level 34)
- Java JDK 17 or higher
- Android device or emulator

### For iOS Development:
- macOS (required for iOS builds)
- Xcode 15.0 or higher
- CocoaPods (`sudo gem install cocoapods`)
- iOS device or simulator

## Project Structure

```
/app/frontend/
├── android/              # Native Android code
│   ├── app/
│   │   └── google-services.json  # Firebase config for Android
│   ├── build.gradle
│   └── settings.gradle
├── ios/                  # Native iOS code
│   ├── Quickzy/
│   ├── GoogleService-Info.plist  # Firebase config for iOS
│   ├── Podfile
│   └── Quickzy.xcodeproj
├── app/                  # React Native source code
├── app.json              # Expo configuration
└── package.json
```

## Firebase Configuration

### ✅ Already Configured:
- **Android**: `android/app/google-services.json`
- **iOS**: `ios/GoogleService-Info.plist`
- **Firebase features**: Authentication, Storage

### Firebase Setup Details:
- **Project ID**: allshoplocaluk
- **Android Package**: com.quickzy.app
- **iOS Bundle ID**: com.quickzy.app

## Building for Android

### Method 1: Using Expo EAS Build (Recommended)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure EAS:**
```bash
cd /app/frontend
eas build:configure
```

4. **Build APK (Development):**
```bash
eas build --platform android --profile development
```

5. **Build APK (Production):**
```bash
eas build --platform android --profile production
```

### Method 2: Local Android Build

1. **Navigate to Android folder:**
```bash
cd /app/frontend/android
```

2. **Build Debug APK:**
```bash
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Build Release APK:**
```bash
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

4. **Install on Device:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Android Build Variants:
- **Debug**: Development build with debugging enabled
- **Release**: Production-ready build (requires signing)

## Building for iOS

### Method 1: Using Expo EAS Build (Recommended)

1. **Build iOS Simulator:**
```bash
eas build --platform ios --profile development
```

2. **Build iOS App Store:**
```bash
eas build --platform ios --profile production
```

### Method 2: Local iOS Build (macOS only)

1. **Install CocoaPods dependencies:**
```bash
cd /app/frontend/ios
pod install
```

2. **Open Xcode:**
```bash
open Quickzy.xcworkspace
```

3. **In Xcode:**
   - Select your development team
   - Choose a simulator or connected device
   - Click "Run" (⌘R) to build and run

4. **Build for Device:**
   - Select "Any iOS Device" as target
   - Product → Archive
   - Follow Xcode's distribution wizard

## App Signing

### Android Signing

1. **Generate Keystore:**
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore quickzy-release.keystore \
  -alias quickzy \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure in `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('quickzy-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'quickzy'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Signing
- Managed through Xcode
- Requires Apple Developer account ($99/year)
- Configure in Xcode under "Signing & Capabilities"

## Environment Variables

The app uses the following environment variables (configured in `.env`):

```env
# Backend API
EXPO_PUBLIC_BACKEND_URL=<your-backend-url>

# Expo Configuration
EXPO_PACKAGER_PROXY_URL=<configured>
EXPO_PACKAGER_HOSTNAME=<configured>
```

**Note:** These are automatically loaded in development. For production builds, configure in EAS secrets or hardcode in production config.

## Testing Builds

### Android Testing:

1. **Using Android Emulator:**
```bash
# Start emulator
emulator -avd Pixel_5_API_34

# Install APK
adb install app-debug.apk
```

2. **Using Physical Device:**
   - Enable USB Debugging in Developer Options
   - Connect via USB
   - Run `adb devices` to verify
   - Install APK via `adb install`

### iOS Testing:

1. **Using iOS Simulator:**
```bash
# List available simulators
xcrun simctl list devices

# Boot simulator
xcrun simctl boot "iPhone 15 Pro"

# Install app
xcrun simctl install booted path/to/Quickzy.app
```

2. **Using Physical Device:**
   - Connect iPhone/iPad
   - Trust computer in device settings
   - Select device in Xcode
   - Build and run

## Troubleshooting

### Common Android Issues:

**Issue: "SDK location not found"**
```bash
# Create local.properties
echo "sdk.dir=/path/to/Android/sdk" > android/local.properties
```

**Issue: "Google Services plugin error"**
- Verify `google-services.json` is in `android/app/`
- Check package name matches Firebase console

**Issue: "Build failed with Gradle"**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Common iOS Issues:

**Issue: "Pod install failed"**
```bash
cd ios
pod deintegrate
pod install --repo-update
```

**Issue: "No such module 'Firebase'"**
```bash
cd ios
pod install
# Then rebuild in Xcode
```

**Issue: "Signing error"**
- Ensure bundle identifier is unique
- Select valid development team
- Check provisioning profiles

## App Distribution

### Android Distribution:

1. **Google Play Store:**
   - Create Google Play Console account
   - Generate signed AAB:
     ```bash
     ./gradlew bundleRelease
     ```
   - Upload `app-release.aab` to Play Console
   - Complete store listing
   - Submit for review

2. **Alternative Distribution:**
   - Direct APK distribution
   - Third-party app stores
   - Firebase App Distribution
   - TestFlight alternatives (APKPure, F-Droid)

### iOS Distribution:

1. **App Store:**
   - Archive in Xcode
   - Validate archive
   - Upload to App Store Connect
   - Complete App Store listing
   - Submit for review

2. **TestFlight:**
   - Upload build to App Store Connect
   - Add internal/external testers
   - Distribute beta builds

## Build Optimization

### Android Optimizations:

1. **Enable ProGuard (Minification):**
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **Split APKs by ABI:**
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

### iOS Optimizations:

1. **Build Settings in Xcode:**
   - Enable Bitcode (if supported)
   - Use "Release" configuration
   - Enable "Optimize for Size"

2. **Asset Optimization:**
   - Use asset catalogs
   - Compress images
   - Remove unused assets

## Native Modules

### Installed React Native Firebase Modules:
- `@react-native-firebase/app` - Core Firebase
- `@react-native-firebase/auth` - Authentication
- `@react-native-firebase/storage` - File storage

### Other Native Dependencies:
- `react-native-maps` - Google Maps (requires API key)
- `expo-location` - Location services
- `@react-native-async-storage/async-storage` - Local storage

## CI/CD Integration

### Example GitHub Actions for EAS Build:

```yaml
name: Build Android & iOS
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Build Checklist

Before submitting to stores:

### Android:
- [ ] Test on multiple Android versions (9-14)
- [ ] Test on different screen sizes
- [ ] Verify Firebase integration works
- [ ] Check app permissions
- [ ] Test deep links
- [ ] Generate signed release APK/AAB
- [ ] Test release build thoroughly
- [ ] Prepare store listing assets
- [ ] Set up app signing in Play Console

### iOS:
- [ ] Test on iPhone and iPad
- [ ] Test on multiple iOS versions (13-17)
- [ ] Verify Firebase integration works
- [ ] Check Info.plist permissions
- [ ] Test deep links
- [ ] Archive and validate
- [ ] Test TestFlight build
- [ ] Prepare App Store assets
- [ ] Complete App Privacy details

## App Specifications

### Quickzy App Details:
- **App Name**: Quickzy
- **Package Name (Android)**: com.quickzy.app
- **Bundle ID (iOS)**: com.quickzy.app
- **Version**: 1.0.0
- **Min Android Version**: Android 9 (API 28)
- **Min iOS Version**: iOS 15.1
- **Target Platforms**: Android & iOS

### Features Requiring Permissions:
- **Location**: Restaurant discovery, delivery tracking
- **Internet**: API calls, real-time updates
- **Camera** (future): Profile pictures, restaurant photos
- **Storage** (future): Caching images

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Firebase**: https://rnfirebase.io/
- **Android Developers**: https://developer.android.com/
- **Apple Developer**: https://developer.apple.com/

## Next Steps After Build

1. **Test the app thoroughly** on real devices
2. **Set up analytics** (Firebase Analytics already configured)
3. **Configure crash reporting** (Firebase Crashlytics)
4. **Set up push notifications** (FCM for Android, APNs for iOS)
5. **Implement deep linking** for app navigation
6. **Prepare store assets** (screenshots, descriptions)
7. **Submit to stores** (Google Play & App Store)

---

**Built with Expo + React Native**
**Ready for production deployment** 🚀
