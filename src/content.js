//runs inside the youtube page and injects the ui overlay onto the video page 
//acts as bridge between the user and the background logic 
//for example when we click start it will send a message to background.js 

let roi = null, running = false, hits = [] //roi = region of interest - screen where ocr reads pot size 
//running is whether the indexer is currently running, hits array stores timestamps and values of pots that cross threshold 
function fmtHMS(sec) {
    const t = Math.floor(sec);
    const m = Math.floor(t/60), s = t % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
}

//panel ui creation 
const panel = document.createElement('div') //creates floating control panel on yt page
panel.id = 'bpi-panel';
panel.innerHTML = `
  <h4>Big Pot Indexer</h4>
  <label>Threshold ($): <input id="bpi-threshold" type="number" value="100000"></label>
  <button id="bpi-roi">Select Pot Area</button>
  <button id="bpi-toggle">Start</button>
  <div>Reading: <span id="bpi-reading">--</span></div>
  <ul id="bpi-hits"></ul>
  <button id="bpi-copy" style="display:none">Copy Comment</button>
`;
document.body.appendChild(panel);
// Event handlers
document.getElementById('bpi-roi').onclick = () => selectROI();
document.getElementById('bpi-toggle').onclick = () => {
  if (!running) start(); else stop();
};
document.getElementById('bpi-copy').onclick = () => copyComment();

function start() {
  const threshold = Number(document.getElementById('bpi-threshold').value) * 100;
  chrome.runtime.sendMessage({ type: 'START', roi, threshold });
  running = true;
  document.getElementById('bpi-toggle').innerText = "Stop";
}
function stop() {
  chrome.runtime.sendMessage({ type: 'STOP' });
  running = false;
  document.getElementById('bpi-toggle').innerText = "Start";
  document.getElementById('bpi-copy').style.display = "block";
}
function copyComment() {
  const lines = hits.map(h => `${fmtHMS(h.time)} – $${(h.value/100).toLocaleString()}`);
  const text = `🔥 ${document.getElementById('bpi-threshold').value}+ pots:\n` + lines.join("\n");
  navigator.clipboard.writeText(text);
  alert("Copied to clipboard!");
}

// Receive updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'LIVE') {
    document.getElementById('bpi-reading').textContent = `$${(msg.value/100).toLocaleString()}`;
  }
  if (msg.type === 'HIT') {
    hits.push(msg.hit);
    const li = document.createElement('li');
    li.textContent = `${fmtHMS(msg.hit.time)} – $${(msg.hit.value/100).toLocaleString()}`;
    document.getElementById('bpi-hits').appendChild(li);
  }
});
