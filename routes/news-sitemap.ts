import express from "npm:express";
import { appState } from "../handlers/state.ts";

export default {
    url: '/news-sitemap.xml',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        res.setHeader('Content-Type', 'application/xml');
        res.send(appState.currentNewsSitemap);
    }
};
