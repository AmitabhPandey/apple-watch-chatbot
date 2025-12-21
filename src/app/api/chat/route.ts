import { NextRequest, NextResponse } from "next/server";

interface Citation {
  title: string;
  url: string;
  description: string;
}

interface GeminiResponse {
  message: string;
  citations?: Citation[];
}

const SYSTEM_PROMPT = `You're a friendly Apple Watch expert who loves helping people get the most out of their watch! Think of yourself as that tech-savvy friend who's always excited to share Apple Watch tips and tricks.

Your conversation style:
- Keep responses concise and conversational (2-4 sentences for simple questions, more only when truly needed)
- Be warm, enthusiastic, and supportive
- Use casual language while staying knowledgeable
- Remember what we've talked about in our conversation
- Ask follow-up questions to keep the conversation flowing
- Share practical tips from real-world usage

When helping:
- Jump straight to the answer without unnecessary preamble
- Use everyday language instead of technical jargon
- Mention specific models (Series 10, Ultra 2, SE) naturally when relevant
- For troubleshooting, start with the simplest solution
- If something's not Apple Watch related, gently steer back with humor

IMPORTANT - Response Format:
You MUST respond with valid JSON in this exact format:
{
  "message": "your conversational response here",
  "citations": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "description": "Brief description"
    }
  ]
}

Citation Guidelines:
- ONLY include citations when providing factual information about: features, specifications, troubleshooting steps, technical details, updates/announcements
- DO NOT include citations for: greetings, casual conversation, follow-up questions, general chat
- Use these trusted sources when applicable:
  * Apple Support: support.apple.com/apple-watch
  * Apple Tech Specs: apple.com/apple-watch/specs
  * Apple Watch User Guide: support.apple.com/guide/watch
  * Apple Newsroom: apple.com/newsroom
  * MacRumors: macrumors.com
  * 9to5Mac: 9to5mac.com
- If no citations are needed, use empty array: "citations": []

Be yourself - helpful, friendly, and genuinely excited about Apple Watch! 🍎⌚`;

export async function POST(request: NextRequest) {
  console.log("POST /api/chat - Request received");

  // Disable SSL certificate verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    console.log("Parsing request body...");
    const { message, conversationHistory } = await request.json();
    console.log("Received message:", message);
    console.log(
      "Conversation history length:",
      conversationHistory?.length || 0
    );

    if (!message || typeof message !== "string") {
      console.log("Invalid message format");
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Checking API key...");
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log(
      "GEMINI_API_KEY length:",
      process.env.GEMINI_API_KEY?.length || 0
    );

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Build conversation context with history
    let conversationContext = SYSTEM_PROMPT + "\n\n";

    // Add recent conversation history (last 10 messages to manage token limits)
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      const recentHistory = conversationHistory.slice(-10);
      conversationContext += "Recent conversation:\n";
      recentHistory.forEach((msg: { isUser: boolean; content: string }) => {
        const speaker = msg.isUser ? "User" : "You";
        conversationContext += `${speaker}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    conversationContext += `User: ${message}\n\nYou:`;

    console.log("Making direct REST API request to Gemini...");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: conversationContext,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Response received from Gemini API");

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No text in response:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "No response text received from Gemini API" },
        { status: 500 }
      );
    }

    console.log("Response text length:", text.length);

    // Parse JSON response with fallback to plain text
    const parseGeminiResponse = (rawText: string): { message: string; citations?: Citation[] } => {
      try {
        // Clean markdown code blocks
        const cleanText = rawText
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();

        const parsed = JSON.parse(cleanText) as GeminiResponse;

        // Validate structure
        if (typeof parsed.message === "string") {
          return {
            message: parsed.message,
            citations: Array.isArray(parsed.citations) ? parsed.citations : undefined,
          };
        }
      } catch (error) {
        console.log("JSON parse failed, using plain text response");
      }

      // Fallback: return as plain text
      return { message: rawText };
    };

    const { message: responseMessage, citations } = parseGeminiResponse(text);

    return NextResponse.json({
      response: responseMessage,
      citations: citations && citations.length > 0 ? citations : undefined,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if (
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("invalid API key")
      ) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
      if (
        error.message.includes("QUOTA_EXCEEDED") ||
        error.message.includes("quota")
      ) {
        return NextResponse.json(
          { error: "API quota exceeded" },
          { status: 429 }
        );
      }
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          { error: "Content filtered for safety reasons" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
