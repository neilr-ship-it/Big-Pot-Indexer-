# Big Pot Indexer Chrome Extension

A Chrome extension that uses OCR to detect pot sizes in poker videos and automatically timestamps big pots above a specified threshold.

## Features

- **Area Selection**: Click and drag to select the region where pot amounts are displayed
- **Real-time OCR**: Continuously monitors the selected area for pot amounts
- **Automatic Timestamping**: Records timestamps when pots exceed your threshold
- **YouTube Comment Generation**: Creates formatted comments with timestamps for easy posting

## Installation

1. **Load the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select this folder

2. **Test the Extension**:
   - Open the `test.html` file in Chrome to test the functionality
   - Or navigate to any YouTube video with poker content

## How to Use

1. **Navigate to a YouTube poker video** or open the test page
2. **Click "Select Pot Area"** and drag to select the region where pot amounts appear
3. **Set your threshold** (e.g., 100000 for $1000+ pots)
4. **Click "Start"** to begin monitoring
5. **Watch for hits** - big pots will be automatically recorded
6. **Click "Copy Comment"** to get a formatted comment for YouTube

## Debugging

### Console Logs
Open Chrome DevTools (F12) and check the console for detailed logs:
- Content script logs show UI interactions
- Background script logs show OCR processing
- OCR worker logs show text recognition results

### Common Issues

1. **"Select Pot Area" not working**:
   - Make sure you're on a YouTube page or the test page
   - Check console for any JavaScript errors
   - Try refreshing the page

2. **OCR not detecting numbers**:
   - Ensure the selected area contains clear, readable text
   - Try selecting a larger area around the pot amount
   - Check that the text has good contrast against the background

3. **Extension not starting**:
   - Check that all permissions are granted
   - Verify the manifest.json is valid
   - Look for errors in the background script console

### Testing

Use the included `test.html` file to test the extension:
- Contains simulated pot amounts that change every 3 seconds
- Perfect for testing area selection and OCR accuracy
- Check the console for detailed debugging information

## File Structure

```
big-pot-timestamps/
├── manifest.json          # Extension configuration
├── src/
│   ├── content.js         # UI and user interaction
│   ├── background.js      # OCR processing and timing
│   ├── ocr-worker.js      # Tesseract OCR worker
│   └── content.css        # Styling for the UI
├── vendor/                # Tesseract OCR libraries
│   ├── tesseract.min.js
│   ├── worker.min.js
│   └── tesseract-core.wasm
├── test.html              # Test page for debugging
└── README.md              # This file
```

## Technical Details

- **OCR Engine**: Tesseract.js for text recognition
- **Image Processing**: Canvas API for screen capture and cropping
- **Communication**: Chrome extension messaging between content and background scripts
- **Timing**: Uses video.currentTime for accurate timestamps

## Troubleshooting

If the extension still doesn't work:

1. **Check Permissions**: Ensure the extension has all required permissions
2. **Reload Extension**: Go to `chrome://extensions/` and click the reload button
3. **Clear Cache**: Clear browser cache and reload the page
4. **Check Console**: Look for any error messages in the browser console
5. **Test on Different Videos**: Try different YouTube videos to see if it's video-specific

## Contributing

Feel free to improve the extension by:
- Adding better error handling
- Improving OCR accuracy
- Adding more configuration options
- Enhancing the UI design
