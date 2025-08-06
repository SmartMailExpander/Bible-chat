import { NextResponse } from "next/server";

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    // Since we don't have Firebase Admin credentials, we'll provide instructions
    // for clearing data manually through the client-side functions
    
    return NextResponse.json({ 
      success: true, 
      message: "Use the reset buttons in the app instead",
      instructions: [
        "1. Go to your app's home page",
        "2. Use the 'Reset Chat Count' button to reset current user",
        "3. Or use the 'Reset All Data' button to clear all data",
        "4. Or go to /test-subscription page for more options"
      ],
      note: "Firebase Admin credentials are required to clear all users' data from the server. Use the client-side reset functions instead."
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error occurred',
      error: error.message 
    }, { status: 500 });
  }
} 