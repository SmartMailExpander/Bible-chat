import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Initialize Google Play Developer API
const androidpublisher = google.androidpublisher('v3');

export async function POST(request: NextRequest) {
  try {
    const { purchaseToken, productId, packageName } = await request.json();

    if (!purchaseToken || !productId || !packageName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get Google Play credentials from environment variables
    const credentials = {
      client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PLAY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!credentials.client_email || !credentials.private_key) {
      console.error('Google Play credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create JWT auth client
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/androidpublisher']
    );

    // Verify the purchase
    const response = await androidpublisher.purchases.subscriptions.get({
      auth,
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });

    const subscription = response.data;

    // Check if subscription is valid
    if (subscription.paymentState === 1 && subscription.expiryTimeMillis) {
      const expiryTime = parseInt(subscription.expiryTimeMillis);
      const currentTime = Date.now();

      if (expiryTime > currentTime) {
        // Subscription is active
        return NextResponse.json({
          valid: true,
          subscription: {
            productId,
            purchaseToken,
            expiryTime,
            paymentState: subscription.paymentState,
            cancelReason: subscription.cancelReason,
            autoRenewing: subscription.autoRenewing,
          },
        });
      } else {
        // Subscription has expired
        return NextResponse.json({
          valid: false,
          error: 'Subscription expired',
          subscription: {
            productId,
            purchaseToken,
            expiryTime,
            paymentState: subscription.paymentState,
          },
        });
      }
    } else {
      // Subscription is not valid
      return NextResponse.json({
        valid: false,
        error: 'Invalid subscription',
        subscription: {
          productId,
          purchaseToken,
          paymentState: subscription.paymentState,
        },
      });
    }
  } catch (error) {
    console.error('Purchase verification error:', error);
    
    // For development/testing, return a mock successful verification
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Returning mock verification');
      return NextResponse.json({
        valid: true,
        subscription: {
          productId: 'premium_monthly',
          purchaseToken: 'mock_token',
          expiryTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          paymentState: 1,
          autoRenewing: true,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
} 