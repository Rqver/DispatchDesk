import express from "npm:express";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import { getStoryBySlug } from "../../handlers/directus-api.ts";

const publicPath = join(Deno.cwd(), "public");
const liveBlogPartialPath = join(publicPath, "partials", "_live-blog.ejs");

export default {
    url: '/api/story/:slug/live-blog',
    type: 'GET',
    callback: async (req: express.Request, res: express.Response) => {
        try {
            const slug = req.params.slug;
            const story = await getStoryBySlug(slug);

            if (!story || !story.liveBlog) {
                return res.send('');
            }

            const html = await ejs.renderFile(liveBlogPartialPath, { liveBlog: story.liveBlog });

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (error) {
            console.error(`Error rendering live blog partial for slug [${req.params.slug}]:`, error);
            res.status(500).send("");
        }
    }
};