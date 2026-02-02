import express from "npm:express";
import { appState } from "../handlers/state.ts";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";

const publicPath = join(Deno.cwd(), "public");
const storyTemplatePath = join(publicPath, "page.ejs");

const storyTemplate = await Deno.readTextFile(storyTemplatePath);

export default {
    url: '/our-tech',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        const templateData = {
            title: "Tech",
            content: `
            Dispatch Desk is built as a technical demonstration of a completely hands-off media platform. <br/>
            
            As it is simply a POC, everything that can be self-hosted, is self-hosted as a cost saving exercise:
            <ul>
                <li><a target="_blank" href="https://directus.io/">Directus</a> as a CMS.</li>
                <li><a target="_blank" href="https://www.meilisearch.com/">Meilisearch</a> as a search engine.</li>
                <li><a target="_blank" href="https://umami.is/">Umami</a> for analytics.</li>
            </ul>
            
            This website is built using Tailwind CSS & EJS Templates, and is served via a Express on <a target="_blank" href="https://deno.com">Deno</a>. <br/><br/>
            
            The codebase for this website is available <a target="_blank" href="https://github.com/Rqver/DispatchDesk">here</a>, and the codebase for the story generation is available <a target="_blank" href="https://github.com/Rqver/DispatchDesk-Newsroom">here</a>.
            `,
            breakingBar: appState.breakingBar,
            featuredCategories: appState.featuredCategories,
        };

        const html = ejs.render(storyTemplate, templateData, {
            views: [publicPath]
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
};