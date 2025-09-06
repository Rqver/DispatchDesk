import express from "npm:express";
import {Express, NextFunction} from "npm:@types/express@5.0.0/index.d.ts";
import { join } from "jsr:@std/path";
import ejs from "npm:ejs";
import {appState} from "./state.ts";

async function readRoutes(directory: string): Promise<string[]> {
    const files: string[] = [];

    for await (const entry of Deno.readDir(directory)) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory) {
            const nestedFiles = await readRoutes(fullPath);
            files.push(...nestedFiles);
        } else if (entry.isFile && entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

interface RouteDefinition {
    url: string;
    type: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    callback: (req: Request, res: Response, next?: NextFunction) => Promise<void> | void;
    middleware?: ((req: Request, res: Response, next: NextFunction) => void)[];
}

const publicPath = join(Deno.cwd(), "public");
const notFoundTemplatePath = join(publicPath, "404.ejs");

const notFoundTemplate = await Deno.readTextFile(notFoundTemplatePath);

export async function initRoutes(app: Express, dir: string) {
    app.use(express.static(join(Deno.cwd(), "public/assets")));

    const routesDir = join(Deno.cwd(), dir);
    const routeFiles = await readRoutes(routesDir);

    for (const filePath of routeFiles) {
        const moduleUrl = `file://${filePath}`;
        try {
            const { default: route } = await import(moduleUrl) as { default: RouteDefinition };

            if (!route || !route.url || !route.type || !route.callback) {
                console.warn(`Skipping invalid route definition in ${filePath}`);
                continue;
            }

            console.log(`Creating ${route.url} (${route.type})...`);

            const handlers: any[] = [];
            if (route.middleware && Array.isArray(route.middleware)) {
                handlers.push(...route.middleware);
            }
            handlers.push(async (req: Request, res: Response, next: NextFunction) => {
                try {
                    await route.callback(req, res, next);
                } catch (error) {
                    console.error(`Error in route ${route.url}:`, error);
                    if (!res.headersSent) {
                        res.status(500).send("Server Error");
                    }
                }
            });

            switch (route.type.toUpperCase()) {
                case "GET":
                    app.get(route.url, ...handlers);
                    break;
                case "POST":
                    app.post(route.url, ...handlers);
                    break;
                case "PUT":
                    app.put(route.url, ...handlers);
                    break;
                case "DELETE":
                    app.delete(route.url, ...handlers);
                    break;
                case "PATCH":
                    app.patch(route.url, ...handlers);
            }
        } catch (e) {
            console.error(`Error importing or processing route file ${filePath}:`, e);
        }
    }

    app.use((_, res) => {
        const templateData = {
            breakingBar: appState.breakingBar,
            featuredCategories: appState.featuredCategories,
        };

        const html = ejs.render(notFoundTemplate, templateData, {
            views: [publicPath]
        });

        res.setHeader('Content-Type', 'text/html');
        res.status(404).send(html);
    })
}
