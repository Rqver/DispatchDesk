# Dispatch Desk

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Dispatch Desk is a live, independent news service for New Zealand. This repository contains the complete frontend and backend codebase for our website.

We make use of high-frequency web scraping, RSS Feeds, and APIs to obtain newsworthy information, that is then passed to a LLM for categorizing and editioralizing. That codebase is open source [here](https://github.com/Rqver/DispatchDesk-Newsroom)

Visit the live site: [dispatchdesk.nz](https://dispatchdesk.nz/) • Read our [mission](https://dispatchdesk.nz/about)

## About

This repository is the living codebase for Dispatch Desk. 

While you are welcome to explore, learn from, fork and run the codebase locally, it is not intended as a turnkey solution for others to deploy.

## Tech Stack
* **Backend**: Deno v2, Typescript, Express
* **Frontend**: EJS, Tailwind CSS, Vanilla JS
* **Integrations**: Directus (CMS), Meilisearch (Search), Umami (Analytics)

## Architecture
The application is designed for performance, and to be as fast as possible with our limited infrastructure resources. The backend maintains an in-memory cache of key pages (like the home page & RSS Feeds) that are updated upon webhooks from Directus, to ensure the pages can be served instantly. Updates to the home page, live-blogs, breaking news bar, and featured categories are pushed to connected clients via WebSockets without requiring page refreshes.

## Contributing

We welcome contributions of all kinds, from bug reports to feature suggestions and pull requests.

If you're interested in adding a new feature to the website, start by making an issue to discuss it with 
me first.

### Development Setup
If you'd like to run the project locally, you will need to use Deno (v2.x or later). <br/>
You do not need a .env file to start the application. All Directus API endpoints are publicly available, and the application will gracefully disable webhooks, searching, and the popular stories module when their required env variables are not present.

