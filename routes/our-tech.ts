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
            title: "Our Tech",
            content: `
            Dispatch Desk uses simple, open-source technology, supplemented by OpenAI's API for story writing. <br/>
            • We self-host all our infrastructure, including our CMS (<a href="https://directus.io/" target="_blank">Directus</a>), analytics, and web servers. <br/>
            • This website is built with Tailwind CSS, EJS templates, and Deno v2 with TypeScript. It's <a href="https://github.com/Rqver/DispatchDesk" target="_blank">Open source</a>. <br/>
            • For analytics, we host our own <a href="https://umami.is/" target="_blank">Umami</a> instance. It collects only basic, anonymized data. The full analytics dashboard is <a href="https://stats.dispatchdesk.nz/share/6XEwwywFdBueuCzx/dispatchdesk.nz" target="_blank">publicly available</a>. <br/>
            • We make use of GPT-5-nano and GPT-5 to prioritize, categorize and editorialize releases we grab. All stories that have been written using AI feature a disclaimer. The codebase responsible for this is open source <a href="https://github.com/Rqver/DispatchDesk-Newsroom" target="_blank">here</a>.<br/>
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