import axios from "axios";
import { SerperResponse, SerperSearchResult } from "@/types/chat";

export async function searchWeb(query: string): Promise<SerperSearchResult[]> {
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
