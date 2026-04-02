export interface SearchResult {
    id: string;
    title: string;
    category: string;
    description?: string;

    metadata?: Record<string, any>;     // Flexible object for additional data
}
