import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import InAppReview from 'react-native-in-app-review';

const RATE_KEYS = {
  LAST_PROMPT: '@lastRatePromptDate',
  DONT_ASK: '@dontAskForRating',
};

// App Store IDs - you'll need to replace these with your actual IDs
const IOS_APP_ID = '6749329103'; // Replace with your iOS App Store ID
const ANDROID_APP_ID = 'com.cardscanner.app'; // Replace with your Android package name

// iOS review URLs - using both deep link and web fallback for better compatibility
const IOS_DEEP_LINK = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
const IOS_WEB_FALLBACK = `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
const PLAY_STORE_LINK = `market://details?id=${ANDROID_APP_ID}`;

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
      console.error('Error checking rate prompt:', error);
      return false;
    }
  }



  // Show the rate prompt
  static async showRatePrompt() {
    try {
      // Check if InAppReview is available
      const isAvailable = await InAppReview.isAvailable();
      
      if (isAvailable) {
        console.log('🔍 InAppReview is available, showing native dialog');
        
        // Show native in-app review dialog
        const result = await InAppReview.RequestInAppReview();
        
        console.log('🔍 InAppReview result:', result);
        
        // Mark that we showed the prompt today (regardless of user action)
        await this.markPromptShown();
        
        // FIXED: Don't mark as rated - let user see prompt again later
        // The native dialog result doesn't tell us if user actually rated
        // So we'll let them see the prompt again after some time
      } else {
        console.log('🔍 InAppReview not available, using fallback');
        // Fallback: open store directly
        await this.openStoreForReview();
      }
    } catch (error) {
      console.error('Error showing rate prompt:', error);
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
      console.error('Error marking prompt shown:', error);
    }
  }

  // Open store for review (fallback)
  static async openStoreForReview() {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Try deep link first, then web fallback
        try {
          console.log('🔍 Trying iOS deep link...');
          await Linking.openURL(IOS_DEEP_LINK);
        } catch (deepLinkError) {
          console.log('🔍 Deep link failed, trying web fallback...');
          await Linking.openURL(IOS_WEB_FALLBACK);
        }
      } else {
        // Android: Use Play Store link
        await Linking.openURL(PLAY_STORE_LINK);
      }
      
      await this.markPromptShown();
    } catch (error) {
      console.error('Error opening store:', error);
    }
  }

  // Mark that user doesn't want to be asked again
  static async setDontAskAgain() {
    try {
      await AsyncStorage.setItem(RATE_KEYS.DONT_ASK, 'true');
    } catch (error) {
      console.error('Error setting dont ask:', error);
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
      console.error('Error resetting rate us data:', error);
    }
  }

  // Test function to manually trigger rate us (for development)
  static async testRateUs() {
    try {
      console.log('Testing Rate Us functionality...');
      await this.resetRateUsData();
      
      const shouldShow = await this.shouldShowRatePrompt();
      console.log('🔍 Should show rate prompt:', shouldShow);
      
      if (shouldShow) {
        console.log('🔍 Testing InAppReview availability...');
        const isAvailable = await InAppReview.isAvailable();
        console.log('🔍 InAppReview available:', isAvailable);
      }
      
      return shouldShow;
    } catch (error) {
      console.error('Error testing rate us:', error);
      return false;
    }
  }
}

export default RateUsService;
