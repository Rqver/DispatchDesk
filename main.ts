import express from "npm:express";
import { join } from "jsr:@std/path";
import { initRoutes } from "./handlers/routes.ts";
import { appState } from "./handlers/state.ts";
import http from "node:http";
import {setupWebSocket} from "./handlers/ws.ts";
import {popularStoriesHandler} from "./handlers/popular-stories.ts";

const PORT = 8080;
async function start() {
    await popularStoriesHandler.setupUmamiAPIClient();
    await appState.initialize();

    const app = express();
    app.use(express.static(join(Deno.cwd(), "public/assets")));
    await initRoutes(app, "routes");

    const server = http.createServer(app);
    setupWebSocket(server);

    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

Deno.cron("Refresh Most Popular Stories", "*/5 * * * *", () => {
    popularStoriesHandler.refreshMostPopularStories();
});

start();