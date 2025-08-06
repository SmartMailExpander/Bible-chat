# 🔑 Environment Variables for Vercel Deployment

Copy these environment variables to your Vercel dashboard:

## Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBqURpQv0Ib42BEQ_Qvng1_FsrEzr-1OmA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=chat-app-db7ba.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chat-app-db7ba
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=chat-app-db7ba.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=861495273544
NEXT_PUBLIC_FIREBASE_APP_ID=1:861495273544:web:dca71ac6985f4a7286107d
```

## AI Provider Keys
```
GEMINI_API_KEY=AIzaSyBPGa10zEE-KOhRp9apth-RbhvUZmcVf3Y
CEREBRAS_API_KEY=csk-rekhvn44xxm9jwx84k9949xhmmxcx5kj9wyxrwxx82kvffmy
PERPLEXITY_API_KEY=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
CLOUDFLARE_API_TOKEN=TnMVgCvsXmloTAvxkfeeii_DX4ZJwlCjmLDgyh2Q
```

## Google Play Billing (Optional for Web)
```
GOOGLE_PLAY_CLIENT_EMAIL=your_service_account_email_here
GOOGLE_PLAY_PRIVATE_KEY=your_private_key_here
```

## How to Set Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" tab
4. Click on "Environment Variables"
5. Add each variable above with the values shown
6. Make sure to set them for "Production", "Preview", and "Development"

## Where to Get These Keys:

### Firebase:
✅ **Already configured** - Using existing Firebase project: `chat-app-db7ba`

### AI Providers:
✅ **Already configured** - All API keys are set up and working

### Google Play Billing:
1. Go to Google Play Console
2. Setup > API access
3. Create service account
4. Download JSON key file
5. Extract `client_email` and `private_key` from the JSON

## ⚠️ Security Note:
These API keys are already in your source code. For production, consider:
1. Rotating the API keys
2. Setting up proper environment variable management
3. Using Vercel's environment variable encryption 