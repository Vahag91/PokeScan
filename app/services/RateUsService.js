import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import InAppReview from 'react-native-in-app-review';

const RATE_KEYS = {
  LAST_PROMPT: '@lastRatePromptDate',
  DONT_ASK: '@dontAskForRating',
};

// App Store IDs - you'll need to replace these with your actual IDs
const IOS_APP_ID = '6749329103'; // Replace with your iOS App Store ID
const ANDROID_APP_ID = 'com.cardscanner'; // Replace with your Android package name

// iOS review URLs - using both deep link and web fallback for better compatibility
const IOS_DEEP_LINK = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
const IOS_WEB_FALLBACK = `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
const PLAY_STORE_LINK = `market://details?id=${ANDROID_APP_ID}`;
const PLAY_STORE_WEB_FALLBACK = `https://play.google.com/store/apps/details?id=${ANDROID_APP_ID}`;

class RateUsService {
  // Check if we should show the rate prompt
  static async shouldShowRatePrompt() {
    try {
      const [
        lastPromptDate,
        dontAsk
      ] = await Promise.all([
        AsyncStorage.getItem(RATE_KEYS.LAST_PROMPT),
        AsyncStorage.getItem(RATE_KEYS.DONT_ASK)
      ]);

      // Don't show if user doesn't want to be asked
      if (dontAsk === 'true') {
        return false;
      }

      // Check if we've shown it today
      if (lastPromptDate) {
        const lastDate = new Date(lastPromptDate);
        const today = new Date();
        const isSameDay = lastDate.toDateString() === today.toDateString();
        if (isSameDay) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }



  // Show the rate prompt
  static async showRatePrompt() {
    try {
      // Check if InAppReview is available
      const isAvailable = await InAppReview.isAvailable();
      
      if (isAvailable) {
    
        
        // Show native in-app review dialog
        const result = await InAppReview.RequestInAppReview();
        

        
        // Mark that we showed the prompt today (regardless of user action)
        await this.markPromptShown();
        
        // FIXED: Don't mark as rated - let user see prompt again later
        // The native dialog result doesn't tell us if user actually rated
        // So we'll let them see the prompt again after some time
      } else {

        // Fallback: open store directly
        await this.openStoreForReview();
      }
    } catch (error) {
      // Fallback to store
      await this.openStoreForReview();
    }
  }

  // Mark that we showed the prompt
  static async markPromptShown() {
    try {
      const today = new Date().toISOString();
      await AsyncStorage.setItem(RATE_KEYS.LAST_PROMPT, today);
    } catch (error) {
      // Handle error silently
    }
  }

  // Open store for review (fallback)
  static async openStoreForReview() {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Try deep link first, then web fallback
        try {
    
          await Linking.openURL(IOS_DEEP_LINK);
        } catch (deepLinkError) {
          
          await Linking.openURL(IOS_WEB_FALLBACK);
        }
      } else {
        // Android: Try Play Store deep link first, then web fallback
        try {
          await Linking.openURL(PLAY_STORE_LINK);
        } catch (_) {
          await Linking.openURL(PLAY_STORE_WEB_FALLBACK);
        }
      }
      
      await this.markPromptShown();
    } catch (error) {
      // Handle error silently
    }
  }

  // Mark that user doesn't want to be asked again
  static async setDontAskAgain() {
    try {
      await AsyncStorage.setItem(RATE_KEYS.DONT_ASK, 'true');
    } catch (error) {
      // Handle error silently
    }
  }

  // Reset all rate us data (for testing)
  static async resetRateUsData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(RATE_KEYS.LAST_PROMPT),
        AsyncStorage.removeItem(RATE_KEYS.DONT_ASK)
      ]);
    } catch (error) {
      // Handle error silently
    }
  }

  // Test function to manually trigger rate us (for development)
  static async testRateUs() {
    try {
  
      await this.resetRateUsData();
      
      const shouldShow = await this.shouldShowRatePrompt();

      
      if (shouldShow) {
  
        const isAvailable = await InAppReview.isAvailable();
        
      }
      
      return shouldShow;
    } catch (error) {
      return false;
    }
  }
}

export default RateUsService;
