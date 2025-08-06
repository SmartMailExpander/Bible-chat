# ⚡ Quick Deploy - Haven Bible App

## 🎯 Copy & Paste Environment Variables

Add these to your Vercel dashboard:

### Firebase (Required):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBqURpQv0Ib42BEQ_Qvng1_FsrEzr-1OmA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=chat-app-db7ba.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chat-app-db7ba
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=chat-app-db7ba.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=861495273544
NEXT_PUBLIC_FIREBASE_APP_ID=1:861495273544:web:dca71ac6985f4a7286107d
```

### AI Providers (Required):
```
GEMINI_API_KEY=AIzaSyBPGa10zEE-KOhRp9apth-RbhvUZmcVf3Y
CEREBRAS_API_KEY=csk-rekhvn44xxm9jwx84k9949xhmmxcx5kj9wyxrwxx82kvffmy
PERPLEXITY_API_KEY=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
CLOUDFLARE_API_TOKEN=TnMVgCvsXmloTAvxkfeeii_DX4ZJwlCjmLDgyh2Q
```

### Google Play (Optional):
```
GOOGLE_PLAY_CLIENT_EMAIL=your_service_account_email
GOOGLE_PLAY_PRIVATE_KEY=your_private_key
```

## 🚀 Deploy Steps:

1. **Upload to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Create new project
   - Upload this `vercel-deployment` folder

2. **Set Environment Variables:**
   - Copy all variables above to Vercel dashboard
   - Set for Production, Preview, and Development

3. **Deploy!**
   - Vercel will auto-detect Next.js
   - Build and deploy automatically

## 📱 Result:
Your app will be live at: `https://your-app-name.vercel.app`

Users can install it on their phones as a PWA! 📱✨ 