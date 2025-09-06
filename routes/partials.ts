import express from "npm:express";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import {fetchBreakingNews} from "../handlers/directus-api.ts";
import {appState} from "../handlers/state.ts";

const publicPath = join(Deno.cwd(), "public");

const partialTemplates: Record<string, string> = {
    "main_story": "partials/_main-story-card",
    "top_story_one": "partials/_story-card-wide",
    "secondary_story_one": "partials/_story-card-side-image",
    "secondary_story_two": "partials/_story-card-side-image",
    "secondary_story_three": "partials/_story-card-side-image",
    "special_separator_story": "partials/_special-separator-story",
    "additional_story_one": "partials/_story-card-block",
    "additional_story_two": "partials/_story-card-block",
    "additional_story_three": "partials/_story-card-block",
    "additional_story_four": "partials/_story-card-block",
    "additional_story_five": "partials/_story-card-block",
    "additional_story_six": "partials/_story-card-block",
    "breakingBar": "partials/_breaking-bar",
    "featured_categories_nav": "partials/_category-nav",
    "latest_stories": "partials/_story-list"
};

export default {
    url: '/partials/:slot',
    type: 'GET',
    callback: async (req: express.Request, res: express.Response) => {
        const slot = req.params.slot;

        const templatePath = partialTemplates[slot];
        if (!templatePath) {
            return res.status(404).send("Unknown slot");
        }

        const templateData: Record<string, any> = {};

        switch(slot){
            case "breakingBar":
                templateData.breakingBar = (await fetchBreakingNews()) || {};
                break;
            case "featured_categories_nav":
                templateData.featuredCategories = appState.featuredCategories;
                break;
            case "latest_stories":
                templateData.stories = appState.latestStories.slice(0, 5);
                break;
            default:
                templateData.story = appState.featuredStories[slot as keyof typeof appState.featuredStories];
        }

        if (!templateData) {
            return res.status(404).send("No data for this slot");
        }

        const html = await ejs.renderFile(join(publicPath, `${templatePath}.ejs`), templateData, {
            views: [publicPath]
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
};