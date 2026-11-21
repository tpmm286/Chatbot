<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/964bec47-3694-45db-9c77-d6defed315de

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Project Workspace (ZIP / local folder)

The app includes a first-stage project workspace:
- Use the **Project** button in the chat header.
- Import a ZIP archive or select a local folder.
- Browse, read, and edit text files in a temporary server-side workspace.
- Export a JSON backup of the workspace.

Workspace data is stored under the operating system temporary directory. The selected local folder is uploaded as a copy; edits do not directly change the original local folder. Sensitive environment and key files are excluded. This workspace layer does not yet provide autonomous terminal execution, browser automation, or AI-driven tool calling.
