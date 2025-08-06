'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { 
  getCurrentUserSubscription, 
  startFreeTrial, 
  canUserChat,
  getUserTierDisplayName,
  getSubscriptionFeatures,
  resetUserData,
  resetChatCount,
  setUserAsPremium,
  setUserAsTrial,
  setUserAsFree
} from '../../services/localSubscriptionService';

export default function TestSubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadSubscription();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const subData = await getCurrentUserSubscription();
      setSubscription(subData);
      setMessage('Subscription loaded successfully');
    } catch (error) {
      console.error('Error loading subscription:', error);
      setMessage('Error loading subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      const result = await startFreeTrial();
      setSubscription(result);
      setMessage('Trial started successfully!');
    } catch (error: any) {
      console.error('Error starting trial:', error);
      setMessage(`Error starting trial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestChat = async () => {
    try {
      setLoading(true);
      const result = await canUserChat();
      setMessage(`Can chat: ${result.canChat}, Message: ${result.message || 'None'}`);
    } catch (error) {
      console.error('Error testing chat:', error);
      setMessage('Error testing chat');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChatCount = async () => {
    try {
      setLoading(true);
      await resetChatCount();
      setMessage('Chat count reset to 0 successfully');
      // Reload subscription data to see the change
      await loadSubscription();
    } catch (error) {
      console.error('Error resetting chat count:', error);
      setMessage('Error resetting chat count');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserData = async () => {
    try {
      setLoading(true);
      await resetUserData();
      setMessage('All user data reset successfully');
      // Reload subscription data to see the change
      await loadSubscription();
    } catch (error) {
      console.error('Error resetting user data:', error);
      setMessage('Error resetting user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsPremium = async () => {
    try {
      setLoading(true);
      await setUserAsPremium();
      setMessage('User set as premium successfully');
      // Reload subscription data to see the change
      await loadSubscription();
    } catch (error) {
      console.error('Error setting user as premium:', error);
      setMessage('Error setting user as premium');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsTrial = async () => {
    try {
      setLoading(true);
      await setUserAsTrial();
      setMessage('User set as trial successfully');
      // Reload subscription data to see the change
      await loadSubscription();
    } catch (error) {
      console.error('Error setting user as trial:', error);
      setMessage('Error setting user as trial');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsFree = async () => {
    try {
      setLoading(true);
      await setUserAsFree();
      setMessage('User set as free successfully');
      // Reload subscription data to see the change
      await loadSubscription();
    } catch (error) {
      console.error('Error setting user as free:', error);
      setMessage('Error setting user as free');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Test Subscription System</h1>
        <p>Please log in to test the subscription system.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Subscription System</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current User</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Subscription Status</h2>
        {loading ? (
          <p>Loading...</p>
        ) : subscription ? (
          <div>
            <p><strong>User Type:</strong> {getUserTierDisplayName(subscription.userType)}</p>
            <p><strong>Daily Chats Used:</strong> {subscription.dailyChatsUsed}</p>
            <p><strong>Daily Chat Limit:</strong> {subscription.dailyChatLimit === -1 ? 'Unlimited' : subscription.dailyChatLimit}</p>
            {subscription.trialEndDate && (
              <p><strong>Trial End Date:</strong> {new Date(subscription.trialEndDate).toLocaleDateString()}</p>
            )}
            <div>
              <strong>Features:</strong>
              <ul>
                {getSubscriptionFeatures(subscription.userType).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>No subscription data</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={loadSubscription}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#513c2c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Refresh Subscription
          </button>
          
          {subscription?.userType === 'free' && (
            <button 
              onClick={handleStartTrial}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Start Free Trial
            </button>
          )}
          
          <button 
            onClick={handleTestChat}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Test Chat Availability
          </button>
          
          <button 
            onClick={handleResetChatCount}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Reset Chat Count
          </button>
          
          <button 
            onClick={handleResetUserData}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Reset All User Data
          </button>

          <button 
            onClick={handleSetAsPremium}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#4CAF50', // A green color for premium
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Set as Premium
          </button>

          <button 
            onClick={handleSetAsTrial}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#007bff', // A blue color for trial
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Set as Trial
          </button>

          <button 
            onClick={handleSetAsFree}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#6c757d', // A gray color for free
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Set as Free
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: message.includes('Error') ? '#f8d7da' : '#d4edda',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '8px',
          color: message.includes('Error') ? '#721c24' : '#155724'
        }}>
          <strong>Message:</strong> {message}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h2>Test Links</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a 
            href="/pricing"
            style={{
              padding: '10px 20px',
              background: '#6f42c1',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            Go to Pricing Page
          </a>
          <a 
            href="/chat"
            style={{
              padding: '10px 20px',
              background: '#fd7e14',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            Go to Chat
          </a>
        </div>
      </div>
    </div>
  );
} 