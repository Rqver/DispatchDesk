import { MeiliSearch } from 'npm:meilisearch';
import { fetchAllStoriesForSearch } from './directus-api.ts';
import {Story} from "../types.ts";
import {config} from "../config.ts";
const client = config.features.search ? new MeiliSearch({
    host: config.meilisearch.host!,
    apiKey: config.meilisearch.apiKey!,
}) : null;

const index = client ? client.index('stories') : null;

function formatStoryForSearch(story: Story) {
    return {
        id: story.id,
        title: story.title,
        slug: story.slug,
        tagline: story.tagline,
        body: story.body,
        publishDate: story.publishDate,
        header_media: story.header_media
    };
}

export async function syncStory(story: Story) {
    if(!index) return;
    const document = formatStoryForSearch(story);
    await index.addDocuments([document]);
}

export async function deleteStoryFromSearch(storyId: number) {
    if (!index) return;
    await index.deleteDocument(storyId);
}

export async function initialFullSync() {
    if(!index) return;
    await index.deleteAllDocuments();
    const allStories = await fetchAllStoriesForSearch();
    const documents = allStories.map(formatStoryForSearch);

    await index.updateSettings({
        displayedAttributes: ['id', 'title', 'slug', 'tagline', 'body', 'publishDate', 'header_media', '_formatted'],
        searchableAttributes: ['title', 'tagline', 'body'],
        filterableAttributes: ['publishDate'],
        sortableAttributes: ['publishDate']
    });

    await index.addDocuments(documents, { primaryKey: 'id' });
}

export async function getSearchIndexCount(): Promise<number> {
    if(!index) return 0;
    try {
        const stats = await index.getStats();
        return stats.numberOfDocuments;
    } catch (error: any) {
        if (error.toString().includes('not found')) {
            return 0;
        }
        console.error("Failed to fetch stats from MeiliSearch:", error);
        return -1;
    }
}