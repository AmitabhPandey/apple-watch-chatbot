export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    serperApiKey: process.env.SERPER_API_KEY || "",
    isDev: process.env.NODE_ENV === "development",
};

export function validateConfig() {
    const missing = [];
    if (!config.geminiApiKey) missing.push("GEMINI_API_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
}
