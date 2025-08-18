# Rate Us Functionality Implementation

## Overview
This implementation adds a rate us modal to the Pokémon Card Scanner app using `react-native-in-app-review`. The modal appears at appropriate times to encourage users to rate the app on the App Store/Google Play Store.

## Features

### ✅ What's Implemented:
- **Native Rating Dialog**: Uses iOS App Store and Google Play Store native APIs
- **User Stays in App**: Rating dialog appears within the app (no app switching)
- **True Cross-Platform**: Native in-app dialog on both iOS and Android
- **Simple Timing**: Shows once per day maximum
- **Simple Prompt Modal**: Clean modal that directly opens native rating dialog
- **Single Trigger**: Shows after adding cards to collections
- **User Control**: "Maybe Later" and "Don't Ask Again" options
- **Fallback Support**: Opens store page if native dialog not available
- **iOS Compatibility**: Uses both deep link and web fallback for maximum iOS compatibility

### 📱 User Experience:
1. User adds card to collection
2. Simple prompt modal appears (once per day maximum)
3. User taps "Rate Now" → Native rating dialog shows
4. User can rate without leaving the app
5. Modal won't show again today, but can show again tomorrow
6. Modal won't show if user chooses "Don't Ask Again"

## Configuration

### App Store IDs (Update these):
In `app/services/RateUsService.js`:
```javascript
const IOS_APP_ID = 'YOUR_IOS_APP_ID'; // Replace with your iOS App Store ID
const ANDROID_APP_ID = 'com.cardscanner.app'; // Replace with your Android package name
```

### Store Links:
- **iOS**: 
  - Deep link: `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`
  - Web fallback: `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`
  - *Uses deep link first, falls back to web URL if deep link fails*
- **Android**: `market://details?id=${ANDROID_APP_ID}`

### Timing Settings:
- **Trigger**: Shows after adding cards to collections
- **Frequency**: Once per day maximum
- **User Control**: Won't show if user chose "Don't Ask Again"
- **Re-prompting**: Can show again tomorrow (since we can't detect if user actually rated)

## Files Created/Modified:

### New Files:
- `app/services/RateUsService.js` - Core rate us logic
- `app/components/RateUsModal.jsx` - Custom rate us modal
- `RATE_US_README.md` - This documentation

### Modified Files:
- `App.jsx` - Added rate us integration and modal
- `app/components/scanner/Scanner.jsx` - Added rate us trigger after successful scans
- `ios/cardScanner/Info.plist` - Added required iOS configuration

## Testing

### Manual Test:
```javascript
// In your app, you can test by calling:
import RateUsService from './app/services/RateUsService';

// This will reset data and simulate 5 app opens
const shouldShow = await RateUsService.testRateUs();
if (shouldShow) {
  setShowRateUsModal(true);
}
```

### Development Notes:
- **TestFlight Limitation**: Native rating dialog won't work in TestFlight
- **Production Only**: Rating dialog works only in production builds
- **Limited Calls**: Apple/Google limit API calls to prevent misuse

## Dependencies Added:
```bash
npm install react-native-in-app-review
```

## iOS Configuration:
No additional iOS configuration required. The library auto-links and works out of the box.

## Usage

The rate us functionality is automatically integrated and will:
1. Track app opens
2. Show custom modal at appropriate times
3. Display native rating dialog when user chooses to rate
4. Handle all user interactions automatically

No additional code changes needed - it's ready to use!
