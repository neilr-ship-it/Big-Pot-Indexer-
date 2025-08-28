// src/ocr-worker.js
// Load Tesseract scripts
importScripts(
  chrome.runtime.getURL('vendor/tesseract.min.js'),
  chrome.runtime.getURL('vendor/worker.min.js')
);

console.log('OCR Worker loaded');

onmessage = async (e) => {
  const { imageData } = e.data;
  console.log('OCR worker received imageData:', imageData);

  try {
    // Convert ImageData to canvas for Tesseract
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob for Tesseract
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    
    console.log('Running Tesseract OCR...');
    
    // Check if Tesseract is available
    if (typeof Tesseract === 'undefined') {
      throw new Error('Tesseract not loaded');
    }
    
    const { data } = await Tesseract.recognize(blob, 'eng', {
      workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core.wasm'),
      tessedit_char_whitelist: '0123456789$€,.',
      logger: m => console.log('Tesseract:', m)
    });

    console.log('OCR raw text:', data.text);

    // Try to find a money-like number
    const m = (data.text || '').match(/[$€]?\s*([\d]{1,3}(?:[,\.\s]\d{3})+|\d+)/);
    const value = m ? parseInt(m[1].replace(/[^\d]/g, ''), 10) * 100 : 0;

    console.log('Extracted value:', value);
    postMessage({ value });
  } catch (err) {
    console.error('OCR error:', err);
    postMessage({ value: 0, error: err.message });
  }
};
