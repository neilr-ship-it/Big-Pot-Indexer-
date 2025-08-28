// Debug script for Big Pot Indexer
// Run this in the browser console on a YouTube page to test the extension

console.log('=== Big Pot Indexer Debug Script ===');

// Check if content script is loaded
if (typeof selectROI === 'function') {
    console.log('✅ Content script is loaded - selectROI function found');
} else {
    console.log('❌ Content script NOT loaded - selectROI function missing');
}

// Check if panel exists
const panel = document.getElementById('bpi-panel');
if (panel) {
    console.log('✅ Panel exists:', panel);
} else {
    console.log('❌ Panel does not exist');
}

// Check if buttons exist
const roiButton = document.getElementById('bpi-roi');
const toggleButton = document.getElementById('bpi-toggle');
const copyButton = document.getElementById('bpi-copy');

console.log('Buttons found:', {
    roiButton: roiButton ? '✅' : '❌',
    toggleButton: toggleButton ? '✅' : '❌',
    copyButton: copyButton ? '✅' : '❌'
});

// Test area selection manually
function testAreaSelection() {
    console.log('Testing area selection...');
    
    // Create a test mask
    const mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.inset = '0';
    mask.style.cursor = 'crosshair';
    mask.style.background = 'rgba(0,0,0,.3)';
    mask.style.zIndex = '999998';
    document.body.appendChild(mask);
    
    console.log('Test mask created');
    
    // Remove after 5 seconds
    setTimeout(() => {
        mask.remove();
        console.log('Test mask removed');
    }, 5000);
}

// Manual test functions
window.testBigPotIndexer = {
    testAreaSelection,
    checkPanel: () => {
        const panel = document.getElementById('bpi-panel');
        console.log('Panel:', panel);
        return panel;
    },
    createTestPanel: () => {
        const testPanel = document.createElement('div');
        testPanel.id = 'bpi-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 12px;
            z-index: 999999;
            background: rgba(20,20,20,.95);
            color: #fff;
            padding: 10px 12px;
            width: 260px;
            border-radius: 12px;
            box-shadow: 0 6px 24px rgba(0,0,0,.4);
        `;
        testPanel.innerHTML = `
            <h4>Test Panel</h4>
            <button onclick="console.log('Test button clicked')">Test Button</button>
        `;
        document.body.appendChild(testPanel);
        console.log('Test panel created');
    }
};

console.log('Debug functions available:');
console.log('- testBigPotIndexer.testAreaSelection() - Test area selection');
console.log('- testBigPotIndexer.checkPanel() - Check if panel exists');
console.log('- testBigPotIndexer.createTestPanel() - Create a test panel');

console.log('=== Debug script loaded ===');
