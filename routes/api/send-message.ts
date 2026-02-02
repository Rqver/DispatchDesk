import express from "npm:express";
import {sendWebhook} from "../../util/webhook.ts";
import {config} from "../../config.ts";

const jsonParser = express.json();

export default {
    url: '/api/send-message',
    type: 'POST',
    middleware: [jsonParser],
    callback: async (req: express.Request, res: express.Response) => {
        const {type, data} = req.body;

        if (!config.features.contactForms){
            console.log("DEV: Contact form submission received. Webhooks are disabled.");
            console.log("Type: " + type + " Data: " + JSON.stringify(data));
            return res.status(200);
        }

        try {
             if (type === "feedback-form"){
                const message = `> **New Feedback/Contact Form Submission** \n-# Submitter Name: ${data.name || "Not Specified"} | Submitter Email: ${data.email || "Not Specified"}`
                await sendWebhook({content: message, fileContent: data.message}, config.webhooks.feedback);
            }

            res.status(200)
        } catch (error) {
            console.log(error)
            res.sendStatus(500);
        }
    }
};