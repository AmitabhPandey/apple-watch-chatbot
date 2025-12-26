export const OPTIMIZATION_PROMPT = (userQuery: string) => `You are a search query optimizer for Apple Watch related questions.

User question: "${userQuery}"

Generate an optimized search query that will find the most relevant, current information about Apple Watch.
Focus on extracting key terms, features, models, and technical details.
Make the query concise but comprehensive for web search.

Respond with only the optimized search query text, nothing else.`;
