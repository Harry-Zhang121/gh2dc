# GH2DC

This project uses a Cloudflare Worker to create an AI-generated summary of a GitHub repository’s README, then sends it to a Discord channel.

## Usage
1. After cloning the repository, set your environment variables (e.g., OPENROUTER_API_KEY, DISCORD_WEBHOOK_URL).
2. Run `npx wrangler dev` locally and navigate to the provided URL, appending a GitHub repo URL path.

## Example
If your Worker is deployed at "my-worker.username.workers.dev", simply visit:

## Deployment
1. Install Wrangler and configure your Cloudflare account.
2. Run `npx wrangler publish` to deploy your own version of this worker under your Cloudflare account.
