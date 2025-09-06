import {load} from 'npm:cheerio'
import {getMediaMeta} from "../handlers/directus-api.ts";

export async function enrichStoryBodyWithCaptions(body: string): Promise<string> {
    const $ = load(body);
    const imgTags = $('img');

    for (const img of imgTags.toArray()) {
        const $img = $(img);
        const src = $img.attr('src');

        if (!src || !src.includes('/assets/')) continue;

        const meta = await getMediaMeta(src)
        const caption = `${meta.caption} / ${meta.source}`

        try {
            const $figure = $('<figure></figure>');
            $figure.append($img.clone());
            $figure.append(`<figcaption class="text-gray-500">${caption}</figcaption>`);
            $img.replaceWith($figure);
        } catch (e) {
            console.error(`Failed to fetch metadata for ${src}`, e);
        }
    }

    return $.html();
}