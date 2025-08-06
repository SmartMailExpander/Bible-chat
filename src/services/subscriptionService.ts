import { auth } from '../firebaseConfig';

// Use Next.js API proxy to avoid CORS issues
const API_BASE = '/api/firebase-proxy';

// Helper function to call Firebase functions through our proxy
const callFirebaseFunction = async (functionName: string, data?: any, method: 'GET' | 'POST' = 'GET') => {
  // Get the current user's ID token
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const idToken = await user.getIdToken();
  
  if (method === 'GET') {
    const response = await fetch(`${API_BASE}?function=${functionName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } else {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        functionName,
        data: data || {}
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
};

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

/**
 * Get current user's subscription status
 */
export const getCurrentUserSubscription = async (): Promise<UserSubscription> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Use proxy to avoid CORS issues
    try {
      const result = await callFirebaseFunction('getUserSubscription', {}, 'GET');
      
      // Ensure we have valid data
      if (result && typeof result === 'object') {
        return {
          userType: result.userType || 'free',
          dailyChatsUsed: result.dailyChatsUsed || 0,
          dailyChatLimit: result.dailyChatLimit || 5,
          features: result.features || ['basic_chat', 'bible_reading'],
          trialEndDate: result.trialEndDate
        } as UserSubscription;
      }
      
      // If result is invalid, return default
      return {
        userType: 'free',
        dailyChatsUsed: 0,
        dailyChatLimit: 5,
        features: ['basic_chat', 'bible_reading']
      };
    } catch (proxyError) {
      console.log('Proxy failed, using local fallback:', proxyError);
      
      // Local fallback - create user with free tier
      return {
        userType: 'free',
        dailyChatsUsed: 0,
        dailyChatLimit: 5,
        features: ['basic_chat', 'bible_reading']
      };
    }
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

    // Use proxy to avoid CORS issues
    try {
      const result = await callFirebaseFunction('startTrial', {}, 'POST');
      return result as TrialResult;
    } catch (proxyError) {
      console.log('Proxy failed, using local fallback:', proxyError);
      
      // Local fallback - simulate trial start
      return {
        success: true,
        userType: 'trial',
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['unlimited_chat', 'advanced_features']
      };
    }
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

    // Use proxy to avoid CORS issues
    try {
      const result = await callFirebaseFunction('incrementChatCount', {}, 'POST');
      return result as ChatCountResult;
    } catch (proxyError) {
      console.log('Proxy failed, using local fallback:', proxyError);
      
      // Local fallback - allow chat with warning
      return {
        success: true,
        canChat: true,
        dailyChatsUsed: 1,
        dailyChatLimit: 5,
        message: 'Using local fallback - chat allowed'
      };
    }
  } catch (error) {
    console.error('Error incrementing chat count:', error);
    // Return error result
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
    
    // If user has unlimited chats (trial or subscribed), they can always chat
    if (subscription.userType === 'trial' || subscription.userType === 'subscribed') {
      return {
        canChat: true,
        message: 'Unlimited chats available'
      };
    }
    
    // For free users, check if they have remaining chats
    const remainingChats = getRemainingChats(subscription.dailyChatsUsed, subscription.dailyChatLimit);
    
    if (remainingChats > 0) {
      return {
        canChat: true,
        message: `${remainingChats} chats remaining today`
      };
    } else {
      return {
        canChat: false,
        message: 'Daily chat limit reached. Please upgrade to continue.'
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

    // Use proxy to avoid CORS issues
    try {
      const result = await callFirebaseFunction('incrementChatCount', {}, 'POST');
      return result as ChatCountResult;
    } catch (proxyError) {
      console.log('Proxy failed, using local fallback:', proxyError);
      
      // Local fallback - allow chat with warning
      return {
        success: true,
        canChat: true,
        dailyChatsUsed: 1,
        dailyChatLimit: 5,
        message: 'Using local fallback - chat allowed'
      };
    }
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
 * This would be replaced with actual Google Play Billing implementation
 */
export const initiateSubscription = async (plan: 'monthly' | 'yearly'): Promise<void> => {
  // This is a placeholder for Google Play Billing integration
  // In a real implementation, you would:
  // 1. Call Google Play Billing API
  // 2. Handle purchase flow
  // 3. Verify purchase with your backend
  // 4. Update user subscription status
  
  console.log(`Initiating ${plan} subscription...`);
  
  // For now, just show an alert
  alert(`Google Play Billing integration coming soon! This would initiate a ${plan} subscription.`);
  
  throw new Error('Google Play Billing not yet implemented');
};

/**
 * Mock function for restoring purchases
 */
export const restorePurchases = async (): Promise<void> => {
  // This is a placeholder for purchase restoration
  // In a real implementation, you would:
  // 1. Call Google Play Billing API to restore purchases
  // 2. Verify restored purchases with your backend
  // 3. Update user subscription status
  
  console.log('Restoring purchases...');
  
  // For now, just show an alert
  alert('Purchase restoration coming soon!');
  
  throw new Error('Purchase restoration not yet implemented');
}; 