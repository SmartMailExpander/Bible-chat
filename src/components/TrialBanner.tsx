'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './TrialBanner.module.css';

interface TrialBannerProps {
  userType: 'free' | 'trial' | 'subscribed';
  dailyChatsUsed?: number;
  dailyChatLimit?: number;
  onUpgrade?: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({
  userType,
  dailyChatsUsed = 0,
  dailyChatLimit = 5,
  onUpgrade
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Debug logging
  console.log('🔍 TrialBanner props:', { userType, dailyChatsUsed, dailyChatLimit });

  // Don't show banner for subscribed users
  if (userType === 'subscribed') {
    return null;
  }

  // Don't show if dismissed
  if (!isVisible) {
    return null;
  }

  const chatsRemaining = dailyChatLimit - dailyChatsUsed;
  const isNearLimit = chatsRemaining <= 2;
  const isAtLimit = chatsRemaining <= 0;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className={`${styles.banner} ${isNearLimit ? styles.warning : ''} ${isAtLimit ? styles.limit : ''}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {isAtLimit ? '🚫' : isNearLimit ? '⚠️' : '✨'}
        </div>
        
        <div className={styles.text}>
          {userType === 'trial' ? (
            <>
              <h3 className={styles.title}>Free Trial Active</h3>
              <p className={styles.description}>
                {isAtLimit ? (
                  `You've used all ${dailyChatLimit} trial chats today. Upgrade for unlimited conversations!`
                ) : isNearLimit ? (
                  `${chatsRemaining} trial chat${chatsRemaining === 1 ? '' : 's'} remaining today. Upgrade for unlimited access!`
                ) : (
                  `${dailyChatsUsed} of ${dailyChatLimit} trial chats used today. Get unlimited conversations!`
                )}
              </p>
            </>
          ) : isAtLimit ? (
            <>
              <h3 className={styles.title}>Daily Limit Reached</h3>
              <p className={styles.description}>
                You've used all {dailyChatLimit} free chats today. Upgrade for unlimited conversations!
              </p>
            </>
          ) : isNearLimit ? (
            <>
              <h3 className={styles.title}>Almost at Limit</h3>
              <p className={styles.description}>
                {chatsRemaining} chat{chatsRemaining === 1 ? '' : 's'} remaining today. Upgrade for unlimited access!
              </p>
            </>
          ) : (
            <>
              <h3 className={styles.title}>Upgrade to Premium</h3>
              <p className={styles.description}>
                {dailyChatsUsed} of {dailyChatLimit} chats used today. Get unlimited conversations!
              </p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Link href="/pricing" className={styles.upgradeButton} onClick={handleUpgrade}>
            {userType === 'trial' ? 'Upgrade Now' : 'Get Premium'}
          </Link>
          
          <button className={styles.dismissButton} onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar for all users */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${Math.min((dailyChatsUsed / dailyChatLimit) * 100, 100)}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {dailyChatsUsed}/{dailyChatLimit} chats used
        </span>
      </div>
    </div>
  );
};

export default TrialBanner; 