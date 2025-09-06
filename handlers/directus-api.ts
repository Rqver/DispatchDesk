import { enrichStoryBodyWithCaptions } from "../util/image.ts";
import {
    BreakingNewsBar,
    Category,
    FeaturedCategories,
    FeaturedStories,
    LiveBlog,
    LiveBlogEntry,
    Story,
} from "../types.ts";
import { getCategoryById, getCategoryBySlug } from "./category-cache.ts";

const API_BASE_URL = "https://dash.dispatchdesk.nz";

const FEATURED_STORY_KEYS: (keyof FeaturedStories)[] = [
    "main_story",
    "top_story_one",
    "secondary_story_one",
    "secondary_story_two",
    "secondary_story_three",
    "special_separator_story",
    "additional_story_one",
    "additional_story_two",
    "additional_story_three",
    "additional_story_four",
    "additional_story_five",
    "additional_story_six",
];

async function directusFetch<T>(endpoint: string): Promise<T | null> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            console.error(`API request failed with status ${response.status}: ${endpoint}`);
            return null;
        }
        const json = await response.json();
        if (json.errors) {
            console.error(`Directus API error for ${endpoint}:`, json.errors);
            return null;
        }
        return json.data as T;
    } catch (error) {
        console.error(`Network error or JSON parsing failed for ${endpoint}:`, error);
        return null;
    }
}

function getMediaURL(input: string): string {
    if (!input) return "https://placehold.co/800x600/0891B2/FFFFFF?text=Dispatch+Desk";
    if (input.includes("/assets")) return input;
    if (input.split("-").length - 1 === 4) return `${API_BASE_URL}/assets/${input}`;
    return input;
}

export async function getMediaMeta(input: string): Promise<{ url: string; caption?: string; source?: string }> {
    const url = getMediaURL(input);
    const uuidMatch = input.match(/[a-f0-9-]{36}/);
    if (!uuidMatch) return { url };

    const uuid = uuidMatch[0];
    const fileData = await directusFetch<any>(`/files/${uuid}`);

    if (!fileData) return { url };

    return {
        url,
        caption: fileData.title || "",
        source: fileData.description || "Supplied",
    };
}

async function _fetchAndProcessLiveBlog(liveBlogId: string): Promise<LiveBlog | undefined> {
    const liveData = await directusFetch<any>(`/items/live_blogs/${liveBlogId}?fields=*,pinned_entry.*`);
    if (!liveData) return;

    const entriesData = await directusFetch<any[]>(`/items/live_blog_entries?filter[live_blog][_eq]=${liveData.id}&fields=*`);
    if (!entriesData) return;

    const entries: LiveBlogEntry[] = entriesData
        .filter((entry) => !liveData.pinned_entry || entry.id !== liveData.pinned_entry.id)
        .map((entry) => ({
            id: entry.id,
            date_created: new Date(entry.date_created),
            title: entry.title,
            entry: entry.entry,
        }));

    const liveBlog: LiveBlog = {
        id: liveData.id,
        date_created: new Date(liveData.date_created),
        name: liveData.name,
        entries,
    };

    if (liveData.pinned_entry) {
        liveBlog.pinned_entry = {
            id: liveData.pinned_entry.id,
            date_created: new Date(liveData.pinned_entry.date_created),
            title: liveData.pinned_entry.title,
            entry: liveData.pinned_entry.entry,
        };
    }

    return liveBlog;
}

async function fetchCategoriesForStoriesBatch(storyIds: number[]): Promise<Record<number, Category[]>> {
    if (storyIds.length === 0) return {};

    const junctionData = await directusFetch<any[]>(
        `/items/stories_categories?filter[stories_id][_in]=${storyIds.join(",")}&fields=stories_id,categories_id`
    );
    if (!junctionData || junctionData.length === 0) return {};

    const storyCategoriesMap: Record<number, Category[]> = {};
    storyIds.forEach((id) => {
        storyCategoriesMap[id] = [];
    });

    junctionData.forEach((j) => {
        const category = getCategoryById(j.categories_id);
        if (category) {
            storyCategoriesMap[j.stories_id].push(category);
        }
    });

    return storyCategoriesMap;
}


async function mapStoriesWithCategories(storiesData: any[]): Promise<Story[]> {
    const storyIds = storiesData.map((s) => s.id);
    const categoriesMap = await fetchCategoriesForStoriesBatch(storyIds);

    return Promise.all(
        storiesData.map(async (data) => {
            const storyCategories = categoriesMap[data.id] || [];
            const mediaMeta = await getMediaMeta(data.header_media);
            const body = await enrichStoryBodyWithCaptions(data.body);

            const story: Story = {
                id: data.id,
                title: data.title,
                slug: data.slug,
                body: body || "More to come...",
                tagline: data.tagline,
                is_breaking: data.is_breaking,
                categories: storyCategories,
                author: data.author || "Dispatch Desk Writers",
                ai_written: data.ai_written,
                original_source: data.original_source,
                publishDate: data.publish_date,
                header_media: getMediaURL(data.header_media),
                header_caption: `${mediaMeta.caption} / ${mediaMeta.source}`,
                liveBlog: data.live_blog ? await _fetchAndProcessLiveBlog(data.live_blog) : undefined,
            };
            return story;
        })
    );
}

