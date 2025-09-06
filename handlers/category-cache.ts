import { Category } from "../types.ts";

const categoryById = new Map<number, Category>();
const categoryBySlug = new Map<string, Category>();

export function populateCategoryCache(categories: Category[]) {
    categoryById.clear();
    categoryBySlug.clear();

    for (const category of categories) {
        categoryById.set(category.id, category);
        categoryBySlug.set(category.slug, category);
    }
}

export function getCategoryById(id: number): Category | undefined {
    return categoryById.get(id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
    return categoryBySlug.get(slug);
}