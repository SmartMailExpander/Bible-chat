// Local Subscription Service - Works without Firebase Functions
// This is for testing and development purposes

import { auth } from '../firebaseConfig';

export interface UserSubscription {
  userType: 'free' | 'trial' | 'subscribed';
  dailyChatsUsed: number;
  dailyChatLimit: number;
  features: string[];
  trialEndDate?: string;
}

export interface ChatCountResult {
  success: boolean;
  canChat: boolean;
  dailyChatsUsed: number;
  dailyChatLimit?: number;
  message?: string;
}

export interface TrialResult {
  success: boolean;
  userType: 'trial';
  trialEndDate: string;
  features: string[];
}

// Local storage keys
const SUBSCRIPTION_KEY = 'haven-subscription';
const CHAT_COUNT_KEY = 'haven-chat-count';
const TRIAL_KEY = 'haven-trial';

// Helper to get user-specific storage key
const getUserKey = (suffix: string) => {
  const user = auth.currentUser;
  return user ? `${user.uid}-${suffix}` : `anonymous-${suffix}`;
};

// Helper to get current date string (for daily reset)
const getCurrentDateString = () => {
  return new Date().toDateString();
};

/**
 * Get current user's subscription status
 */
export const getCurrentUserSubscription = async (): Promise<UserSubscription> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const userId = auth.currentUser.uid;
    const storageKey = getUserKey(SUBSCRIPTION_KEY);
    const chatCountKey = getUserKey(CHAT_COUNT_KEY);
    const trialKey = getUserKey(TRIAL_KEY);
    
    console.log('🔍 [getCurrentUserSubscription] userId:', userId);
    console.log('🔍 [getCurrentUserSubscription] chatCountKey:', chatCountKey);
    console.log('🔍 [getCurrentUserSubscription] localStorage[chatCountKey] BEFORE:', localStorage.getItem(chatCountKey));
    
    console.log('🔍 Getting subscription for user:', userId);
    console.log('🔍 Storage keys:', { storageKey, chatCountKey, trialKey });
    
    // Check if user has trial
    const trialData = localStorage.getItem(trialKey);
    if (trialData) {
      const trial = JSON.parse(trialData);
      const trialEndDate = new Date(trial.trialEndDate);
      const now = new Date();
      
      console.log('🔍 Trial data found:', { trialEndDate, now, isActive: trialEndDate > now });
      
      if (trialEndDate > now) {
        // Trial is still active - check daily chat count
        const chatCountData = localStorage.getItem(chatCountKey);
        let dailyChatsUsed = 0;
        let lastChatDate = '';
        
        if (chatCountData) {
          const chatData = JSON.parse(chatCountData);
          if (chatData.date === getCurrentDateString()) {
            dailyChatsUsed = chatData.count || 0;
            lastChatDate = chatData.date;
          }
        }
        
        // Reset chat count if it's a new day
        if (lastChatDate !== getCurrentDateString()) {
          dailyChatsUsed = 0;
          localStorage.setItem(chatCountKey, JSON.stringify({
            date: getCurrentDateString(),
            count: 0
          }));
          console.log('🔄 Reset trial user chat count for new day');
        }
        
        console.log('✅ Returning trial subscription:', { dailyChatsUsed, dailyChatLimit: 10 });
        
        // Trial users get 10 chats per day
        return {
          userType: 'trial',
          dailyChatsUsed,
          dailyChatLimit: 10, // Trial users get 10 chats
          features: ['trial_chat', 'advanced_features'],
          trialEndDate: trial.trialEndDate
        };
      } else {
        // Trial expired, remove trial data
        localStorage.removeItem(trialKey);
        console.log('❌ Trial expired, removing trial data');
      }
    }
    
    // Check if user is premium/subscribed
    const subscriptionData = localStorage.getItem(storageKey);
    if (subscriptionData) {
      const subscription = JSON.parse(subscriptionData);
      console.log('🔍 Subscription data found:', subscription);
      
      if (subscription.userType === 'subscribed') {
        console.log('✅ Returning premium subscription (unlimited)');
        // Premium users get unlimited chats
        return {
          userType: 'subscribed',
          dailyChatsUsed: 0, // Unlimited, so always 0
          dailyChatLimit: -1, // -1 means unlimited
          features: ['unlimited_chat', 'advanced_features', 'premium_support']
        };
      }
    }
    
    // Check daily chat count for free users
    const chatCountData = localStorage.getItem(chatCountKey);
    let dailyChatsUsed = 0;
    let lastChatDate = '';
    
    if (chatCountData) {
      const chatData = JSON.parse(chatCountData);
      lastChatDate = chatData.date || '';
      if (chatData.date === getCurrentDateString()) {
        dailyChatsUsed = chatData.count || 0;
      }
    }
    
    // Reset chat count if it's a new day
    if (lastChatDate !== getCurrentDateString()) {
      dailyChatsUsed = 0;
      localStorage.setItem(chatCountKey, JSON.stringify({
        date: getCurrentDateString(),
        count: 0
      }));
      console.log('🔄 Reset free user chat count for new day');
    }
    
    console.log('✅ Returning free subscription:', { dailyChatsUsed, dailyChatLimit: 5 });
    
    // Return free tier subscription (5 chats per day)
    return {
      userType: 'free',
      dailyChatsUsed,
      dailyChatLimit: 5,
      features: ['basic_chat', 'bible_reading']
    };
    
  } catch (error) {
    console.error('Error getting user subscription:', error);
    // Return default free tier if error
    return {
      userType: 'free',
      dailyChatsUsed: 0,
      dailyChatLimit: 5,
      features: ['basic_chat', 'bible_reading']
    };
  }
};

