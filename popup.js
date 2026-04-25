document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const imageOption = document.querySelector('input[name="imgOpt"]:checked').value;

  status.innerText = "Step 1: Injecting libraries...";

  try {
    // 1. Inject libraries one by one and verify they exist
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['./lib/Readability.js', './lib/turndown.js']
    });

    status.innerText = "Step 2: Converting page...";

    // 2. Execute conversion logic
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: processPageInsideTab,
      args: [imageOption]
    });

    // CHECK: Did the script return anything?
    if (!results || !results[0] || !results[0].result) {
      throw new Error("The conversion script returned no data. Make sure you are not on a protected Chrome page (like the Web Store).");
    }

    const data = results[0].result;

    // CHECK: Is the markdown content actually there?
    if (!data.markdown) {
      throw new Error("Markdown content is empty.");
    }

    status.innerText = "Step 3: Preparing download...";
    
    if (imageOption === 'zip') {
      await createZipAndDownload(data);
    } else {
      await downloadMarkdown(data.markdown, data.title);
    }

    status.innerText = "Success! File saved.";

  } catch (err) {
    status.innerText = "Error: " + err.message;
    console.error("Full Error Object:", err);
  }
});

// THIS RUNS INSIDE THE WEBPAGE
function processPageInsideTab(mode) {
  try {
    // Ensure libraries are available
    if (typeof Readability === 'undefined') return { error: "Readability library not found on page" };
    
    // Check if Turndown is available (sometimes it's TurndownService)
    const TurndownClass = typeof Turndown !== 'undefined' ? Turndown : (typeof TurndownService !== 'undefined' ? TurndownService : null);
    if (!TurndownClass) return { error: "Turndown library not found on page" };

    const docClone = document.cloneNode(true);
    let article = new Readability(docClone).parse();
    
    // Fallback if readability fails
    const contentHtml = article ? article.content : document.body.innerHTML;
    const title = article ? article.title : document.title;

    const turndownService = new TurndownClass({ 
      headingStyle: 'atx', 
      codeBlockStyle: 'fenced' 
    });

    let imagesToDownload = [];
    let finalHtml = contentHtml;

    if (mode === 'zip') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentHtml;
      const imgs = tempDiv.querySelectorAll('img');

      imgs.forEach((img, index) => {
        const src = img.src;
        if (src && src.startsWith('http')) {
          const ext = src.split('.').pop().split(/[?#]/)[0] || 'png';
          const filename = `img_${index}.${ext.length < 5 ? ext : 'png'}`;
          imagesToDownload.push({ url: src, filename: filename });
          img.setAttribute('src', `./images/${filename}`);
        }
      });
      finalHtml = tempDiv.innerHTML;
    }

    const markdown = turndownService.turndown(finalHtml);

    return { 
      markdown: `# ${title}\n\n${markdown}`, 
      title: title || "webpage", 
      images: imagesToDownload 
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function createZipAndDownload(data) {
  // Check if JSZip was loaded by the HTML script tag
  if (typeof JSZip === 'undefined') {
    throw new Error("JSZip library not loaded. Check if lib/jszip.min.js exists.");
  }

  const zip = new JSZip();
  const safeTitle = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  zip.file(`${safeTitle}.md`, data.markdown);
  
  if (data.images && data.images.length > 0) {
    const imgFolder = zip.folder("images");
    for (const img of data.images) {
      try {
        const resp = await fetch(img.url);
        if (resp.ok) {
          const blob = await resp.blob();
          imgFolder.file(img.filename, blob);
        }
      } catch (e) {
        console.warn("Could not fetch image:", img.url);
      }
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  chrome.downloads.download({ url: url, filename: `${safeTitle}.zip` });
}

function downloadMarkdown(markdown, title) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  chrome.downloads.download({ url: url, filename: filename });
}