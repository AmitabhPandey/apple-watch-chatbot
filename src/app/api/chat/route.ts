import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface Citation {
  title: string;
  url: string;
  description: string;
}

interface GeminiResponse {
  message: string;
  citations?: Citation[];
}

interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

interface SerperResponse {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  organic: SerperSearchResult[];
  credits: number;
}

// Function to search web using Serper API
async function searchWeb(query: string): Promise<SerperSearchResult[]> {
  try {
    if (!process.env.SERPER_API_KEY) {
      console.log("Serper API key not configured, skipping web search");
      return [];
    }

    console.log("Searching web for:", query);

    const response = await axios.post<SerperResponse>(
      "https://google.serper.dev/search",
      { q: query },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Found ${response.data.organic?.length || 0} search results`);
    return response.data.organic?.slice(0, 5) || [];
  } catch (error) {
    console.error("Error searching web:", error);
    return [];
  }
}

// Helper function to optimize user query for web search
async function optimizeSearchQuery(
  userQuery: string,
  apiKey: string
): Promise<string> {
  const optimizationPrompt = `You are a search query optimizer for Apple Watch related questions.

User question: "${userQuery}"

Generate an optimized search query that will find the most relevant, current information about Apple Watch.
Focus on extracting key terms, features, models, and technical details.
Make the query concise but comprehensive for web search.

Respond with only the optimized search query text, nothing else.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: optimizationPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 100 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const optimizedQuery = text.trim();
      console.log("Optimized search query:", optimizedQuery);
      return optimizedQuery;
    }
  } catch (error) {
    console.error("Error optimizing query:", error);
  }

  // Fallback to original query if optimization fails
  return userQuery;
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
- ALWAYS review the web search results provided in the context and include relevant citations in your response
- Cite sources liberally - whenever you provide information that came from the search results, include the citation
- Include citations for ANY factual information including: features, specifications, comparisons, troubleshooting, tips, updates, how-to guides, pricing, availability, technical details
- Select 2-4 of the most relevant sources from the search results that support your answer
- Include citations in this exact format using the title, URL, and snippet from search results:
  {
    "title": "Exact title from search result",
    "url": "Exact URL from search result",
    "description": "Relevant snippet from search result"
  }
- ONLY skip citations for: simple greetings (like "hi", "hello"), pure opinion questions, or when no search results are available
- When in doubt, include citations - it's better to cite sources than to omit them

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

    // Step 1: Optimize the query for web search
    console.log("Optimizing query for web search...");
    const optimizedQuery = await optimizeSearchQuery(
      message,
      process.env.GEMINI_API_KEY
    );

    // Step 2: Always perform web search with optimized query
    console.log("Performing web search with optimized query:", optimizedQuery);
    const webSearchResults = await searchWeb(optimizedQuery);

    // Add search results to context
    if (webSearchResults.length > 0) {
      conversationContext += "\n\n--- CURRENT WEB SEARCH RESULTS ---\n";
      conversationContext +=
        "Use these sources to provide accurate, up-to-date information. Include relevant sources in your citations array:\n\n";
      webSearchResults.forEach((result, index) => {
        conversationContext += `[${index + 1}] ${result.title}\n`;
        conversationContext += `URL: ${result.link}\n`;
        conversationContext += `Info: ${result.snippet}\n`;
        if (result.date) conversationContext += `Date: ${result.date}\n`;
        conversationContext += "\n";
      });
      conversationContext += "--- END OF SEARCH RESULTS ---\n\n";
    } else {
      console.log("No search results found");
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
    const parseGeminiResponse = (
      rawText: string
    ): { message: string; citations?: Citation[] } => {
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
            citations: Array.isArray(parsed.citations)
              ? parsed.citations
              : undefined,
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