/**
 * Start free trial for current user
 */
export const startFreeTrial = async (): Promise<TrialResult> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const trialKey = getUserKey(TRIAL_KEY);
    
    // Save trial data
    localStorage.setItem(trialKey, JSON.stringify({
      trialEndDate,
      startedAt: new Date().toISOString()
    }));
    
    return {
      success: true,
      userType: 'trial',
      trialEndDate,
      features: ['unlimited_chat', 'advanced_features']
    };
    
  } catch (error: any) {
    console.error('Error starting trial:', error);
    throw new Error(error.message || 'Failed to start trial');
  }
};

/**
 * Increment daily chat count and check if user can chat
 */
export const incrementDailyChatCount = async (): Promise<ChatCountResult> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Get current subscription to determine the limit
    const subscription = await getCurrentUserSubscription();
    
    // Premium users don't need to increment (unlimited)
    if (subscription.userType === 'subscribed') {
      return {
        success: true,
        canChat: true,
        dailyChatsUsed: 0,
        dailyChatLimit: -1,
        message: 'Unlimited chats available'
      };
    }

    const chatCountKey = getUserKey(CHAT_COUNT_KEY);
    const currentDate = getCurrentDateString();
    
    // Get current chat count
    const chatCountData = localStorage.getItem(chatCountKey);
    let currentCount = 0;
    
    if (chatCountData) {
      const chatData = JSON.parse(chatCountData);
      if (chatData.date === currentDate) {
        currentCount = chatData.count || 0;
      }
    }
    
    console.log('🔍 [incrementDailyChatCount] chatCountKey:', chatCountKey);
    console.log('🔍 [incrementDailyChatCount] localStorage[chatCountKey] BEFORE:', localStorage.getItem(chatCountKey));
    // Check if user can still chat BEFORE incrementing
    const limit = subscription.dailyChatLimit;
    if (currentCount >= limit) {
      const userTypeText = subscription.userType === 'trial' ? 'trial' : 'free';
      return {
        success: false,
        canChat: false,
        dailyChatsUsed: currentCount,
        dailyChatLimit: limit,
        message: `Daily chat limit reached (${userTypeText} user)`
      };
    }
    
    // Increment count
    const newCount = currentCount + 1;
    
    // Save updated count
    localStorage.setItem(chatCountKey, JSON.stringify({
      date: currentDate,
      count: newCount
    }));
    console.log('🔍 [incrementDailyChatCount] localStorage[chatCountKey] AFTER:', localStorage.getItem(chatCountKey));
    
    const userTypeText = subscription.userType === 'trial' ? 'trial' : 'free';
    const remainingChats = limit - newCount;
    const message = remainingChats > 0 
      ? `${remainingChats} chats remaining today (${userTypeText} user)`
      : `Daily chat limit reached (${userTypeText} user)`;
    
    return {
      success: true,
      canChat: remainingChats >= 0,
      dailyChatsUsed: newCount,
      dailyChatLimit: limit,
      message
    };
    
  } catch (error) {
    console.error('Error incrementing chat count:', error);
    return {
      success: false,
      canChat: false,
      dailyChatsUsed: 0,
      message: 'Failed to check chat availability'
    };
  }
};

