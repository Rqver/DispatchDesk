import express from "npm:express";
import { appState } from "../handlers/state.ts";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";

const publicPath = join(Deno.cwd(), "public");
const contactTemplatePath = join(publicPath, "contact.ejs");
const contactTemplate = await Deno.readTextFile(contactTemplatePath);

export default {
    url: '/contact-us',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        const templateData = {
            breakingBar: appState.breakingBar,
            featuredCategories: appState.featuredCategories,
        };

        const html = ejs.render(contactTemplate, templateData, {
            views: [publicPath]
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
};