const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Subscription SKUs
const SUBSCRIPTION_SKUS = {
  monthly: 'haven_bible_monthly',
  yearly: 'haven_bible_yearly'
};

// User tier limits
const USER_LIMITS = {
  free: { dailyChats: 5, features: ['basic_chat', 'bible_reading'] },
  trial: { dailyChats: -1, features: ['unlimited_chat', 'advanced_features'], trialDays: 7 },
  subscribed: { dailyChats: -1, features: ['unlimited_chat', 'advanced_features', 'premium_support'] }
};

/**
 * Get user subscription status (Callable Function)
 */
exports.getUserSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // Create new user with free tier
      await db.collection('users').doc(userId).set({
        userType: 'free',
        dailyChatsUsed: 0,
        lastChatReset: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        subscriptionStatus: 'none'
      });

      return {
        userType: 'free',
        dailyChatsUsed: 0,
        dailyChatLimit: USER_LIMITS.free.dailyChats,
        features: USER_LIMITS.free.features
      };
    }

    const userData = userDoc.data();
    const userType = userData.userType || 'free';
    const dailyChatsUsed = userData.dailyChatsUsed || 0;
    const lastChatReset = userData.lastChatReset ? new Date(userData.lastChatReset) : new Date();
    const now = new Date();

    // Reset daily chat count if it's a new day
    if (lastChatReset.getDate() !== now.getDate() || 
        lastChatReset.getMonth() !== now.getMonth() || 
        lastChatReset.getFullYear() !== now.getFullYear()) {
      
      await db.collection('users').doc(userId).update({
        dailyChatsUsed: 0,
        lastChatReset: now.toISOString()
      });
      
      return {
        userType,
        dailyChatsUsed: 0,
        dailyChatLimit: USER_LIMITS[userType].dailyChats,
        features: USER_LIMITS[userType].features,
        trialEndDate: userData.trialEndDate
      };
    }

    return {
      userType,
      dailyChatsUsed,
      dailyChatLimit: USER_LIMITS[userType].dailyChats,
      features: USER_LIMITS[userType].features,
      trialEndDate: userData.trialEndDate
    };

  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get subscription status');
  }
});

/**
 * Get user subscription status (HTTP Function with CORS)
 */
exports.getUserSubscriptionHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        // Create new user with free tier
        await db.collection('users').doc(userId).set({
          userType: 'free',
          dailyChatsUsed: 0,
          lastChatReset: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'none'
        });

        return res.json({
          userType: 'free',
          dailyChatsUsed: 0,
          dailyChatLimit: USER_LIMITS.free.dailyChats,
          features: USER_LIMITS.free.features
        });
      }

      const userData = userDoc.data();
      const userType = userData.userType || 'free';
      const dailyChatsUsed = userData.dailyChatsUsed || 0;
      const lastChatReset = userData.lastChatReset ? new Date(userData.lastChatReset) : new Date();
      const now = new Date();

      // Reset daily chat count if it's a new day
      if (lastChatReset.getDate() !== now.getDate() || 
          lastChatReset.getMonth() !== now.getMonth() || 
          lastChatReset.getFullYear() !== now.getFullYear()) {
        
        await db.collection('users').doc(userId).update({
          dailyChatsUsed: 0,
          lastChatReset: now.toISOString()
        });
        
        return res.json({
          userType,
          dailyChatsUsed: 0,
          dailyChatLimit: USER_LIMITS[userType].dailyChats,
          features: USER_LIMITS[userType].features,
          trialEndDate: userData.trialEndDate
        });
      }

      return res.json({
        userType,
        dailyChatsUsed,
        dailyChatLimit: USER_LIMITS[userType].dailyChats,
        features: USER_LIMITS[userType].features,
        trialEndDate: userData.trialEndDate
      });

    } catch (error) {
      console.error('Error getting user subscription:', error);
      return res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });
});

/**
 * Start free trial (Callable Function)
 */
