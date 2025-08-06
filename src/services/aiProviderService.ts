// AI Provider Service - Multi-Provider Fallback System
import { RateLimitTracker } from './rateTracker';

// Bible-focused system prompt for all providers
const BIBLE_SYSTEM_PROMPT = `You are Haven, a Bible-focused AI assistant. You are ONLY allowed to answer questions related to:

• Bible verses, passages, and stories
• Christian theology, doctrine, and beliefs
• Biblical interpretation and study
• Prayer and spiritual guidance
• Christian values and morality
• Church history and biblical figures
• Faith-based life advice

If a user asks about anything else (politics, science, entertainment, etc.), politely say: "I'm here to help with Bible and faith-related questions only. Please ask something about scripture or spiritual guidance."

Keep responses concise (200-300 words maximum) and maintain conversation context. Always assume follow-up questions refer to the most recently mentioned verse unless specified otherwise.`;

// Provider configurations
const PROVIDERS = {
  gemini: {
    name: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBPGa10zEE-KOhRp9apth-RbhvUZmcVf3Y',
    model: 'gemini-2.5-flash-lite',
    limits: { rpm: 15, rpd: 1000, tpm: 250000 }
  },
  cerebras: {
    name: 'cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    apiKey: process.env.CEREBRAS_API_KEY || 'csk-rekhvn44xxm9jwx84k9949xhmmxcx5kj9wyxrwxx82kvffmy',
    model: 'qwen-3-235b-a22b-instruct-2507',
    limits: { rpm: 30, rpd: 14400, tpm: 60000 }
  },
  perplexity: {
    name: 'perplexity',
    url: 'https://api.perplexity.ai/chat/completions',
    apiKey: process.env.PERPLEXITY_API_KEY || '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',
    model: 'sonar',
    limits: { rpm: 100, rpd: 10000, tpm: 1000000 }
  },
  cloudflare: {
    name: 'cloudflare',
    url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID || '720446e72f10ef2e583058f51cce6dc9'}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    apiKey: process.env.CLOUDFLARE_API_TOKEN || 'TnMVgCvsXmloTAvxkfeeii_DX4ZJwlCjmLDgyh2Q',
    model: '@cf/meta/llama-3.1-8b-instruct',
    limits: { rpm: 1000, rpd: 100000, tpm: 1000000 },
    approach: 'direct'
  }
};

// Fallback chains per user type
const FALLBACK_CHAINS = {
  free: ['cerebras', 'cloudflare'],
  trial: ['gemini', 'perplexity', 'cerebras'],
  subscribed: ['gemini', 'cerebras', 'perplexity']
};

// User types (you can extend this based on your auth system)
export type UserType = 'free' | 'trial' | 'subscribed';

// Rate tracker instance
let rateTracker: RateLimitTracker | null = null;

function getRateTracker() {
  if (!rateTracker) {
    rateTracker = new RateLimitTracker();
  }
  return rateTracker;
}

// Get user type (you can integrate this with your auth system)
function getUserType(userId?: string): UserType {
  // For now, default to 'trial' - you can implement your own logic
  // based on user subscription status, trial period, etc.
  return 'trial';
}

// Check if user can make requests
function canUserMakeRequest(userType: UserType, dailyChatsUsed: number = 0): boolean {
  if (userType === 'subscribed') return true;
  const dailyLimit = userType === 'trial' ? 5 : 5; // Both free and trial have 5 chats/day
  return dailyChatsUsed < dailyLimit;
}

// Get available provider based on user type and rate limits
async function getAvailableProvider(userType: UserType): Promise<string> {
  const tracker = getRateTracker();
  const fallbackChain = FALLBACK_CHAINS[userType];
  
  for (const providerName of fallbackChain) {
    if (tracker.isProviderAvailable(providerName)) {
      return providerName;
    }
  }
  
  throw new Error(`All available providers are rate limited for ${userType} user. Please try again later.`);
}

