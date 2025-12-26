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

export interface SerperSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    date?: string;
}

export interface SerperResponse {
    searchParameters: {
        q: string;
        type: string;
        engine: string;
    };
    organic: SerperSearchResult[];
    credits: number;
}
