import axios from "axios";
import { SearchAPIResponse, SearchResult } from "@/types/chat";
import { config } from "@/lib/config";

export async function searchWeb(query: string): Promise<SearchResult[]> {
    try {
        if (!config.searchApiKey) {
            console.log("Search API key not configured, skipping web search");
            return [];
        }

        console.log("Searching web with SearchAPI.io for:", query);

        const response = await axios.get<SearchAPIResponse>(
            "https://www.searchapi.io/api/v1/search",
            {
                params: {
                    engine: "google",
                    q: query,
                    api_key: config.searchApiKey,
                },
            }
        );

        const results: SearchResult[] = [];

        // Capture AI Overview if available
        if (response.data.ai_overview?.text_blocks) {
            const overviewText = response.data.ai_overview.text_blocks
                .map(block => {
                    if (block.answer) return block.answer;
                    if (block.items) return block.items.map(i => i.answer).join("\n");
                    return "";
                })
                .filter(Boolean)
                .join("\n");

            if (overviewText) {
                results.push({
                    title: "AI Overview",
                    link: "#",
                    snippet: overviewText,
                    position: 0
                });
            }
        }

        // Add organic results
        const organicResults = response.data.organic_results?.slice(0, config.searchResultsCount) || [];
        results.push(...organicResults);

        console.log(`Found ${results.length} total search items (including AI overview if present)`);
        return results;
    } catch (error) {
        console.error("Error searching web:", error);
        return [];
    }
}

