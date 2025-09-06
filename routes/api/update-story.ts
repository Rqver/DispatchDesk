import express from "npm:express";
import { syncStory, deleteStoryFromSearch } from "../../handlers/search-sync.ts";
import { getStory } from "../../handlers/directus-api.ts";

const jsonParser = express.json();

export default {
    url: '/api/update-story',
    type: 'POST',
    middleware: [jsonParser],
    callback: async (req: express.Request, res: express.Response) => {
        res.status(200).json({message: 'Story Update Triggered'})
        try {
            const event = req.body.event;
            const keys = req.body.keys;

            if (!event || !keys || keys.length === 0) {
                console.warn('Webhook received an incomplete trigger event.');
                return;
            }

            const primaryKey = keys[0];

            if (event === 'stories.items.create' || event === 'stories.items.update') {
                const fullStory = await getStory(primaryKey);

                if (fullStory) {
                    await syncStory(fullStory);
                } else {
                    console.error(`Failed to fetch full data for story ID ${primaryKey}.`);
                }

            } else if (event === 'stories.items.delete') {
                await deleteStoryFromSearch(primaryKey);
            }

        } catch (error) {
            console.error('Fatal error processing story sync webhook:', error);
            console.error('Received Body:', JSON.stringify(req.body, null, 2));
        }
    }
};