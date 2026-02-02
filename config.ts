function areAllVarsPresent(keys: string[]): boolean {
    return keys.every(key => Deno.env.get(key));
}

const meilisearchKeys = ['MEILISEARCH_HOST', 'MEILISEARCH_SECRET'];
const isMeilisearchEnabled = areAllVarsPresent(meilisearchKeys);

const umamiKeys = ['UMAMI_USERNAME', 'UMAMI_PASSWORD'];
const isUmamiEnabled = areAllVarsPresent(umamiKeys);

const webhookKeys = [ 'FEEDBACK_WEBHOOK'];
const isWebhooksEnabled = areAllVarsPresent(webhookKeys);

export const config = {
    features: {
        search: isMeilisearchEnabled,
        popularStories: isUmamiEnabled,
        contactForms: isWebhooksEnabled,
    },

    meilisearch: {
        apiKey: Deno.env.get('MEILISEARCH_SECRET'),
        host: Deno.env.get('MEILISEARCH_HOST'),
    },
    umami: {
        username: Deno.env.get('UMAMI_USERNAME'),
        password: Deno.env.get('UMAMI_PASSWORD'),
    },
    webhooks: {
        feedback: Deno.env.get('FEEDBACK_WEBHOOK'),
    },
};