/**
 * Check if user can make a chat request (without incrementing)
 */
export const canUserChat = async (): Promise<{ canChat: boolean; message?: string }> => {
  try {
    // First get current subscription status
    const subscription = await getCurrentUserSubscription();
    
    // If user has unlimited chats (premium), they can always chat
    if (subscription.userType === 'subscribed') {
      return {
        canChat: true,
        message: 'Unlimited chats available'
      };
    }
    
    // For free and trial users, check if they have remaining chats
    const remainingChats = getRemainingChats(subscription.dailyChatsUsed, subscription.dailyChatLimit);
    
    if (remainingChats > 0) {
      const userTypeText = subscription.userType === 'trial' ? 'trial' : 'free';
      return {
        canChat: true,
        message: `${remainingChats} chats remaining today (${userTypeText} user)`
      };
    } else {
      const userTypeText = subscription.userType === 'trial' ? 'trial' : 'free';
      return {
        canChat: false,
        message: `Daily chat limit reached (${userTypeText} user). Please upgrade to continue.`
      };
    }
  } catch (error) {
    console.error('Error checking chat availability:', error);
    return {
      canChat: false,
      message: 'Unable to verify chat availability'
    };
  }
};

/**
 * Check and increment chat count in one operation
 */
export const checkAndIncrementChat = async (): Promise<ChatCountResult> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // First check if user can chat
    const canChatResult = await canUserChat();
    
    if (!canChatResult.canChat) {
      return {
        success: false,
        canChat: false,
        dailyChatsUsed: 0,
        message: canChatResult.message
      };
    }
    
    // If they can chat, increment the count
    return await incrementDailyChatCount();
    
  } catch (error) {
    console.error('Error checking and incrementing chat count:', error);
    return {
      success: false,
      canChat: false,
      dailyChatsUsed: 0,
      message: 'Failed to check chat availability'
    };
  }
};

/**
 * Reset all chat counts and subscription data for current user
 */
export const resetUserData = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const userId = auth.currentUser.uid;
    const storageKey = getUserKey(SUBSCRIPTION_KEY);
    const chatCountKey = getUserKey(CHAT_COUNT_KEY);
    const trialKey = getUserKey(TRIAL_KEY);
    
    // Clear all subscription-related data
    localStorage.removeItem(storageKey);
    localStorage.removeItem(chatCountKey);
    localStorage.removeItem(trialKey);
    
    console.log('User data reset successfully');
  } catch (error) {
    console.error('Error resetting user data:', error);
  }
};

/**
 * Reset chat count for current user (set to 0)
 */
export const resetChatCount = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const chatCountKey = getUserKey(CHAT_COUNT_KEY);
    
    // Reset chat count to 0 for today
    localStorage.setItem(chatCountKey, JSON.stringify({
      date: getCurrentDateString(),
      count: 0
    }));
    
    console.log('Chat count reset to 0');
  } catch (error) {
    console.error('Error resetting chat count:', error);
  }
};

/**
 * Get user tier display name
 */
export const getUserTierDisplayName = (userType: string): string => {
  switch (userType) {
    case 'free':
      return 'Free';
    case 'trial':
      return 'Trial';
    case 'subscribed':
      return 'Premium';
    default:
      return 'Free';
  }
};

/**
 * Get user tier color
 */
export const getUserTierColor = (userType: string): string => {
  switch (userType) {
    case 'free':
      return '#6c757d';
    case 'trial':
      return '#ffc107';
    case 'subscribed':
      return '#28a745';
    default:
      return '#6c757d';
  }
};

