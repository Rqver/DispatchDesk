import express from "npm:express";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import {
    getRecentStoriesByCategorySlug,
    fetchMoreHeadlines, fetchCategoryBySlug
} from "../handlers/directus-api.ts";
import { appState } from "../handlers/state.ts";
import {popularStoriesHandler} from "../handlers/popular-stories.ts";

const publicPath = join(Deno.cwd(), "public");
const recentStoriesTemplatePath = join(publicPath, "category.ejs");
const recentStoriesTemplate = await Deno.readTextFile(recentStoriesTemplatePath);

export default {
    url: '/category/:slug',
    type: 'GET',
    callback: async (req: express.Request, res: express.Response) => {
        try {
            const slug = req.params.slug;
            const limit = 12;

            let stories;
            let pageTitle;

            if (slug === 'latest') {
                stories = await fetchMoreHeadlines([], limit);
                pageTitle = "Latest Stories";
            } else if (slug === 'popular') {
                stories = popularStoriesHandler.mostPopular;
                pageTitle = "Popular Stories";
            } else {
                const category = await fetchCategoryBySlug(slug);

                if (category) {
                    pageTitle = category.name;
                } else {
                    pageTitle = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
                }

                stories = await getRecentStoriesByCategorySlug(slug, limit);
            }

            if (!stories) {
                return res.status(500).send("Failed to retrieve stories.");
            }

            const templateData = {
                stories,
                pageTitle,
                breakingBar: appState.breakingBar,
                featuredCategories: appState.featuredCategories,
            };

            const html = ejs.render(recentStoriesTemplate, templateData, {
                views: [publicPath]
            });

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (error) {
            console.error(`Error rendering recent stories page for [${req.params.slug}]:`, error);
            res.status(500).send("An error occurred while loading the page.");
        }
    }
};