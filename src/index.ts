/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from "openai";

const prompt = "Create a very short summary in Chinese of the README.md file below. The summary should be 4-5 sentences long. The README.md file is as follows:";

async function getReadmeSummary(readme: string, myApiKey: string): Promise<string> {
	const openai = new OpenAI({
	apiKey: myApiKey,
	baseURL: "https://gateway.ai.cloudflare.com/v1/179811dd23f9639652f7652501580891/cloudflare_ai_gateway/openrouter"
	});

	const chatCompletion = await openai.chat.completions.create({
		model: "google/gemini-2.0-flash-exp:free",
		messages: [{ role: "user", content: prompt + "\n```\n" + readme + "\n```" }],
	});
	const response = chatCompletion.choices[0].message;
	if (!response.content) {
		throw new Error("AI response was empty");
	}
	return response.content;
}

async function sendToDiscord(repoUrl: string, summary: string, webhookUrl: string) {
	if (!webhookUrl) {
		throw new Error("Discord webhook URL is undefined");
	}

	new URL(webhookUrl);

	const payload = {
		content: `Repository URL: ${repoUrl}\nSummary: ${summary}`
	};

	const response = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error(`Failed to send message to Discord: ${response.statusText}`);
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			const repoUrl = url.pathname.slice(1);

			if (!repoUrl.startsWith('https://github.com/')) {
				return new Response('Invalid GitHub URL', { status: 400 });
			}

			const apiUrl = repoUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/refs/heads/master/README.md';
			const response = await fetch(apiUrl);

			if (!response.ok) {
				return new Response('README.md not found', { status: 404 });
			}

			//If README.md is empty, throw an error
			if (response.headers.get('Content-Length') === '0') {
				return new Response('README.md is empty', { status: 404 });
			}

			const readme = await response.text();
			if (!prompt) {
				throw new Error("AI prompt not found");
			}
			const summary = await getReadmeSummary(readme, env.OPENROUTER_API_KEY);
			await sendToDiscord(repoUrl, summary, env.DISCORD_WEBHOOK_URL);
			return new Response("Summary sent successfully", { status: 200, headers: { 'Content-Type': 'text/plain' } });
		} catch (error) {
			return new Response('Error: ' + error, { status: 500, headers: { 'Content-Type': 'text/plain' } });
		}
	}
} satisfies ExportedHandler<Env>;