exports.startTrial = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    
    // Check if user already had a trial
    if (userData.trialUsed) {
      throw new functions.https.HttpsError('permission-denied', 'Trial already used');
    }

    // Check if user is already subscribed
    if (userData.userType === 'subscribed') {
      throw new functions.https.HttpsError('permission-denied', 'User is already subscribed');
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + USER_LIMITS.trial.trialDays);

    await db.collection('users').doc(userId).update({
      userType: 'trial',
      trialUsed: true,
      trialStartDate: new Date().toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      dailyChatsUsed: 0,
      lastChatReset: new Date().toISOString()
    });

    return {
      success: true,
      userType: 'trial',
      trialEndDate: trialEndDate.toISOString(),
      features: USER_LIMITS.trial.features
    };

  } catch (error) {
    console.error('Error starting trial:', error);
    throw new functions.https.HttpsError('internal', 'Failed to start trial');
  }
});

/**
 * Start free trial (HTTP Function with CORS)
 */
exports.startTrialHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      
      // Check if user already had a trial
      if (userData.trialUsed) {
        return res.status(403).json({ error: 'Trial already used' });
      }

      // Check if user is already subscribed
      if (userData.userType === 'subscribed') {
        return res.status(403).json({ error: 'User is already subscribed' });
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + USER_LIMITS.trial.trialDays);

      await db.collection('users').doc(userId).update({
        userType: 'trial',
        trialUsed: true,
        trialStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        dailyChatsUsed: 0,
        lastChatReset: new Date().toISOString()
      });

      return res.json({
        success: true,
        userType: 'trial',
        trialEndDate: trialEndDate.toISOString(),
        features: USER_LIMITS.trial.features
      });

    } catch (error) {
      console.error('Error starting trial:', error);
      return res.status(500).json({ error: 'Failed to start trial' });
    }
  });
});

/**
 * Increment daily chat count (Callable Function)
 */
exports.incrementChatCount = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const userType = userData.userType || 'free';
    const dailyChatLimit = USER_LIMITS[userType].dailyChats;

    // Unlimited chats for trial and subscribed users
    if (dailyChatLimit === -1) {
      return { success: true, canChat: true, dailyChatsUsed: userData.dailyChatsUsed || 0 };
    }

    const dailyChatsUsed = userData.dailyChatsUsed || 0;
    const lastChatReset = userData.lastChatReset ? new Date(userData.lastChatReset) : new Date();
    const now = new Date();

    // Reset daily chat count if it's a new day
    if (lastChatReset.getDate() !== now.getDate() || 
        lastChatReset.getMonth() !== now.getMonth() || 
        lastChatReset.getFullYear() !== now.getFullYear()) {
      
      await db.collection('users').doc(userId).update({
        dailyChatsUsed: 1,
        lastChatReset: now.toISOString()
      });
      
      return { success: true, canChat: true, dailyChatsUsed: 1, dailyChatLimit };
    }

    // Check if user has reached daily limit BEFORE incrementing
    if (dailyChatsUsed >= dailyChatLimit) {
      return { 
        success: false, 
        canChat: false, 
        dailyChatsUsed, 
        dailyChatLimit,
        message: 'Daily chat limit reached. Please upgrade to continue.'
      };
    }

    // Increment chat count
    const newChatCount = dailyChatsUsed + 1;
    await db.collection('users').doc(userId).update({
      dailyChatsUsed: newChatCount
    });

    return { 
      success: true, 
      canChat: true, 
      dailyChatsUsed: newChatCount,
      dailyChatLimit
    };

  } catch (error) {
    console.error('Error incrementing chat count:', error);
    throw new functions.https.HttpsError('internal', 'Failed to increment chat count');
  }
});

/**
 * Increment daily chat count (HTTP Function with CORS)
 */
