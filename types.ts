export interface Category {
    id: number
    name: string
    slug: string
}

export interface FeaturedCategories {
    category_one: Category,
    category_two: Category,
    category_three: Category,
    category_four?: Category,
    category_five?: Category
}

export interface Story {
    id: number
    title: string
    slug: string
    body: string
    tagline: string
    is_breaking: boolean
    categories: Category[]
    author: string
    ai_written?: boolean,
    original_source?: string,
    source_name?: string,
    publishDate: string
    header_media: string
    header_caption?: string,
    liveBlog?: LiveBlog
}

export interface LiveBlogEntry {
    id: number
    date_created: Date
    title: string
    entry: string
}

export interface LiveBlog {
    id: number
    date_created: Date
    name: string
    pinned_entry?: LiveBlogEntry
    entries: LiveBlogEntry[]
}

export interface FeaturedStories {
    main_story: Story
    top_story_one: Story
    secondary_story_one: Story
    secondary_story_two: Story
    secondary_story_three: Story
    special_separator_story?: Story
    additional_story_one: Story
    additional_story_two: Story
    additional_story_three: Story
    additional_story_four?: Story
    additional_story_five?: Story
    additional_story_six?: Story
}

export interface BreakingNewsBar {
    enabled: boolean;
    link: string;
    prefix: string
    headline: string;
}