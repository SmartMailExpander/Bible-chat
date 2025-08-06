import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../firebaseConfig';

const FIREBASE_FUNCTIONS_BASE = 'https://us-central1-chat-app-db7ba.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const { functionName, data } = await request.json();
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }
    
    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Determine the endpoint based on function name
    let endpoint = '';
    switch (functionName) {
      case 'getUserSubscription':
        endpoint = '/getUserSubscriptionHttp';
        break;
      case 'startTrial':
        endpoint = '/startTrialHttp';
        break;
      case 'incrementChatCount':
        endpoint = '/incrementChatCountHttp';
        break;
      default:
        return NextResponse.json({ error: 'Unknown function' }, { status: 400 });
    }

    // Make the request to Firebase function
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase function error:', response.status, errorText);
      return NextResponse.json(
        { error: `Firebase function failed: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const functionName = searchParams.get('function');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }
    
    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Determine the endpoint based on function name
    let endpoint = '';
    switch (functionName) {
      case 'getUserSubscription':
        endpoint = '/getUserSubscriptionHttp';
        break;
      default:
        return NextResponse.json({ error: 'Unknown function' }, { status: 400 });
    }

    // Make the request to Firebase function
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase function error:', response.status, errorText);
      return NextResponse.json(
        { error: `Firebase function failed: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 