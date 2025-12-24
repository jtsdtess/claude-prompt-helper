# Claude Prompt Helper

A simple Chrome Extension that adds a customizable prompt button directly into the [Claude.ai](https://claude.ai) interface. Stop switching tabs between your Google Docs and the chat!

## Features

- **Native UI:** Adds a "Prompts" button right next to the Send button in Claude.
- **Prompt Library:** Manage your favorite prompts in a clean popup interface.
- **Google Sheets Sync:** Sync your prompts from a published Google Sheet CSV.
- **Privacy First:** All data is stored locally in your browser (`chrome.storage`).

## Installation (Manual)

Since this extension is not in the Chrome Web Store yet, you need to install it manually (Developer Mode).

1.  Download this repository (Code -> Download ZIP) and unzip it.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked**.
5.  Select the folder containing this extension.
6.  Go to `claude.ai` and refresh the page!

## Usage

1.  **Add Prompts:** Click the extension icon in your browser toolbar to add/edit prompts.
2.  **Sync (Optional):**
    - Create a Google Sheet with columns: `Title`, `Prompt`.
    - Go to File -> Share -> Publish to web -> Select "Comma-separated values (.csv)".
    - Paste the link in the extension settings.
3.  **Use:** Click the **Prompts** button inside Claude's chat input.

## Contributing

Feel free to open issues or submit pull requests!
