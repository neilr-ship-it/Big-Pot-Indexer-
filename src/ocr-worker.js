// src/ocr-worker.js
importScripts(
  chrome.runtime.getURL('vendor/tesseract.min.js'),
  chrome.runtime.getURL('vendor/worker.min.js') // this is the OCR worker file
);

onmessage = async (e) => {
  const { imageData } = e.data;

  try {
    // Run OCR with explicit worker + core paths
    const { data } = await Tesseract.recognize(imageData, 'eng', {
      workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core.wasm'),
      tessedit_char_whitelist: '0123456789$€,.'
    });

    // Extract first plausible money-like token
    const m = (data.text || '').match(/[$€]?\s*([\d]{1,3}(?:[,\.\s]\d{3})+|\d+)/);
    const value = m ? parseInt(m[1].replace(/[^\d]/g,''), 10) * 100 : 0;

    postMessage({ value });
  } catch (err) {
    console.error('OCR error:', err);
    postMessage({ value: 0 });
  }
};
