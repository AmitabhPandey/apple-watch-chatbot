import { Citation, GeminiResponse } from "@/types/chat";
import { OPTIMIZATION_PROMPT } from "@/prompts/optimizationPrompt";

export async function optimizeSearchQuery(
    userQuery: string,
    apiKey: string
): Promise<string> {
    const prompt = OPTIMIZATION_PROMPT(userQuery);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
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

export async function generateGeminiResponse(
    conversationContext: string,
    apiKey: string
): Promise<{ message: string; citations?: Citation[] }> {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("No response text received from Gemini API");
    }

    return parseGeminiResponse(text);
}

function parseGeminiResponse(
    rawText: string
): { message: string; citations?: Citation[] } {
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
}
