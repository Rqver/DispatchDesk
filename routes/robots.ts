import express from "npm:express";
import { join } from "jsr:@std/path";

const publicPath = join(Deno.cwd(), "public");
const filePath = join(publicPath, "robots.txt");
const file = await Deno.readTextFile(filePath);

export default {
    url: '/robots.txt',
    type: 'GET',
    callback: async (_: express.Request, res: express.Response) => {
        res.setHeader('Content-Type', 'text/plain');
        res.send(file);
    }
};
