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
            title: "Our Mission",
            content: `
            Dispatch Desk is an independent news service built around three principles: accessibility, accuracy, and privacy. <br/>
            • We believe everyone deserves access to fast, accurate news, without their privacy being invaded. <br/>
            • We do not run advertisements or tracking scripts. The only data we store in your browser is a theme preference.<br/>
            • Our reporting is free for everyone. We will never put our stories behind a paywall of any kind, or add invasive monetization. <br/> 
            • Dispatch Desk is funded by us, its creators. In the future, we may accept donations as a not-for-profit to cover infrastructure costs. <br/>
            • We aim to deliver fast, accurate coverage of important news in New Zealand & the world, without sensationalism or click-driven content. <br/>
            • We use open-source, self-hosted infrastructure wherever possible. For more details see our <a href="https://dispatchdesk.nz/our-tech">Our Tech</a> page. <br/>
            • We make use of AI LLM's to write and editorialize stories from the releases we grab. Visit <a href="https://dispatchdesk.nz/our-tech">Our Tech</a> page for more information. <br/>  
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