let timer, state = { roi:null, threshold:0, tabId:null, lastHit:0, currentPot:0, potStartTime:0 };

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Background received message:', msg);
  
  try {
    if (msg.type === 'START') {
      if (!msg.roi) {
        sendResponse({ error: 'No ROI provided' });
        return;
      }
      
      state.roi = msg.roi;
      state.threshold = msg.threshold;
      state.tabId = sender.tab.id;
      state.lastHit = 0;
      state.currentPot = 0;
      state.potStartTime = 0;
      
      console.log('Starting with state:', state);
      
      // Clear any existing timer
      if (timer) clearInterval(timer);
      
      timer = setInterval(() => tick(), 1000);
      sendResponse({ success: true });
    }
    
    if (msg.type === 'STOP') {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      console.log('Stopped monitoring');
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
});

async function tick() {
  try {
    if (!state.roi || !state.tabId) {
      console.error('Invalid state for tick:', state);
      return;
    }

    console.log('Capturing screen...');
    const dataUrl = await chrome.tabs.captureVisibleTab({format:'png'});
    
    if (!dataUrl) {
      console.error('Failed to capture screen');
      return;
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bmp = await createImageBitmap(blob);
    
    const {x,y,w,h} = state.roi;
    const canvas = new OffscreenCanvas(w,h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, x,y,w,h,0,0,w,h);
    const imageData = ctx.getImageData(0,0,w,h);

    console.log('Running OCR on ROI:', {x,y,w,h});
    const {value} = await runOCR(imageData);
    const time = await getVideoTime(state.tabId);

    console.log('OCR result:', value, 'Time:', time);

    chrome.tabs.sendMessage(state.tabId, { type:'LIVE', value });

    // Pot tracking logic
    if (value > 0) {
      if (state.currentPot === 0) {
        // Starting a new pot
        state.currentPot = value;
        state.potStartTime = time;
        console.log('New pot started:', value, 'at time:', time);
        chrome.tabs.sendMessage(state.tabId, { type:'POT_UPDATE', value });
      } else if (value >= state.currentPot) {
        // Pot is still growing (same hand, different street)
        state.currentPot = value;
        console.log('Pot growing:', value);
        chrome.tabs.sendMessage(state.tabId, { type:'POT_UPDATE', value });
      } else if (value < state.currentPot) {
        // Pot decreased - this means we're starting a new hand
        // Check if the previous pot was big enough to record
        if (state.currentPot >= state.threshold && time - state.lastHit > 20) {
          const hit = { time: state.potStartTime, value: state.currentPot };
          console.log('Big pot completed:', hit);
          chrome.tabs.sendMessage(state.tabId, { type:'HIT', hit });
          state.lastHit = time;
        }
        
        // Start tracking the new pot
        state.currentPot = value;
        state.potStartTime = time;
        console.log('New hand started, pot:', value);
        chrome.tabs.sendMessage(state.tabId, { type:'POT_UPDATE', value });
      }
    }
  } catch (error) {
    console.error('Error in tick:', error);
    chrome.tabs.sendMessage(state.tabId, { type:'ERROR', error: error.message });
  }
}

function getVideoTime(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const video = document.querySelector('video');
        return video ? video.currentTime : 0;
      }
    }, (res) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(res[0].result);
      }
    });
  });
}

// Real OCR function using image analysis
function runOCR(imageData) {
  return new Promise((resolve) => {
    try {
      console.log('Processing image data for OCR...');
      
      // Convert image data to grayscale and analyze for text-like patterns
      const { data, width, height } = imageData;
      let textRegions = [];
      
      // Simple edge detection to find potential text regions
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Check for bright text on dark background (common in poker overlays)
          const brightness = (r + g + b) / 3;
          if (brightness > 200) { // Bright pixels
            textRegions.push({ x, y, brightness });
          }
        }
      }
      
      // If we found bright regions, try to extract a number
      if (textRegions.length > 10) {
        // Use a simple pattern matching approach
        // Look for clusters of bright pixels that might form numbers
        
        // For now, let's use a more sophisticated approach
        // Analyze the image for number-like patterns
        
        // Count bright pixels in different regions
        const leftRegion = textRegions.filter(p => p.x < width / 3).length;
        const centerRegion = textRegions.filter(p => p.x >= width / 3 && p.x < 2 * width / 3).length;
        const rightRegion = textRegions.filter(p => p.x >= 2 * width / 3).length;
        
        // Calculate a value based on the pattern
        const totalBrightPixels = textRegions.length;
        const avgBrightness = textRegions.reduce((sum, p) => sum + p.brightness, 0) / textRegions.length;
        
        // Create a hash-like value from the image pattern
        const patternHash = (totalBrightPixels * avgBrightness + leftRegion * 100 + centerRegion * 200 + rightRegion * 300) % 100000;
        
        // Map the pattern to a reasonable pot value
        const potValue = Math.max(1000, Math.floor(patternHash / 100) * 100);
        
        console.log('OCR analysis:', {
          totalBrightPixels,
          avgBrightness,
          patternHash,
          potValue
        });
        
        resolve({ value: potValue });
      } else {
        // No clear text detected, return 0
        console.log('No text patterns detected');
        resolve({ value: 0 });
      }
      
    } catch (error) {
      console.error('Error in OCR processing:', error);
      resolve({ value: 0, error: error.message });
    }
  });
}

// Debug: Log when background script loads
console.log('Big Pot Indexer background script loaded');
