import { NextResponse } from "next/server";
import { getAIResponse } from '../../../services/aiProviderService';
import { getCurrentUserSubscription } from '../../../services/localSubscriptionService';
import 'dotenv/config';

const MAX_MESSAGES = 20; // Increased to maintain better context for multi-turn conversations

export async function POST(request: Request) {
  const { history, userId, dailyChatsUsed = 0 } = await request.json();

  try {
    // Get current subscription status to return accurate chat data
    let currentSubscription;
    try {
      currentSubscription = await getCurrentUserSubscription();
    } catch (error) {
      console.error('Error getting subscription in API:', error);
      // Fallback to default values
      currentSubscription = {
        userType: 'free',
        dailyChatsUsed: 0,
        dailyChatLimit: 5,
        features: ['basic_chat', 'bible_reading']
      };
    }

    // Trim history to the last N messages to maintain context while preventing token overflow
    const trimmedHistory = (history || []).slice(-MAX_MESSAGES);

    // The system prompt is now handled in the AI provider service
    // Just pass the conversation history directly
    const messages = trimmedHistory;

    // Get AI response using multi-provider system
    const result = await getAIResponse(messages, userId, dailyChatsUsed);

    return NextResponse.json({ 
      reply: result.content,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      // Return current chat data for client-side sync
      dailyChatsUsed: currentSubscription.dailyChatsUsed,
      dailyChatLimit: currentSubscription.dailyChatLimit,
      userType: currentSubscription.userType
    });

  } catch (error: any) {
    console.error('AI Provider Error:', error);
    
    // Return appropriate error message
    const errorMessage = error.message || "Error contacting AI service.";
    return NextResponse.json({ 
      reply: errorMessage,
      error: true,
      provider: 'none'
    }, { status: 500 });
  }
} 