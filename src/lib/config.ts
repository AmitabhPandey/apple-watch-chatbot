export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    searchApiKey: process.env.SEARCH_API_KEY || "",
    searchResultsCount: parseInt(process.env.SEARCH_RESULTS_COUNT || "5", 10),
    isDev: process.env.NODE_ENV === "development",
};

export function validateConfig() {
    const missing = [];
    if (!config.geminiApiKey) missing.push("GEMINI_API_KEY");
    if (!config.searchApiKey) missing.push("SEARCH_API_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
}
