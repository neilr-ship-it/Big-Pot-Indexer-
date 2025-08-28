importScripts('../vendor/tesseract.min.js');

onmessage = async (e) => {
  const { imageData } = e.data;
  const { data } = await Tesseract.recognize(imageData, 'eng', {
    tessedit_char_whitelist: '0123456789$,.'
  });
  const match = data.text.match(/[\d,]+/);
  const value = match ? parseInt(match[0].replace(/,/g,''),10)*100 : 0;
  postMessage({ value });
};