export async function getStory(id: number): Promise<Story | false> {
    const data = await directusFetch<any[]>(`/items/stories?filter[id][_eq]=${id}&filter[status][_eq]=PUBLISHED&fields=*`);
    if (!data || data.length === 0) return false;
    const stories = await mapStoriesWithCategories([data[0]]);
    return stories[0];
}

export async function getStoryBySlug(slug: string): Promise<Story | false> {
    const data = await directusFetch<any[]>(`/items/stories?filter[slug][_eq]=${slug}&filter[status][_eq]=PUBLISHED&fields=*,live_blog&limit=1`);
    if (!data || data.length === 0) return false;
    const stories = await mapStoriesWithCategories([data[0]]);
    return stories[0];
}

export async function fetchAllStoriesForSearch(): Promise<Story[]> {
    const data = await directusFetch<any[]>(`/items/stories?limit=-1&filter[status][_eq]=PUBLISHED&fields=*`);
    if (!data) return [];
    return await mapStoriesWithCategories(data);
}

export async function fetchAllCategories(): Promise<Category[]> {
    const data = await directusFetch<Category[]>(`/items/categories?limit=-1&fields=id,name,slug`);
    return data || [];
}

export async function fetchFeaturedStories(): Promise<FeaturedStories | null> {
    const storyFields = FEATURED_STORY_KEYS.map((field) => `${field}.*`).join(",");
    const encodedFields = encodeURIComponent(storyFields);

    const data = await directusFetch<any>(`/items/featured_stories?fields=${encodedFields}`);
    if (!data) return null;

    const storiesData: Partial<FeaturedStories> = {};
    for (const key of FEATURED_STORY_KEYS) {
        const storyObject = data[key];
        if (storyObject) {
            const mapped = await mapStoriesWithCategories([storyObject]);
            storiesData[key] = mapped[0];
        }
    }
    return storiesData as FeaturedStories;
}

export async function fetchFeaturedCategories(): Promise<FeaturedCategories | null> {
    const categoryFields = ["category_one", "category_two", "category_three", "category_four", "category_five"]
        .map((field) => `${field}.*`)
        .join(",");

    const data = await directusFetch<any>(`/items/featured_categories?fields=${categoryFields}`);
    if (!data) return null;

    const categoriesData: Partial<FeaturedCategories> = {};
    for (const [key, categoryObject] of Object.entries(data)) {
        if (key !== "id" && categoryObject) {
            categoriesData[key as keyof FeaturedCategories] = categoryObject as Category;
        }
    }
    return categoriesData as FeaturedCategories;
}

export async function fetchCategoriesWithStories(): Promise<Category[]> {
    const stories = await directusFetch<any[]>(`/items/stories?filter[status][_eq]=PUBLISHED&fields=id`);
    if (!stories || stories.length === 0) return [];

    const storyIds = stories.map((s) => s.id);
    const categoriesMap = await fetchCategoriesForStoriesBatch(storyIds);

    const allCategories = Object.values(categoriesMap).flat();
    const unique: Record<number, Category> = {};
    allCategories.forEach((c) => (unique[c.id] = c));
    return Object.values(unique);
}

export async function getRecentStoriesByCategorySlug(categorySlug: string, limit = 10): Promise<Story[]> {
    const category = getCategoryBySlug(categorySlug); // Get from cache
    if (!category) return [];

    const categoryId = category.id;
    const junctionData = await directusFetch<any[]>(`/items/stories_categories?filter[categories_id][_eq]=${categoryId}&fields=stories_id`);
    if (!junctionData || junctionData.length === 0) return [];

    const storyIds = junctionData.map((j) => j.stories_id);
    const data = await directusFetch<any[]>(`/items/stories?filter[id][_in]=${storyIds.join(",")}&filter[status][_eq]=PUBLISHED&sort=-publish_date&limit=${limit}`);
    if (!data) return [];

    return await mapStoriesWithCategories(data);
}


export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
    return getCategoryBySlug(slug) || null;
}

export async function fetchBreakingNews(): Promise<BreakingNewsBar | false> {
    const data = await directusFetch<any>(`/items/breaking_news_bar?cache=no`);
    if (!data || !data.story_link) return false;

    const story = await getStory(data.story_link);
    if (!story) return false;

    return {
        enabled: data.enabled,
        link: story.slug,
        prefix: data.prefix,
        headline: data.headline,
    };
}

export async function fetchMoreHeadlines(excludeIds: number[], limit = 6): Promise<Story[]> {
    const excludeParams = excludeIds.map((id) => `filter[id][_nin]=${id}`).join("&");
    const data = await directusFetch<any[]>(`/items/stories?filter[status][_eq]=PUBLISHED&sort=-publish_date&limit=${limit}&${excludeParams}`);
    if (!data) return [];
    return await mapStoriesWithCategories(data);
}

export async function fetchPublishedStoryCount(): Promise<number> {
    const data = await directusFetch<any[]>(`/items/stories?aggregate[count]=*`);
    if (data && data.length > 0) return parseInt(data[0].count, 10) || 0;
    return 0;
}

export async function fetchLatestStories(): Promise<Story[]> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const data = await directusFetch<any[]>(`/items/stories?filter[status][_eq]=PUBLISHED&filter[publish_date][_gte]=${twoDaysAgo.toISOString()}&sort=-publish_date`);
    if (!data) return [];
    return await mapStoriesWithCategories(data);
}
