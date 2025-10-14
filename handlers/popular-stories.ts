import { fetchLatestStories, getStoryBySlug } from "./directus-api.ts";
import { escapeXml } from "../util/xml.ts";
import { Story } from "../types.ts";
import {config} from "../config.ts";

export class PopularStoriesHandler {
    public mostPopular: Story[] = [];
    public currentMostPopularRSSFeed = "";
    private umamiToken: string | null = null;
    private umamiWebsiteId: string | null = null;
    private readonly siteUrl = "https://dispatchdesk.nz";

    constructor() {
        this.setupUmamiAPIClient()
    }

    public async setupUmamiAPIClient(): Promise<void> {
        if (!config.features.popularStories) return;

        try {
            const authRes = await fetch("https://stats.dispatchdesk.nz/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    username: config.umami.username,
                    password: config.umami.password,
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (!authRes.ok) {
                throw new Error(`Umami auth failed with status: ${authRes.status}`);
            }

            const authJson = await authRes.json();
            if (authJson.token) {
                this.umamiToken = authJson.token;
            } else {
                throw new Error("Umami authentication did not return a token.");
            }

            const websitesRes = await fetch("https://stats.dispatchdesk.nz/api/websites", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.umamiToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!websitesRes.ok) {
                throw new Error(`Failed to fetch Umami websites with status: ${websitesRes.status}`);
            }

            const websites = await websitesRes.json();
            if (websites.data && websites.data.length > 0) {
                this.umamiWebsiteId = websites.data[0].id;
            } else {
                throw new Error("No websites found in Umami account.");
            }

            await this.refreshMostPopularStories();
        } catch (error) {
            console.error("Failed to setup Umami API client:", error);
        }
    }

    public async refreshMostPopularStories(): Promise<void> {
        if(!config.features.popularStories) return;
        if (!this.umamiWebsiteId || !this.umamiToken) {
            console.error("Umami client not initialized. Cannot refresh popular stories.");
            return;
        }

        try {
            const startAt = Date.now() - 5 * 60 * 60 * 1000;
            const res = await fetch(`https://stats.dispatchdesk.nz/api/websites/${this.umamiWebsiteId}/metrics?startAt=${startAt}&endAt=${Date.now()}&unit=hour&timezone=Pacific/Auckland&type=url`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.umamiToken}`,
                    "Accept": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch metrics with status: ${res.status}`);
            }

            const urls = await res.json();
            let stories = urls.filter((d: any) => d.x.includes("/story/"));
            stories = stories.sort((a: any, b: any) => b.y - a.y);

            const mostPopularStories: Story[] = [];
            for (const story of stories) {
                const slug = story.x.replace("/story/", "");
                const storyBySlug = await getStoryBySlug(slug);
                if (storyBySlug) {
                    mostPopularStories.push(storyBySlug);
                }
            }

            if (mostPopularStories.length < 5) {
                const latestStories = await fetchLatestStories();
                for (const s of latestStories) {
                    if (mostPopularStories.find(popStory => popStory.id === s.id)) {
                        continue;
                    }
                    if (mostPopularStories.length >= 5) {
                        break;
                    }
                    mostPopularStories.push(s);
                }
            }

            this.mostPopular = mostPopularStories;
            this.renderRSSFeed();
        } catch (error) {
            console.error("Failed to refresh most popular stories:", error);
        }
    }

    private renderRSSFeed(): void {
        const feedItems = this.mostPopular.map(story => {
            const pubDate = new Date(story.publishDate).toUTCString();
            return `      <item>
         <title>${escapeXml(story.title)}</title>
         <link>${this.siteUrl}/stories/${story.slug}</link>
         <guid>${this.siteUrl}/stories/${story.slug}</guid>
         <pubDate>${pubDate}</pubDate>
         <description>${escapeXml(story.tagline)}</description>
         <author>${story.ai_written ? story.original_source : (escapeXml(story.author || "Dispatch Desk Writers"))}</author>
         <media:content url="${escapeXml(story.header_media)}" medium="image"/>
      </item>`;
        }).join('\n');

        this.currentMostPopularRSSFeed = `<?xml version="1.0"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
   <channel>
      <title>Dispatch Desk</title>
      <link>${this.siteUrl}</link>
      <description>Most Popular Dispatch Desk stories right now</description>
      <language>en-nz</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${this.siteUrl}/feed/popular" rel="self" type="application/rss+xml" />
${feedItems}
   </channel>
</rss>`;
    }
}

export const popularStoriesHandler = new PopularStoriesHandler();
