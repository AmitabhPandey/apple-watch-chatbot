export interface Citation {
    title: string;
    url: string;
    description: string;
}

export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    citations?: Citation[];
}

export interface GeminiResponse {
    message: string;
    citations?: Citation[];
}

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    date?: string;
    source?: string;
}

export interface AIOverviewTextBlock {
    type: string;
    answer?: string;
    items?: { type: string; answer: string }[];
    link?: string;
    source?: string;
    channel?: string;
    date?: string;
}

export interface SearchAPIResponse {
    search_metadata: {
        id: string;
        status: string;
    };
    organic_results: SearchResult[];
    ai_overview?: {
        text_blocks: AIOverviewTextBlock[];
    };
}

