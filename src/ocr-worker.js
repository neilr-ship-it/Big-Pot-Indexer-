// src/ocr-worker.js
importScripts(
  chrome.runtime.getURL('vendor/tesseract.min.js'),
  chrome.runtime.getURL('vendor/worker.min.js')
);

onmessage = async (e) => {
  const { imageData } = e.data;

  try {
    const { data } = await Tesseract.recognize(imageData, 'eng', {
      workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core.wasm'),
      tessedit_char_whitelist: '0123456789$€,.'
    });

    // Try to find a money-like number
    const m = (data.text || '').match(/[$€]?\s*([\d]{1,3}(?:[,\.\s]\d{3})+|\d+)/);
    const value = m ? parseInt(m[1].replace(/[^\d]/g, ''), 10) * 100 : 0;

    postMessage({ value });
  } catch (err) {
    console.error('OCR error:', err);
    postMessage({ value: 0 });
  }
};
