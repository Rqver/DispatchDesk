import express from "npm:express";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import { getStoryBySlug } from "../handlers/directus-api.ts";
import { appState } from "../handlers/state.ts";

const publicPath = join(Deno.cwd(), "public");
const storyTemplatePath = join(publicPath, "story.ejs");
const storyTemplate = await Deno.readTextFile(storyTemplatePath);

const notFoundTemplatePath = join(publicPath, "404.ejs");
const notFoundTemplate = await Deno.readTextFile(notFoundTemplatePath);

export default {
    url: '/story/:slug',
    type: 'GET',
    callback: async (req: express.Request, res: express.Response) => {
        try {
            const slug = req.params.slug;

            const story = await getStoryBySlug(slug);
            if (!story) {
                const templateData = {
                    breakingBar: appState.breakingBar,
                    featuredCategories: appState.featuredCategories,
                };

                const html = ejs.render(notFoundTemplate, templateData, {
                    views: [publicPath]
                });

                res.setHeader('Content-Type', 'text/html');
                return res.status(404).send(html);
            }

            const templateData = {
                story,
                breakingBar: appState.breakingBar,
                featuredCategories: appState.featuredCategories,
            };

            const html = ejs.render(storyTemplate, templateData, {
                views: [publicPath]
            });

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (error) {
            console.error(`Error rendering story page for slug [${req.params.slug}]:`, error);
            res.status(500).send("An error occurred while loading the article.");
        }
    }
};