import axios from 'axios';
import { config } from '../config';

export async function getOgImage(url: string): Promise<string | undefined> {
    if (!config.firecrawlApiKey) {
        console.warn('FIRECRAWL_API_KEY is not configured');
        return undefined;
    }

    try {
        const response = await axios.post(
            'https://api.firecrawl.dev/v2/scrape',
            { url },
            {
                headers: {
                    'Authorization': `Bearer ${config.firecrawlApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.success && response.data.data.metadata?.ogImage) {
            return response.data.data.metadata.ogImage;
        }

        return undefined;
    } catch (error) {
        console.error(`Error scraping image from ${url}:`, error);
        return undefined;
    }
}
