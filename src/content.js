//runs inside the youtube page and injects the ui overlay onto the video page 
//acts as bridge between the user and the background logic 
//for example when we click start it will send a message to background.js 

console.log('=== Big Pot Indexer Content Script Loading ===');

let roi = null, running = false, hits = [] //roi = region of interest - screen where ocr reads pot size 
//running is whether the indexer is currently running, hits array stores timestamps and values of pots that cross threshold 

function fmtHMS(sec) {
    const t = Math.floor(sec);
    const m = Math.floor(t/60), s = t % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
}

// Function to select region of interest for OCR
function selectROI() {
    console.log('selectROI called');
    
    if (roi) {
        // Clear existing selection
        const existingRect = document.querySelector('.bpi-rect');
        if (existingRect) existingRect.remove();
        roi = null;
        document.getElementById('bpi-roi').textContent = 'Select Pot Area';
        return;
    }

    console.log('Creating selection mask');
    const mask = document.createElement('div');
    mask.className = 'bpi-mask';
    document.body.appendChild(mask);

    let startX, startY, isSelecting = false;
    let rect = null;

    function createRect(x, y, w, h) {
        if (rect) rect.remove();
        rect = document.createElement('div');
        rect.className = 'bpi-rect';
        rect.style.left = x + 'px';
        rect.style.top = y + 'px';
        rect.style.width = w + 'px';
        rect.style.height = h + 'px';
        document.body.appendChild(rect);
    }

    mask.onmousedown = (e) => {
        console.log('Mouse down:', e.clientX, e.clientY);
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        createRect(startX, startY, 0, 0);
    };

    mask.onmousemove = (e) => {
        if (!isSelecting) return;
        const w = e.clientX - startX;
        const h = e.clientY - startY;
        createRect(startX, startY, w, h);
    };

    mask.onmouseup = (e) => {
        console.log('Mouse up:', e.clientX, e.clientY);
        isSelecting = false;
        const w = e.clientX - startX;
        const h = e.clientY - startY;
        
        if (Math.abs(w) > 10 && Math.abs(h) > 10) {
            roi = {
                x: Math.min(startX, e.clientX),
                y: Math.min(startY, e.clientY),
                w: Math.abs(w),
                h: Math.abs(h)
            };
            
            document.getElementById('bpi-roi').textContent = 'Clear Selection';
            document.getElementById('bpi-reading').textContent = 'Area selected!';
            
            console.log('ROI selected:', roi);
        }
        
        mask.remove();
        if (rect) rect.remove();
    };

    mask.onclick = (e) => {
        if (e.target === mask) {
            mask.remove();
            if (rect) rect.remove();
        }
    };
}

// Wait for DOM to be ready before creating the panel
function initializeExtension() {
    console.log('=== Initializing Big Pot Indexer ===');
    
    // Check if panel already exists
    if (document.getElementById('bpi-panel')) {
        console.log('Panel already exists, removing...');
        document.getElementById('bpi-panel').remove();
    }

    //panel ui creation 
    const panel = document.createElement('div') //creates floating control panel on yt page
    panel.id = 'bpi-panel';
    panel.innerHTML = `
      <h4>Big Pot Indexer</h4>
      <label>Threshold ($): <input id="bpi-threshold" type="number" value="2000"></label>
      <button id="bpi-roi">Select Pot Area</button>
      <button id="bpi-toggle">Start</button>
      <div>Reading: <span id="bpi-reading">--</span></div>
      <div>Current Pot: <span id="bpi-current-pot">--</span></div>
      <ul id="bpi-hits"></ul>
      <button id="bpi-copy" style="display:none">Copy Comment</button>
    `;
    document.body.appendChild(panel);
    
    console.log('Panel created, setting up event handlers...');

    // Event handlers
    const roiButton = document.getElementById('bpi-roi');
    const toggleButton = document.getElementById('bpi-toggle');
    const copyButton = document.getElementById('bpi-copy');
    
    console.log('Found buttons:', { roiButton, toggleButton, copyButton });
    
    if (roiButton) {
        roiButton.onclick = () => {
            console.log('ROI button clicked');
            selectROI();
        };
        console.log('ROI button handler set');
    } else {
        console.error('ROI button not found!');
    }
    
    if (toggleButton) {
        toggleButton.onclick = () => {
            console.log('Toggle button clicked');
            if (!running) start(); else stop();
        };
        console.log('Toggle button handler set');
    } else {
        console.error('Toggle button not found!');
    }
    
    if (copyButton) {
        copyButton.onclick = () => {
            console.log('Copy button clicked');
            copyComment();
        };
        console.log('Copy button handler set');
    } else {
        console.error('Copy button not found!');
    }
    
    console.log('=== Extension initialization complete ===');
}

