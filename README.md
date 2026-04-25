# Web2Markdown Pro 📦

**Web2Markdown Pro** is a powerful, privacy-first Chrome extension that distills cluttered webpages into clean, portable Markdown files. Perfect for building a "Second Brain" in apps like **Obsidian, Notion, and Logseq**, it ensures you capture the content you care about—not the ads.

![Markdown Symbol](https://img.shields.io/badge/Format-Markdown-blue) ![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![License-MIT](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Features

* **Smart Content Extraction:** Uses Mozilla's **Readability.js** to identify the main article and strip away navigation bars, ads, and footers.
* **Dual Saving Modes:**
    * **🔗 Keep URLs:** Generates a single `.md` file with links to original image sources.
    * **📦 Bundle Images (ZIP):** Downloads all images from the article and packages them with your Markdown file in a organized `.zip` archive.
* **Asset Management:** Automatically re-maps image paths (e.g., `![alt](./images/img_0.png)`) for seamless local browsing.
* **Privacy First:** No servers, no tracking, and no data collection. All processing happens locally on your machine.
* **Modern Architecture:** Fully compliant with **Chrome Manifest V3 (2026)** standards.

---

## 🛠️ Installation

### For Users (Chrome Web Store)
*Coming Soon!* (Add your store link here once published).

### For Developers (Manual Install)
1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/ivomartins/web2markdown-pro.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** (toggle in the top-right corner).
4.  Click **Load unpacked** and select the project folder.

---

## 📖 How to Use

1.  Navigate to any blog post, news article, or documentation page.
2.  Click the **Web2Markdown Pro** icon in your browser toolbar.
3.  Choose your image handling preference:
    * **Only Keep URLs:** Best for quick notes and cloud-based systems.
    * **Bundle Images (ZIP):** Best for permanent archiving and offline vaults.
4.  Click **Download** and your clean Markdown is ready to go!

---

## 📁 Project Structure

```text
web2markdown-pro/
├── manifest.json       # Extension configuration
├── popup.html          # User interface
├── popup.js            # Main conversion & bundling logic
├── icons/              # Extension branding (16, 48, 128)
└── lib/                # Local bundled libraries
    ├── readability.js  # Content extraction (Mozilla)
    ├── turndown.js     # HTML to Markdown converter
    └── jszip.min.js    # ZIP generation
```

---

## 🔒 Privacy & Security

We take your data seriously. **Web2Markdown Pro** does not collect, store, or transmit any user data. 
* **No Analytics:** No Google Analytics or third-party trackers.
* **Local Execution:** Image fetching and Markdown generation occur strictly in your browser.
* **No Remote Code:** Every library used is bundled locally to prevent injection attacks.

---

## 📜 Credits & Acknowledgments

This project is built on the shoulders of giants:
* [Readability.js](https://github.com/mozilla/readability) - For the magic behind the "clean" extraction.
* [Turndown](https://github.com/mixmark-io/turndown) - For high-fidelity HTML-to-Markdown conversion.
* [JSZip](https://github.com/Stuk/jszip) - For seamless local asset bundling.

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

> **Built for the open web. Happy archiving!** 🚀
