import express from "npm:express";
import { MeiliSearch } from 'npm:meilisearch';
import {config} from "../../config.ts";

const client = config.features.search ? new MeiliSearch({
    host: config.meilisearch.host!,
    apiKey: config.meilisearch.apiKey!,
}) : null;

const index = client ? client.index('stories') : null;

const jsonParser = express.json();

export default {
    url: '/api/search',
    type: 'GET',
    middleware: [jsonParser],
    callback: async (req: express.Request, res: express.Response) => {
        if (!index){
            console.warn("Search API called but Mellisearch is not enabled.");
            return res.status(503).json({error: "Search service unavailable"})
        }

        const query = req.query.q as string;
        if (!query) {
            return res.json({ hits: [] });
        }

        const sortBy = req.query.sort as string;

        try {
            const searchOptions: any = {
                limit: 8,
                attributesToHighlight: ['title', 'tagline'],
                highlightPreTag: '<mark class="bg-cyan-200/50 dark:bg-cyan-500/50 rounded">',
                highlightPostTag: '</mark>'
            };
            if (sortBy === 'publishDate:desc') {
                searchOptions.sort = ['publishDate:desc'];
            }

            const searchResult = await index.search(query, searchOptions);

            const minimalHits = searchResult.hits.map(hit => ({
                slug: hit.slug,
                title: hit._formatted?.title || hit.title,
                tagline: hit._formatted?.tagline || hit.tagline,
                header_media: hit.header_media
            }));

            res.json({ hits: minimalHits });
        } catch (error) {
            console.error("Search error:", error);
            res.status(500).json({ error: "Search service unavailable" });
        }
    }
};