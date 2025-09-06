import express from "npm:express";
import { appState } from "../handlers/state.ts";

export default {
    url: '/',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(appState.currentHomepageHtml);
    }
};