# Web2Markdown Pro

**Web2Markdown Pro** is a privacy-first Chrome extension that turns cluttered webpages into clean, portable Markdown files. It is designed for saving articles, documentation, and research notes into tools like **Obsidian, Notion, and Logseq**.

![Markdown Symbol](https://img.shields.io/badge/Format-Markdown-blue) ![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![License-MIT](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

* **Smart content extraction:** Uses Mozilla's Readability.js to identify the main article and strip away navigation bars, ads, and footers.
* **Markdown download:** Saves a clean `.md` file with source URLs preserved.
* **Copy Markdown:** Copies the converted Markdown directly to your clipboard.
* **Image bundling:** Downloads article images and packages them with the Markdown file in an organized ZIP archive.
* **Clean archive layout:** ZIP exports use a folder structure like `article-title/article-title.md` and `article-title/images/`.
* **Useful metadata:** Adds YAML front matter with the page title, source URL, and capture date.
* **Remembered preference:** Keeps your last selected image handling mode.
* **Privacy first:** No servers, no tracking, and no data collection. All processing happens locally in your browser.

---

## Installation

### For Users

Chrome Web Store listing coming soon.

### For Developers

1. Clone the repo:
    ```bash
    git clone https://github.com/ivomartins/web2markdown-pro.git
    ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Click **Load unpacked** and select the project folder.

---

## How To Use

1. Navigate to a blog post, news article, documentation page, or other webpage.
2. Click the **Web2Markdown Pro** icon in your browser toolbar.
3. Choose your image handling preference:
    * **Keep image URLs in Markdown:** Best for quick notes and cloud-based systems.
    * **Bundle Markdown and images as ZIP:** Best for permanent archiving and offline vaults.
4. Click **Download** to save the file, or **Copy Markdown** to paste it elsewhere.

---

## Markdown Output

Exports include front matter like this:

```md
---
title: "Article Title"
source: "https://example.com/article"
captured: "2026-06-13"
---

# Article Title
```

ZIP exports use this structure:

```text
2026-06-13_article-title/
  2026-06-13_article-title.md
  images/
    img_0.jpg
    img_1.png
```

---

## Project Structure

```text
web2markdown-pro/
+-- manifest.json       # Extension configuration
+-- popup.html          # User interface
+-- popup.js            # Main conversion and bundling logic
+-- icons/              # Extension branding
`-- lib/                # Local bundled libraries
    +-- Readability.js  # Content extraction
    +-- turndown.js     # HTML to Markdown conversion
    `-- jszip.js        # ZIP generation
```

---

## Privacy & Security

Web2Markdown Pro does not collect, store, or transmit user data.

* **No analytics:** No Google Analytics or third-party trackers.
* **Local execution:** Image fetching and Markdown generation happen in your browser.
* **No remote code:** Every library used by the extension is bundled locally.

---

## Support

If Web2Markdown Pro is useful to you, you can [support development](https://buymeacoffee.com/ivomartins).

---

## Credits

This project is built with:

* [Readability.js](https://github.com/mozilla/readability)
* [Turndown](https://github.com/mixmark-io/turndown)
* [JSZip](https://github.com/Stuk/jszip)

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.
