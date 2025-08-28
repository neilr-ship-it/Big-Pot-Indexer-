// src/ocr-worker.js
importScripts(
  self.chrome?.runtime?.getURL('vendor/tesseract.min.js'),
  self.chrome?.runtime?.getURL('vendor/tesseract.worker.min.js')
);

onmessage = async (e) => {
  const { imageData } = e.data;

  // Optional quick binarize pass improves OCR on HUD text
  const bin = imageData; // keep simple for MVP; add thresholding later

  const { data } = await Tesseract.recognize(bin, 'eng', {
    tessedit_char_whitelist: '0123456789$€,.'
  });

  // Extract first plausible money-like token
  const m = (data.text || '').match(/[$€]?\s*([\d]{1,3}(?:[,\.\s]\d{3})+|\d+)/);
  const value = m ? parseInt(m[1].replace(/[^\d]/g,''),10) * 100 : 0;

  postMessage({ value });
};
