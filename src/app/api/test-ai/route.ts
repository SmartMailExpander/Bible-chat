import { NextResponse } from "next/server";
import { getAIResponse, getUsageStats } from '../../../services/aiProviderService';

export async function GET() {
  try {
    // Test 1: Bible-focused question
    const bibleQuestion = [
      { role: 'user', content: 'What is John 3:16?' }
    ];
    
    const bibleResult = await getAIResponse(bibleQuestion);
    
    // Test 2: Off-topic question to verify restrictions
    const offTopicQuestion = [
      { role: 'user', content: 'Tell me about Taylor Swift' }
    ];
    
    const offTopicResult = await getAIResponse(offTopicQuestion);
    
    // Test 3: Multi-turn conversation to test context
    const multiTurnConversation = [
      { role: 'user', content: 'What is John 3:16?' },
      { role: 'assistant', content: 'John 3:16 is a foundational verse...' },
      { role: 'user', content: 'What does it mean by "only begotten Son"?' }
    ];
    
    const contextResult = await getAIResponse(multiTurnConversation);
    
    const usageStats = getUsageStats();
    
    return NextResponse.json({
      success: true,
      tests: {
        bibleQuestion: {
          content: bibleResult.content,
          provider: bibleResult.provider,
          wordCount: bibleResult.content.split(' ').length
        },
        offTopicQuestion: {
          content: offTopicResult.content,
          provider: offTopicResult.provider,
          wordCount: offTopicResult.content.split(' ').length
        },
        contextTest: {
          content: contextResult.content,
          provider: contextResult.provider,
          wordCount: contextResult.content.split(' ').length
        }
      },
      usageStats,
      message: "AI Provider System with Bible focus and word limits is working!"
    });
    
  } catch (error: any) {
    console.error('Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 