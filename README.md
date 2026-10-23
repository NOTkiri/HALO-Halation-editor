# HALO — Halation Editor

A static, browser-based halation editor with an optional Netlify Function for shared presets. Image processing and image export happen locally in the browser; photo pixels are not uploaded to the backend.

## Features

- Retro arcade UI, responsive layout, preview and original comparison
- Highlight threshold, selection transition, feather radius
- Adaptive multicolour glow or a selected/custom tint
- Centered aspect-ratio crop and PNG export
- Presets saved locally in the browser
- Optional shared presets stored persistently with Netlify Blobs

## Run locally

The editor works by opening `index.html` directly, but shared presets require the Netlify runtime. To test the complete project:

1. Install Node.js (current LTS) and Git.
2. In this folder run `npm install`.
3. Install Netlify CLI if needed: `npm install -g netlify-cli`.
4. Run `netlify dev` and open the local URL it prints.

The Netlify Blobs store is provisioned automatically by Netlify for deployed functions. Local development may require Netlify CLI login/linking so the function has a local Blobs context.

## Deploy to GitHub + Netlify

1. Create a new GitHub repository named `halo-halation-editor` (public or private).
2. Put all files in this folder at the repository root and push them to the default branch.
3. In Netlify, choose **Add new site → Import an existing project**, connect GitHub, and select the repository.
4. Build settings should use publish directory `.` and functions directory `netlify/functions`; `netlify.toml` already sets these. No build command is needed.
5. Deploy. Open the deployed site and save a preset; shared presets should sync between browsers when the function and Blobs storage are available.

## Backend API

- `GET /.netlify/functions/presets` → `{ "presets": { ... } }`
- `POST /.netlify/functions/presets` with JSON `{ "name": "Night Bloom", "preset": { ...settings } }`

The frontend uses `/.netlify/functions/presets` already. The function validates values and stores shared presets in Netlify Blobs. Shared presets are intentionally public: anyone who can reach the site can add or replace a preset name. Do not use this public endpoint for secrets or private data. For a public hobby demo, keep personal presets in browser storage; for a public production app, add authentication and rate limiting before enabling writes.

## Notes / limitations

- This is not a server-side image editor: the API stores preset settings only, never images.
- Local presets remain in that browser's localStorage. Shared presets are merged into the local preset list when the API is available.
- Image export is constrained by browser canvas memory and device limits.
- The crop is centered for the selected aspect ratio; it is not a draggable freeform crop.