function start() {
  if (!roi) {
    alert('Please select a pot area first!');
    return;
  }
  
  const threshold = Number(document.getElementById('bpi-threshold').value) * 100;
  console.log('Starting with ROI:', roi, 'Threshold:', threshold);
  
  chrome.runtime.sendMessage({ type: 'START', roi, threshold }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error starting:', chrome.runtime.lastError);
      alert('Error starting: ' + chrome.runtime.lastError.message);
      return;
    }
    running = true;
    document.getElementById('bpi-toggle').innerText = "Stop";
    document.getElementById('bpi-reading').textContent = "Running...";
    document.getElementById('bpi-current-pot').textContent = "Monitoring...";
  });
}

function stop() {
  chrome.runtime.sendMessage({ type: 'STOP' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error stopping:', chrome.runtime.lastError);
    }
    running = false;
    document.getElementById('bpi-toggle').innerText = "Start";
    document.getElementById('bpi-copy').style.display = "block";
    document.getElementById('bpi-reading').textContent = "Stopped";
    document.getElementById('bpi-current-pot').textContent = "--";
  });
}

function copyComment() {
  if (hits.length === 0) {
    alert('No big pots detected yet!');
    return;
  }
  
  const lines = hits.map(h => `${fmtHMS(h.time)} – $${(h.value/100).toLocaleString()}`);
  const text = `🔥 ${document.getElementById('bpi-threshold').value}+ pots:\n` + lines.join("\n");
  
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard. Please copy manually:\n\n' + text);
  });
}

// Receive updates
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Received message:', msg);
  
  if (msg.type === 'LIVE') {
    document.getElementById('bpi-reading').textContent = `$${(msg.value/100).toLocaleString()}`;
  }
  if (msg.type === 'HIT') {
    hits.push(msg.hit);
    const li = document.createElement('li');
    li.textContent = `${fmtHMS(msg.hit.time)} – $${(msg.hit.value/100).toLocaleString()}`;
    document.getElementById('bpi-hits').appendChild(li);
    console.log('Big pot recorded:', msg.hit);
  }
  if (msg.type === 'ERROR') {
    console.error('Background error:', msg.error);
    document.getElementById('bpi-reading').textContent = `Error: ${msg.error}`;
  }
  if (msg.type === 'POT_UPDATE') {
    document.getElementById('bpi-current-pot').textContent = `$${(msg.value/100).toLocaleString()}`;
  }
});

// Multiple initialization attempts to ensure it loads
console.log('Setting up initialization...');

// Initialize immediately if possible
initializeExtension();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired');
        initializeExtension();
    });
}

// Initialize after a short delay to ensure YouTube's dynamic content is loaded
setTimeout(() => {
    console.log('Delayed initialization');
    initializeExtension();
}, 1000);

// Initialize after a longer delay as backup
setTimeout(() => {
    console.log('Backup initialization');
    initializeExtension();
}, 3000);

// Debug: Log when content script loads
console.log('=== Big Pot Indexer content script loaded ===');