/**
 * Check if user has unlimited chats
 */
export const hasUnlimitedChats = (userType: string): boolean => {
  return userType === 'trial' || userType === 'subscribed';
};

/**
 * Get remaining chats for free users
 */
export const getRemainingChats = (dailyChatsUsed: number, dailyChatLimit: number): number => {
  if (dailyChatLimit === -1) return -1; // Unlimited
  return Math.max(0, dailyChatLimit - dailyChatsUsed);
};

/**
 * Format trial end date
 */
export const formatTrialEndDate = (trialEndDate: string): string => {
  const date = new Date(trialEndDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = (trialEndDate: string): number => {
  const endDate = new Date(trialEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if trial is expired
 */
export const isTrialExpired = (trialEndDate: string): boolean => {
  return getTrialDaysRemaining(trialEndDate) <= 0;
};

/**
 * Get subscription features for user type
 */
export const getSubscriptionFeatures = (userType: string): string[] => {
  switch (userType) {
    case 'free':
      return [
        '5 daily AI conversations',
        'Basic Bible reading',
        'Verse bookmarking'
      ];
    case 'trial':
    case 'subscribed':
      return [
        'Unlimited AI conversations',
        'Advanced Bible study tools',
        'Deep theological insights',
        'Ad-free experience',
        'Save unlimited conversations',
        'Personalized spiritual guidance',
        'Progress tracking',
        'Dark mode support'
      ];
    default:
      return ['5 daily AI conversations', 'Basic Bible reading'];
  }
};

/**
 * Get upgrade benefits for free users
 */
export const getUpgradeBenefits = (): string[] => {
  return [
    '✨ Unlimited AI conversations',
    '📖 Advanced Bible study tools',
    '🔍 Deep theological insights',
    '📱 Ad-free experience',
    '💾 Save unlimited conversations',
    '🎯 Personalized spiritual guidance',
    '📊 Progress tracking',
    '🌙 Dark mode support'
  ];
};

/**
 * Mock function for Google Play Billing integration
 */
export const initiateSubscription = async (plan: 'monthly' | 'yearly'): Promise<void> => {
  console.log(`Initiating ${plan} subscription...`);
  alert(`Google Play Billing integration coming soon! This would initiate a ${plan} subscription.`);
  throw new Error('Google Play Billing not yet implemented');
};

/**
 * Mock function for restoring purchases
 */
export const restorePurchases = async (): Promise<void> => {
  console.log('Restoring purchases...');
  alert('Purchase restoration coming soon!');
  throw new Error('Purchase restoration not yet implemented');
}; 

/**
 * Set user as premium (for testing purposes)
 */
export const setUserAsPremium = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const storageKey = getUserKey(SUBSCRIPTION_KEY);
    
    // Save premium subscription data
    localStorage.setItem(storageKey, JSON.stringify({
      userType: 'subscribed',
      plan: 'premium',
      subscribedAt: new Date().toISOString(),
      features: ['unlimited_chat', 'advanced_features', 'premium_support']
    }));
    
    console.log('User set as premium successfully');
  } catch (error) {
    console.error('Error setting user as premium:', error);
  }
};

/**
 * Set user as trial (for testing purposes)
 */
export const setUserAsTrial = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const trialKey = getUserKey(TRIAL_KEY);
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Save trial data
    localStorage.setItem(trialKey, JSON.stringify({
      trialEndDate,
      startedAt: new Date().toISOString()
    }));
    
    console.log('User set as trial successfully');
  } catch (error) {
    console.error('Error setting user as trial:', error);
  }
}; 

/**
 * Set user as free (for testing purposes)
 */
export const setUserAsFree = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const storageKey = getUserKey(SUBSCRIPTION_KEY);
    const trialKey = getUserKey(TRIAL_KEY);
    
    // Remove any existing subscription or trial data
    localStorage.removeItem(storageKey);
    localStorage.removeItem(trialKey);
    
    console.log('User set as free successfully');
  } catch (error) {
    console.error('Error setting user as free:', error);
  }
}; 