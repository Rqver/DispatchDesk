import express from "npm:express";
import { appState } from "../handlers/state.ts";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";

const publicPath = join(Deno.cwd(), "public");
const storyTemplatePath = join(publicPath, "page.ejs");
const storyTemplate = await Deno.readTextFile(storyTemplatePath);

export default {
    url: '/about',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        const templateData = {
            title: "About Dispatch Desk",
            content: `
                Dispatch Desk is an experimental, proof-of-concept project exploring how AI can be used in news aggregation and publishing. The Project:
                <ul>
                    <li>Frequently scrapes websites & RSS feeds for press releases.</li>
                    <li>Uses AI to decide if the press release is newsworthy in an NZ context.</li>
                    <li>Uses AI to create a title, tagline and story body from the press release.</li>
                    <li>Selects an appropriate picture using vector embeddings.</li>
                    <li>Publishes the story, and uses AI to arrange the home page layout.</li>
                </ul>
                
                Dispatch Desk is not a newsroom, not a journalistic outlet, and not intended to be relied upon as an authoritative source of news. The project operates day-to-day with zero human intervention or review. <br/><br/>
                
                I write about my personal views on AI in the media and my motivation for this project on my <a href="todo">portfolio</a>.
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