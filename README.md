# 𝐒𝚳𝚰𝐋𝚵 𝐂𝚮𝚨𝐓 𝐁𝚯𝐓

A responsive, dark-neon AI chat website created by **𝐒𝚳𝚰𝐋𝚵 𝚳𝚯𝐃𝐙**, designed for Vercel. The browser calls `/api/chat`; the serverless function forwards the message as the `q` parameter to the supplied upstream endpoint.

## Features

- Vanilla HTML, CSS, and JavaScript frontend; Vercel Node.js function at `/api/chat`.
- Full viewport background video with dark fallback overlay.
- Responsive sidebar/drawer, chat suggestions, settings, light/dark theme.
- Browser-local conversation history, restore/delete chats, clear history, copy replies, retry failed requests.
- Input validation, timeout handling, response validation, safe basic Markdown rendering, no raw HTML rendering.
- No API key is configured or assumed. If the upstream service requires credentials or blocks requests from Vercel, its owner must provide an approved access method.

## Requirements

- Node.js 20 or newer
- npm
- A Vercel account and (for GitHub deployment) a GitHub repository

## Run locally

```bash
npm install
npx vercel login
npm run dev
```

Open the local URL printed by Vercel CLI. The AI route is `/api/chat`, not a direct browser call to the upstream host.

Syntax checks:

```bash
npm run check
```

## Deploy using GitHub

1. Create a GitHub repository named `smile-chat-bot`.
2. Upload/push all project files, including the `api` directory.
3. In Vercel, choose **Add New → Project**, import the repository, and keep the project root as the repository root.
4. Vercel should detect the Node.js function. No build command or output directory is required for this static HTML + function project.
5. Deploy, open the production URL, and send a real test message.
6. If the upstream API fails, open the Vercel project's **Logs** and inspect the function invocation. The app intentionally reports a real error instead of inventing a response.

## Deploy using Vercel CLI

```bash
npm install
npx vercel login
npx vercel link       # optional if linking an existing project
npx vercel            # preview deployment
npx vercel --prod     # production deployment
```

## API behavior and limitations

The function sends `GET https://apis.keithsite.lol/ai/copilot?q=<encoded-message>` using `URL.searchParams`. It accepts JSON or plain text and looks for common text fields (`answer`, `response`, `message`, `result`, `text`, `output`, `content`, nested `data`, or chat-style `choices`). These are compatibility fallbacks, not a claim that the endpoint's exact schema has been verified. If the provider uses another response shape, update `extractAnswer()` only after inspecting a real response.

A best-effort in-memory rate limit is included to reduce casual abuse, but serverless memory is not shared between instances and resets over time. It is **not** a global production rate limit. For a publicly shared site, use a shared rate-limit store or place the route behind an appropriate managed protection service. Do not rely on this as strong abuse prevention.

Conversation history is stored in the visitor's browser localStorage and is not synchronized across devices. The current endpoint is called with one message at a time; this implementation does not claim to send prior conversation turns as context.

The external background video and Google Fonts need network access. If the video fails, the dark overlay still provides a usable background.

## Honest verification status

The project source can be syntax-checked locally with `npm run check`. In the environment where this project was prepared, outbound DNS/network access was unavailable, so the upstream endpoint could not be reached and its live response schema could not be inspected. No Vercel deployment or production end-to-end test has been performed here. Treat a live AI response as **unverified until you deploy and send a real message**.

## Footer and contact

`© 2026 𝐒𝚳𝚰𝐋𝚵 𝐂𝚮𝚨𝐓 𝐁𝚯𝐓 — Created by 𝐒𝚳𝚰𝐋𝚵 𝚳𝚯𝐃𝐙`

- Developer WhatsApp: https://wa.me/2348020182459
- WhatsApp channel: https://whatsapp.com/channel/0029Vb794NKBadmdwkPN6i0B
