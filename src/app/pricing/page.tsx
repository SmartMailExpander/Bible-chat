'use client';

import { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { googlePlayBilling, SubscriptionPlan, BillingResult } from '../../services/googlePlayBilling';
import { setUserAsPremium } from '../../services/localSubscriptionService';
import styles from './PricingPage.module.css';

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    loadSubscriptionPlans();

    return () => unsubscribe();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      setLoading(true);
      
      // Check if billing is available
      const isAvailable = await googlePlayBilling.isBillingAvailable();
      setBillingAvailable(isAvailable);
      
      // Get subscription plans
      const subscriptionPlans = await googlePlayBilling.getSubscriptionPlans();
      setPlans(subscriptionPlans);
      
      console.log('📋 Loaded subscription plans:', subscriptionPlans);
    } catch (error) {
      console.error('❌ Failed to load subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!user) {
      alert('Please sign in to purchase a subscription');
      return;
    }

    try {
      setPurchasing(planId);
      console.log(`🛒 Starting purchase for plan: ${planId}`);

      const result: BillingResult = await googlePlayBilling.purchaseSubscription(planId);

      if (result.success && result.purchase) {
        console.log('✅ Purchase successful:', result.purchase);
        
        // Verify the purchase
        const isVerified = await googlePlayBilling.verifyPurchase(result.purchase.purchaseToken);
        
        if (isVerified) {
          // Acknowledge the purchase
          await googlePlayBilling.acknowledgePurchase(result.purchase.purchaseToken);
          
          // Update user subscription status locally
          await setUserAsPremium();
          
          alert('🎉 Subscription activated successfully! You now have unlimited access to all features.');
          
          // Redirect to home page
          window.location.href = '/';
        } else {
          alert('❌ Purchase verification failed. Please contact support.');
        }
      } else {
        console.error('❌ Purchase failed:', result.error);
        alert(`Purchase failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      alert('An error occurred during purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      console.log('🔄 Restoring purchases...');

      const result = await googlePlayBilling.restorePurchases();

      if (result.success && result.purchase) {
        console.log('✅ Purchase restored:', result.purchase);
        
        // Update user subscription status locally
        await setUserAsPremium();
        
        alert('✅ Your subscription has been restored!');
        window.location.href = '/';
      } else {
        console.log('ℹ️ No active subscriptions found');
        alert('No active subscriptions found. If you believe this is an error, please contact support.');
      }
    } catch (error) {
      console.error('❌ Restore error:', error);
      alert('Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Choose Your Plan</h1>
        <p>Unlock unlimited AI conversations and advanced Bible study features</p>
      </div>

      <div className={styles.plansContainer}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`${styles.planCard} ${selectedPlan === plan.id ? styles.selected : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className={styles.planHeader}>
              <h3>{plan.name}</h3>
              <div className={styles.price}>{plan.price}</div>
              {plan.trialDays && (
                <div className={styles.trialBadge}>
                  {plan.trialDays}-day free trial
                </div>
              )}
            </div>

            <div className={styles.planDescription}>
              {plan.description}
            </div>

            <div className={styles.features}>
              {plan.features.map((feature, index) => (
                <div key={index} className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <button
              className={`${styles.purchaseButton} ${purchasing === plan.id ? styles.loading : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(plan.id);
              }}
              disabled={purchasing === plan.id || !billingAvailable}
            >
              {purchasing === plan.id ? (
                <>
                  <div className={styles.spinner}></div>
                  Processing...
                </>
              ) : (
                plan.trialDays ? `Start ${plan.trialDays}-Day Trial` : 'Subscribe Now'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.restoreSection}>
          <h4>Already have a subscription?</h4>
          <button 
            className={styles.restoreButton}
            onClick={handleRestorePurchases}
            disabled={loading}
          >
            Restore Purchases
          </button>
        </div>

        <div className={styles.info}>
          <p>
            <strong>Free Trial:</strong> Start with a 7-day free trial. Cancel anytime during the trial period.
          </p>
          <p>
            <strong>Billing:</strong> Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
          </p>
          <p>
            <strong>Privacy:</strong> Your payment information is securely processed by Google Play. We never store your payment details.
          </p>
        </div>
      </div>

      {!billingAvailable && (
        <div className={styles.billingWarning}>
          <p>⚠️ Google Play Billing is not available on this device. Please use an Android device to purchase subscriptions.</p>
        </div>
      )}
    </div>
  );
} 