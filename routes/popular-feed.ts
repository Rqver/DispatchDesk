import express from "npm:express";
import {popularStoriesHandler} from "../handlers/popular-stories.ts";

export default {
    url: '/feed/popular',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        res.type('application/rss+xml; charset=utf-8');
        res.send(popularStoriesHandler.currentMostPopularRSSFeed);
    }
};
