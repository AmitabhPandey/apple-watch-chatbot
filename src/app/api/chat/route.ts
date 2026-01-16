import { NextRequest, NextResponse } from "next/server";
import { config, validateConfig } from "@/lib/config";
import { searchWeb } from "@/lib/services/search";
import { generateGeminiResponse, optimizeSearchQuery } from "@/lib/services/ai";
import { getOgImage } from "@/lib/services/firecrawl";
import { SYSTEM_PROMPT } from "@/prompts/chatPrompt";

export async function POST(request: NextRequest) {
  console.log("POST /api/chat - Request received");

  // Only disable SSL verification in development if absolutely necessary
  if (config.isDev) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  try {
    validateConfig();

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Build conversation context
    let conversationContext = SYSTEM_PROMPT + "\n\n";

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      conversationContext += "Recent conversation:\n";
      recentHistory.forEach((msg: { isUser: boolean; content: string }) => {
        const speaker = msg.isUser ? "User" : "You";
        conversationContext += `${speaker}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    // Step 1: Optimize and Search
    const optimizedQuery = await optimizeSearchQuery(message, config.geminiApiKey);
    const webSearchResults = await searchWeb(optimizedQuery);

    // Step 2: Add results to context
    if (webSearchResults.length > 0) {
      conversationContext += "\n\n--- CURRENT WEB SEARCH RESULTS ---\n";
      webSearchResults.forEach((result, index) => {
        conversationContext += `[${index + 1}] ${result.title}\nURL: ${result.link}\nInfo: ${result.snippet}\n\n`;
      });
      conversationContext += "--- END OF SEARCH RESULTS ---\n\n";
    }

    conversationContext += `User: ${message}\n\nYou:`;

    // Step 3: Generate Response
    const { message: responseMessage, citations } = await generateGeminiResponse(
      conversationContext,
      config.geminiApiKey
    );

    // Step 4: Fetch images for all citations if available
    if (citations && citations.length > 0) {
      await Promise.all(
        citations.map(async (citation) => {
          try {
            const imageUrl = await getOgImage(citation.url);
            if (imageUrl) {
              citation.imageUrl = imageUrl;
            }
          } catch (error) {
            console.error(`Failed to fetch image for citation ${citation.url}:`, error);
          }
        })
      );
    }

    return NextResponse.json({
      response: responseMessage,
      citations: citations && citations.length > 0 ? citations : undefined,
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    let status = 500;

    if (errorMessage.includes("API_KEY_INVALID")) status = 401;
    if (errorMessage.includes("QUOTA_EXCEEDED")) status = 429;
    if (errorMessage.includes("SAFETY")) status = 400;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
