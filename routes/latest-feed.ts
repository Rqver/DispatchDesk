import express from "npm:express";
import { appState } from "../handlers/state.ts";

export default {
    url: '/feed/latest',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        res.type('application/rss+xml; charset=utf-8');
        res.send(appState.currentRSSFeed);
    }
};
