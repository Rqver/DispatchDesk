import express from "npm:express";
import {broadcastUpdate} from "../../handlers/ws.ts";

export default {
    url: '/api/invalidate-liveblog-cache',
    type: 'POST',
    callback: async (_: express.Request, res: express.Response) => {
        res.status(200).json({message: 'Revalidation triggered'})
        broadcastUpdate({ type: 'live_blog_update' });
    }
};