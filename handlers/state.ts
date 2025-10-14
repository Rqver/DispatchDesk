import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import * as api from './directus-api.ts';
import { getSearchIndexCount, initialFullSync } from "./search-sync.ts";
import { escapeXml } from "../util/xml.ts";
import { BreakingNewsBar, Category, FeaturedCategories, FeaturedStories, Story } from "../types.ts";
import { popularStoriesHandler } from "./popular-stories.ts";
import {config} from "../config.ts";
import {populateCategoryCache} from "./category-cache.ts";

const SITE_URL = "https://dispatchdesk.nz";
const STATIC_PAGES = [
    { loc: '/', changefreq: 'hourly', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/our-tech', changefreq: 'monthly', priority: '0.7' },
    { loc: '/contact-us', changefreq: 'yearly', priority: '0.5' },
    { loc: '/feed/latest', changefreq: 'hourly', priority: '0.9' },
    { loc: '/feed/popular', changefreq: 'hourly', priority: '0.9' },
];

function generateHomepageHtml(template: string, state: AppState): string {
    const templateData = {
        ...state.featuredStories,
        breakingBar: state.breakingBar,
        featuredCategories: state.featuredCategories,
        moreHeadlines: state.moreHeadlines,
        latestStories: state.latestStories.slice(0, 5),
        mostPopularStories: popularStoriesHandler.mostPopular.slice(0, 5)
    };
    return ejs.render(template, templateData, {
        views: [join(Deno.cwd(), "public")]
    });
}

function generateRssFeed(stories: Story[]): string {
    const feedItems = stories.map(story => {
        const pubDate = new Date(story.publishDate).toUTCString();
        return `      <item>
         <title>${escapeXml(story.title)}</title>
         <link>${SITE_URL}/stories/${story.slug}</link>
         <guid>${SITE_URL}/stories/${story.slug}</guid>
         <pubDate>${pubDate}</pubDate>
         <description>${escapeXml(story.tagline)}</description>
         <author>${story.ai_written ? story.original_source : (escapeXml(story.author || "Dispatch Desk Writers"))}</author>
         <media:content url="${escapeXml(story.header_media)}" medium="image"/>
      </item>`;
    }).join('\n');

    return `<?xml version="1.0"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
   <channel>
      <title>Dispatch Desk</title>
      <link>${SITE_URL}</link>
      <description>Dispatch Desk stories from the last two days</description>
      <language>en-nz</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${SITE_URL}/feed/latest" rel="self" type="application/rss+xml" />
${feedItems}
   </channel>
</rss>`;
}

function generateNewsSitemap(stories: Story[]): string {
    const urls = stories.map(story => {
        const publicationDate = new Date(story.publishDate).toISOString();
        return `  <url>
    <loc>${SITE_URL}/stories/${story.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Dispatch Desk</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(story.title)}</news:title>
    </news:news>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="https://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
}

async function generateSitemap(categories: Category[]): Promise<string> {
    const urls: string[] = [];

    // Static Pages
    STATIC_PAGES.forEach(page => {
        urls.push(`<url><loc>${SITE_URL}${page.loc}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`);
    });

    // Category Pages
    for (const c of categories) {
        urls.push(`<url><loc>${SITE_URL}/category/${escapeXml(c.slug)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}


class AppState {
    public breakingBar: BreakingNewsBar | false = false;
    public featuredStories: FeaturedStories = {} as FeaturedStories;
    public featuredCategories: FeaturedCategories = {} as FeaturedCategories;
    public moreHeadlines: Story[] = [];
    public latestStories: Story[] = [];

    public currentHomepageHtml = "<html><body>Initializing server...</body></html>";
    public currentRSSFeed = "";
    public currentSitemap = "";
    public currentNewsSitemap = "";

    private _isRefreshing = false;
    private readonly _homeTemplate: string;
    private _lastBreakingBarState: BreakingNewsBar | false = false;
    private _lastFeaturedStoriesState: FeaturedStories = {} as FeaturedStories;
    private _lastFeaturedCategoriesState: FeaturedCategories = {} as FeaturedCategories;
    private _lastLatestStoriesState: Story[] = [];

    constructor() {
        const publicPath = join(Deno.cwd(), "public");
        this._homeTemplate = Deno.readTextFileSync(join(publicPath, "home.ejs"));
    }

    async initialize() {
        await this.checkAndSyncSearchIndex();
        this._isRefreshing = true;

        const allCategories = await api.fetchAllCategories();
        populateCategoryCache(allCategories);

        await this._refreshCoreData();
        this._updateLastStates();
        await this._updateAllRenders();

        this._isRefreshing = false;
    }

    async checkAndSyncSearchIndex() {
        if (!config.features.search) return;
        const [directusCount, meiliCount] = await Promise.all([
            api.fetchPublishedStoryCount(),
            getSearchIndexCount()
        ]);

        if (directusCount !== meiliCount) {
            console.log("Search index out of sync. Starting full sync.");
            await initialFullSync();
        }
    }

    async invalidateAndRefresh(): Promise<string[]> {
        if (this._isRefreshing) return [];
        this._isRefreshing = true;

        try {
            const [newBreakingBar, newFeaturedStories, newFeaturedCategories, newLatestStories, allCategories] = await Promise.all([
                api.fetchBreakingNews(),
                api.fetchFeaturedStories(),
                api.fetchFeaturedCategories(),
                api.fetchLatestStories(),
                api.fetchAllCategories()
            ]);

            populateCategoryCache(allCategories);

            const changedSlots = this._getChangedSlots(
                newBreakingBar,
                newFeaturedStories || {} as FeaturedStories,
                newFeaturedCategories || {} as FeaturedCategories,
                newLatestStories
            );

            if (changedSlots.length === 0) {
                return [];
            }

            await this._refreshCoreData();
            this._updateLastStates();
            await this._updateAllRenders();

            return changedSlots;

        } catch (error) {
            console.error("Error during state refresh:", error);
            return [];
        } finally {
            this._isRefreshing = false;
        }
    }

    private async _refreshCoreData() {
        const [breakingNews, featuredStories, featuredCategories, latestStories] = await Promise.all([
            api.fetchBreakingNews(),
            api.fetchFeaturedStories(),
            api.fetchFeaturedCategories(),
            api.fetchLatestStories()
        ]);

        this.breakingBar = breakingNews;
        this.featuredStories = featuredStories || {} as FeaturedStories;
        this.featuredCategories = featuredCategories || {} as FeaturedCategories;
        this.latestStories = latestStories;

        const excludeIds = Object.values(this.featuredStories).filter(Boolean).map(s => s.id);
        this.moreHeadlines = await api.fetchMoreHeadlines(excludeIds);
    }

    private async _updateAllRenders() {
        const categoriesForSitemap = await api.fetchCategoriesWithStories();

        this.currentHomepageHtml = generateHomepageHtml(this._homeTemplate, this);
        this.currentRSSFeed = generateRssFeed(this.latestStories);
        this.currentNewsSitemap = generateNewsSitemap(this.latestStories);
        this.currentSitemap = await generateSitemap(categoriesForSitemap);
    }

    private _updateLastStates() {
        this._lastBreakingBarState = structuredClone(this.breakingBar);
        this._lastFeaturedStoriesState = structuredClone(this.featuredStories);
        this._lastFeaturedCategoriesState = structuredClone(this.featuredCategories);
        this._lastLatestStoriesState = structuredClone(this.latestStories);
    }

    private _getChangedSlots(
        newBreakingBar: BreakingNewsBar | false,
        newFeaturedStories: FeaturedStories,
        newFeaturedCategories: FeaturedCategories,
        newLatestStories: Story[]
    ): string[] {
        const changedSlots: string[] = [];

        const allStoryKeys = new Set([
            ...Object.keys(this._lastFeaturedStoriesState),
            ...Object.keys(newFeaturedStories)
        ]) as Set<keyof FeaturedStories>;

        for (const key of allStoryKeys) {
            if (this._lastFeaturedStoriesState[key]?.id !== newFeaturedStories[key]?.id) {
                changedSlots.push(key);
            }
        }

        if (JSON.stringify(this._lastBreakingBarState) !== JSON.stringify(newBreakingBar)) {
            changedSlots.push('breakingBar');
        }
        if (JSON.stringify(this._lastFeaturedCategoriesState) !== JSON.stringify(newFeaturedCategories)) {
            changedSlots.push('featured_categories_nav');
        }
        if (JSON.stringify(this._lastLatestStoriesState) !== JSON.stringify(newLatestStories)) {
            changedSlots.push('latest_stories');
        }

        return [...new Set(changedSlots)];
    }
}

export const appState = new AppState();