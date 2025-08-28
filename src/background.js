let timer, state = { roi:null, threshold:0, tabId:null, lastHit:0 };

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'START') {
    state.roi = msg.roi;
    state.threshold = msg.threshold;
    state.tabId = sender.tab.id;
    timer = setInterval(() => tick(), 1000);
  }
  if (msg.type === 'STOP') {
    clearInterval(timer);
  }
});

async function tick() {
  const dataUrl = await chrome.tabs.captureVisibleTab({format:'png'});
  const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const {x,y,w,h} = state.roi;
  const canvas = new OffscreenCanvas(w,h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, x,y,w,h,0,0,w,h);
  const imageData = ctx.getImageData(0,0,w,h);

  const {value} = await runOCR(imageData);
  const time = await getVideoTime(state.tabId);

  chrome.tabs.sendMessage(state.tabId, { type:'LIVE', value });

  if (value >= state.threshold && time - state.lastHit > 20) {
    const hit = { time, value };
    chrome.tabs.sendMessage(state.tabId, { type:'HIT', hit });
    state.lastHit = time;
  }
}

function getVideoTime(tabId) {
  return new Promise(resolve => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.querySelector('video')?.currentTime || 0
    }, res => resolve(res[0].result));
  });
}

function runOCR(imageData) {
  return new Promise(resolve => {
    const worker = new Worker(chrome.runtime.getURL("src/ocr-worker.js"));
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage({imageData});
  });
}
