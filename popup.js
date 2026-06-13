const SUPPORT_URL = 'https://buymeacoffee.com/ivomartins';

const saveBtn = document.getElementById('saveBtn');
const copyBtn = document.getElementById('copyBtn');
const statusEl = document.getElementById('status');
const supportLink = document.getElementById('supportLink');

initPopup();

function initPopup() {
  restoreImagePreference();

  document.querySelectorAll('input[name="imgOpt"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      chrome.storage.local.set({ imageOption: getSelectedImageOption() });
    });
  });

  saveBtn.addEventListener('click', handleDownload);
  copyBtn.addEventListener('click', handleCopy);
  supportLink.addEventListener('click', (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: SUPPORT_URL });
  });
}

async function restoreImagePreference() {
  try {
    const { imageOption = 'url' } = await chrome.storage.local.get('imageOption');
    const savedOption = document.querySelector(`input[name="imgOpt"][value="${imageOption}"]`);
    if (savedOption) {
      savedOption.checked = true;
    }
  } catch (err) {
    console.warn('Could not restore image preference:', err);
  }
}

async function handleDownload() {
  const imageOption = getSelectedImageOption();
  await chrome.storage.local.set({ imageOption });
  await runWithBusyState(async () => {
    setStatus('Converting page...');
    const data = await convertActiveTab(imageOption);

    setStatus('Preparing download...');
    if (imageOption === 'zip') {
      const result = await createZipAndDownload(data);
      const imageSummary = result.totalImages
        ? ` ${result.downloadedImages} of ${result.totalImages} images bundled.`
        : ' No images found.';
      setStatus(`Saved ZIP.${imageSummary}`);
    } else {
      await downloadMarkdown(data.markdown, data.fileBase);
      setStatus('Saved Markdown with source URLs.');
    }
  });
}

async function handleCopy() {
  await runWithBusyState(async () => {
    setStatus('Converting page...');
    const data = await convertActiveTab('url');
    await navigator.clipboard.writeText(data.markdown);
    setStatus('Copied Markdown with source URLs.');
  });
}

async function runWithBusyState(task) {
  saveBtn.disabled = true;
  copyBtn.disabled = true;

  try {
    await task();
  } catch (err) {
    setStatus(`Error: ${friendlyErrorMessage(err)}`);
    console.error('Full Error Object:', err);
  } finally {
    saveBtn.disabled = false;
    copyBtn.disabled = false;
  }
}

async function convertActiveTab(imageOption) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error('No active tab found.');
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['./lib/Readability.js', './lib/turndown.js']
  });

  const capturedDate = formatLocalDate(new Date());
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: processPageInsideTab,
    args: [imageOption, capturedDate]
  });

  if (!results || !results[0] || !results[0].result) {
    throw new Error('The conversion script returned no data.');
  }

  const data = results[0].result;
  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.markdown) {
    throw new Error('Markdown content is empty.');
  }

  return data;
}

function getSelectedImageOption() {
  return document.querySelector('input[name="imgOpt"]:checked').value;
}

function setStatus(message) {
  statusEl.innerText = message;
}

function friendlyErrorMessage(err) {
  const message = err && err.message ? err.message : String(err);
  if (message.includes('Cannot access') || message.includes('The extensions gallery cannot be scripted')) {
    return 'Chrome does not allow extensions to convert this page.';
  }

  if (message.includes('clipboard')) {
    return 'Could not copy to clipboard. Try downloading instead.';
  }

  return message;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// This function runs inside the active webpage.
function processPageInsideTab(mode, capturedDate) {
  try {
    if (typeof Readability === 'undefined') {
      return { error: 'Readability library not found on page.' };
    }

    const TurndownClass = typeof Turndown !== 'undefined'
      ? Turndown
      : (typeof TurndownService !== 'undefined' ? TurndownService : null);
    if (!TurndownClass) {
      return { error: 'Turndown library not found on page.' };
    }

    const docClone = document.cloneNode(true);
    const article = new Readability(docClone).parse();
    const contentHtml = article ? article.content : document.body.innerHTML;
    const rawTitle = (article && article.title) || document.title || document.location.hostname || 'Webpage';
    const title = String(rawTitle).replace(/\s+/g, ' ').trim() || 'Webpage';
    const sourceUrl = document.location.href;

    const turndownService = new TurndownClass({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    const imagesToDownload = [];
    let finalHtml = contentHtml;

    if (mode === 'zip') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentHtml;

      tempDiv.querySelectorAll('img').forEach((img, index) => {
        const rawSrc = img.currentSrc || img.src || img.getAttribute('src');
        const absoluteUrl = resolveUrl(rawSrc);
        if (!absoluteUrl || !absoluteUrl.startsWith('http')) {
          return;
        }

        const filename = `img_${index}.${getImageExtension(absoluteUrl)}`;
        imagesToDownload.push({ url: absoluteUrl, filename });
        img.setAttribute('src', `./images/${filename}`);
        img.removeAttribute('srcset');
      });

      finalHtml = tempDiv.innerHTML;
    }

    const contentMarkdown = turndownService.turndown(finalHtml).trim();
    const fileBase = buildFileBase(title, sourceUrl, capturedDate);
    const markdown = [
      '---',
      `title: "${escapeYaml(title)}"`,
      `source: "${escapeYaml(sourceUrl)}"`,
      `captured: "${capturedDate}"`,
      '---',
      '',
      `# ${title}`,
      '',
      contentMarkdown
    ].join('\n');

    return {
      markdown,
      title,
      sourceUrl,
      capturedDate,
      fileBase,
      images: imagesToDownload
    };
  } catch (e) {
    return { error: e.message };
  }

  function resolveUrl(value) {
    if (!value) {
      return '';
    }

    try {
      return new URL(value, document.baseURI).href;
    } catch (e) {
      return '';
    }
  }

  function getImageExtension(url) {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-z0-9]{2,4})$/i);
      return match ? match[1].toLowerCase() : 'png';
    } catch (e) {
      return 'png';
    }
  }

  function buildFileBase(titleValue, sourceValue, dateValue) {
    let slug = slugify(titleValue);
    if (!slug) {
      try {
        slug = slugify(new URL(sourceValue).hostname);
      } catch (e) {
        slug = 'webpage';
      }
    }

    return `${dateValue}_${slug.slice(0, 80)}`;
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function escapeYaml(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}

async function createZipAndDownload(data) {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library not loaded. Check if lib/jszip.js exists.');
  }

  const zip = new JSZip();
  const bundleFolder = zip.folder(data.fileBase);
  bundleFolder.file(`${data.fileBase}.md`, data.markdown);

  let downloadedImages = 0;
  const totalImages = data.images ? data.images.length : 0;

  if (totalImages > 0) {
    const imgFolder = bundleFolder.folder('images');
    for (const img of data.images) {
      try {
        const resp = await fetch(img.url);
        if (resp.ok) {
          const blob = await resp.blob();
          imgFolder.file(img.filename, blob);
          downloadedImages += 1;
        }
      } catch (e) {
        console.warn('Could not fetch image:', img.url);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  await chrome.downloads.download({ url, filename: `${data.fileBase}.zip` });

  return { downloadedImages, totalImages };
}

async function downloadMarkdown(markdown, fileBase) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({ url, filename: `${fileBase}.md` });
}