exports.incrementChatCountHttp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const userType = userData.userType || 'free';
      const dailyChatLimit = USER_LIMITS[userType].dailyChats;

      // Unlimited chats for trial and subscribed users
      if (dailyChatLimit === -1) {
        return res.json({ 
          success: true, 
          canChat: true, 
          dailyChatsUsed: userData.dailyChatsUsed || 0 
        });
      }

      const dailyChatsUsed = userData.dailyChatsUsed || 0;
      const lastChatReset = userData.lastChatReset ? new Date(userData.lastChatReset) : new Date();
      const now = new Date();

      // Reset daily chat count if it's a new day
      if (lastChatReset.getDate() !== now.getDate() || 
          lastChatReset.getMonth() !== now.getMonth() || 
          lastChatReset.getFullYear() !== now.getFullYear()) {
        
        await db.collection('users').doc(userId).update({
          dailyChatsUsed: 1,
          lastChatReset: now.toISOString()
        });
        
        return res.json({ 
          success: true, 
          canChat: true, 
          dailyChatsUsed: 1, 
          dailyChatLimit 
        });
      }

      // Check if user has reached daily limit BEFORE incrementing
      if (dailyChatsUsed >= dailyChatLimit) {
        return res.json({ 
          success: false, 
          canChat: false, 
          dailyChatsUsed, 
          dailyChatLimit,
          message: 'Daily chat limit reached. Please upgrade to continue.'
        });
      }

      // Increment chat count
      const newChatCount = dailyChatsUsed + 1;
      await db.collection('users').doc(userId).update({
        dailyChatsUsed: newChatCount
      });

      return res.json({ 
        success: true, 
        canChat: true, 
        dailyChatsUsed: newChatCount,
        dailyChatLimit
      });

    } catch (error) {
      console.error('Error incrementing chat count:', error);
      return res.status(500).json({ error: 'Failed to increment chat count' });
    }
  });
});

/**
 * Handle Google Play subscription webhook
 */
exports.handleGooglePlayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { notificationType, purchaseToken, subscriptionId } = req.body;

    // Verify the webhook (in production, you should verify the signature)
    // For now, we'll trust the webhook data

    switch (notificationType) {
      case 'SUBSCRIPTION_PURCHASED':
      case 'SUBSCRIPTION_RESTORED':
        await activateSubscription(purchaseToken, subscriptionId);
        break;
      
      case 'SUBSCRIPTION_CANCELED':
      case 'SUBSCRIPTION_EXPIRED':
        await deactivateSubscription(purchaseToken);
        break;
      
      case 'SUBSCRIPTION_RENEWED':
        await renewSubscription(purchaseToken, subscriptionId);
        break;
      
      default:
        console.log('Unknown notification type:', notificationType);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling Google Play webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * Activate subscription
 */
async function activateSubscription(purchaseToken, subscriptionId) {
  try {
    // In a real implementation, you would:
    // 1. Verify the purchase with Google Play API
    // 2. Get user ID from the purchase token
    // 3. Update user subscription status

    // For now, we'll use a mock implementation
    const userId = await getUserIdFromPurchaseToken(purchaseToken);
    
    if (userId) {
      await db.collection('users').doc(userId).update({
        userType: 'subscribed',
        subscriptionId,
        purchaseToken,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionStatus: 'active'
      });
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
  }
}

/**
 * Deactivate subscription
 */
async function deactivateSubscription(purchaseToken) {
  try {
    const userId = await getUserIdFromPurchaseToken(purchaseToken);
    
    if (userId) {
      await db.collection('users').doc(userId).update({
        userType: 'free',
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error deactivating subscription:', error);
  }
}

/**
 * Renew subscription
 */
async function renewSubscription(purchaseToken, subscriptionId) {
  try {
    const userId = await getUserIdFromPurchaseToken(purchaseToken);
    
    if (userId) {
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'active',
        lastRenewalDate: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error renewing subscription:', error);
  }
}

/**
 * Mock function to get user ID from purchase token
 * In production, you would store this mapping in your database
 */
async function getUserIdFromPurchaseToken(purchaseToken) {
  // This is a mock implementation
  // In production, you would query your database to find the user
  // associated with this purchase token
  return null;
}

/**
 * Check trial expiration (run daily)
 */
exports.checkTrialExpiration = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const trialUsers = await db.collection('users')
      .where('userType', '==', 'trial')
      .where('trialEndDate', '<=', now.toISOString())
      .get();

    const batch = db.batch();
    
    trialUsers.forEach(doc => {
      batch.update(doc.ref, {
        userType: 'free',
        trialExpired: true,
        trialExpiredDate: now.toISOString()
      });
    });

    await batch.commit();
    
    console.log(`Expired ${trialUsers.size} trials`);
    return null;
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return null;
  }
}); 