// Make API call to specific provider
async function makeProviderCall(providerName: string, messages: any[]): Promise<string> {
  const provider = PROVIDERS[providerName];
  const tracker = getRateTracker();
  
  try {
    let requestBody: any;
    let headers: any;
    
    // Prepare messages with Bible-focused system prompt
    const systemMessage = { role: 'system', content: BIBLE_SYSTEM_PROMPT };
    const conversationMessages = [systemMessage, ...messages];
    
    switch (providerName) {
      case 'gemini':
        headers = {
          'Content-Type': 'application/json',
          'X-goog-api-key': provider.apiKey
        };
        // For Gemini, we need to format the conversation properly
        const geminiContent = conversationMessages.map(msg => {
          if (msg.role === 'system') {
            return `System: ${msg.content}`;
          } else if (msg.role === 'user') {
            return `User: ${msg.content}`;
          } else if (msg.role === 'assistant') {
            return `Assistant: ${msg.content}`;
          }
          return msg.content;
        }).join('\n\n');
        
        requestBody = {
          contents: [{
            parts: [{ text: geminiContent }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        };
        break;
        
      case 'cerebras':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        };
        requestBody = {
          model: provider.model,
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 300
        };
        break;
        
      case 'perplexity':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        };
        requestBody = {
          model: provider.model,
          messages: conversationMessages,
          temperature: 0.2,
          max_tokens: 300,
          search_mode: 'web'
        };
        break;
        
      case 'cloudflare':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        };
        // For Cloudflare, we need to format the conversation
        const cloudflarePrompt = conversationMessages.map(msg => {
          if (msg.role === 'system') {
            return `System: ${msg.content}`;
          } else if (msg.role === 'user') {
            return `User: ${msg.content}`;
          } else if (msg.role === 'assistant') {
            return `Assistant: ${msg.content}`;
          }
          return msg.content;
        }).join('\n\n');
        
        requestBody = {
          prompt: cloudflarePrompt,
          max_tokens: 300
        };
        break;
        
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
    
    const response = await fetch(provider.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Parse response based on provider
    let content: string;
    switch (providerName) {
      case 'gemini':
        content = result.candidates[0].content.parts[0].text;
        break;
      case 'cerebras':
      case 'perplexity':
        content = result.choices[0].message.content;
        break;
      case 'cloudflare':
        content = result.result.response;
        break;
      default:
        content = JSON.stringify(result);
    }
    
    // Truncate response to 300 words if it's too long
    const words = content.split(' ');
    if (words.length > 300) {
      content = words.slice(0, 300).join(' ') + '...';
    }
    
    // Record successful request
    tracker.recordRequest(providerName, content.length);
    
    return content;
    
  } catch (error) {
    console.error(`Error calling ${providerName}:`, error);
    throw error;
  }
}

// Main function to get AI response with fallback logic
export async function getAIResponse(
  messages: any[], 
  userId?: string,
  dailyChatsUsed: number = 0
): Promise<{ content: string; provider: string; fallbackUsed: boolean }> {
  
  const userType = getUserType(userId);
  
  // Check if user can make requests
  if (!canUserMakeRequest(userType, dailyChatsUsed)) {
    throw new Error(`Daily limit reached for ${userType} user. Upgrade for unlimited access.`);
  }
  
  // Get available provider
  const providerName = await getAvailableProvider(userType);
  const fallbackChain = FALLBACK_CHAINS[userType];
  const fallbackUsed = fallbackChain.indexOf(providerName) > 0;
  
  try {
    const content = await makeProviderCall(providerName, messages);
    
    return {
      content,
      provider: providerName,
      fallbackUsed
    };
    
  } catch (error) {
    console.error(`Provider ${providerName} failed:`, error);
    
    // Try next provider in chain
    const currentIndex = fallbackChain.indexOf(providerName);
    const nextProvider = fallbackChain[currentIndex + 1];
    
    if (nextProvider) {
      console.log(`Falling back to ${nextProvider}`);
      const content = await makeProviderCall(nextProvider, messages);
      
      return {
        content,
        provider: nextProvider,
        fallbackUsed: true
      };
    }
    
    // All providers failed
    throw new Error('All AI providers are currently unavailable. Please try again later.');
  }
}

// Get usage statistics
export function getUsageStats() {
  const tracker = getRateTracker();
  return tracker.getUsageSummary();
}

// Reset usage statistics (for testing or daily resets)
export function resetUsageStats() {
  const tracker = getRateTracker();
  tracker.resetDailyCounters();
}

// Get available providers for current user
export function getAvailableProviders(userType: UserType): string[] {
  const tracker = getRateTracker();
  return tracker.getAvailableProviders().filter(provider => 
    FALLBACK_CHAINS[userType].includes(provider)
  );
} 