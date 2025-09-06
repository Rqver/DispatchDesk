import express from "npm:express";
import {broadcastUpdate} from "../../handlers/ws.ts";
import {appState} from "../../handlers/state.ts";

export default {
    url: '/api/invalidate-cache',
    type: 'POST',
    callback: async (_: express.Request, res: express.Response) => {
        res.status(200).json({message: 'Revalidation triggered'})
        const changedSlots = await appState.invalidateAndRefresh();

        if (changedSlots.length > 0) {
            broadcastUpdate({ type: 'update', slots: changedSlots });
        }
    }
};