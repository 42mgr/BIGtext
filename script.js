// Constants
const ELEMENT_ID = 'responsive-text';
const DEBUG_OVERLAY_ID = 'debug-overlay';
const HISTORY_BUTTON_ID = 'history-button';
const CLEAR_BUTTON_ID = 'clear-button';
const CONTENT_DIV_ID = 'content';
const SERVICE_WORKER_PATH = 'sw.js';

// Variables
let textHistory = [];
let currentPage = 'main';
let previousContent = '';

// Utility Functions
function getElementById(id) {
    return document.getElementById(id);
}

function saveCursorPosition(element) {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    }
    return 0;
}

function restoreCursorPosition(element, position) {
    const sel = window.getSelection();
    const range = document.createRange();
    let currentPos = 0;
    let found = false;

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (currentPos + node.length >= position) {
                range.setStart(node, position - currentPos);
                found = true;
                return;
            }
            currentPos += node.length;
        } else {
            for (let child of node.childNodes) {
                traverseNodes(child);
                if (found) return;
            }
        }
    }

    traverseNodes(element);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function adjustFontSize() {
    const element = document.getElementById(ELEMENT_ID);
    const debugOverlay = document.getElementById(DEBUG_OVERLAY_ID);
    
    if (!element) return; // Check if the element exists
    
    const parent = element.parentElement?.parentElement;
    
    if (!parent) return; // Check if the parent element exists
    
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    let fontSize = 1000; // Start with a large font size
    element.style.fontSize = fontSize + 'px';

    // Save cursor position
    const cursorPosition = saveCursorPosition(element);

    // Preserve only manually entered line breaks
    const lines = element.textContent.split('\n');
    const text = lines.join('\n');
    element.textContent = text;

    function adjust() {
        // Decrease font size until it fits within the container
        if (element.scrollWidth > parentWidth || element.scrollHeight > parentHeight) {
            fontSize--;
            element.style.fontSize = fontSize + 'px';

            // Continue adjustment on the next animation frame
            requestAnimationFrame(adjust);
        } else {
            // Restore cursor position once the adjustment is done
            restoreCursorPosition(element, cursorPosition);
            
            // Optionally update debug overlay
            if (debugOverlay) {
                debugOverlay.textContent = `Font Size: ${fontSize}px`;
            }
        }
    }

    // Start the adjustment process
    requestAnimationFrame(adjust);
}

// Optional: Debounce if you're calling adjustFontSize frequently (e.g., on resize)
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Usage: 
// window.addEventListener('resize', debounce(adjustFontSize, 100));

function clearText() {
    const element = getElementById(ELEMENT_ID);
    const text = element?.innerText?.trim() ?? '';
    if (text != '') {
        console.log('Text cleared:', text);
        textHistory.push(text);
        saveTextHistory();
        console.log('Text history saved:', text);
    }
    if (element) {
        element.innerText = '';
        element.focus();
    }
}

function saveTextHistory() {
    textHistory = textHistory.slice(-20);  // Keep only the last 20 entries
    localStorage.setItem('textHistory', JSON.stringify(textHistory));
    console.log(textHistory);
    const historyBtn = getElementById(HISTORY_BUTTON_ID);
            if (textHistory.length === 0) {
                historyBtn.style.display = 'none';
            } else {
                historyBtn.style.display = 'block';
            }        const clearBtn = getElementById(CLEAR_BUTTON_ID);
}

function loadTextHistory() {
    const storedHistory = localStorage.getItem('textHistory');
    textHistory = storedHistory ? JSON.parse(storedHistory) : [];
    const historyBtn = getElementById(HISTORY_BUTTON_ID);
            if (textHistory.length === 0) {
                historyBtn.style.display = 'none';
            } else {
                historyBtn.style.display = 'block';
            }        const clearBtn = getElementById(CLEAR_BUTTON_ID);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(SERVICE_WORKER_PATH)
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
}

function renderMainContent(selectedText) {
    console.log("renderMainContent()")
    currentPage = 'main';
    const contentDiv = getElementById(CONTENT_DIV_ID);
    if (contentDiv) {
        contentDiv.innerHTML = previousContent;

        const historyBtn = getElementById(HISTORY_BUTTON_ID);
        const responsiveText = getElementById(ELEMENT_ID);

        addEventListeners();

        if (typeof selectedText === 'string') {
            selectedText = selectedText.trim();
            responsiveText.textContent = selectedText;
            adjustFontSize();
        }

        responsiveText.focus();
        const textLength = responsiveText.textContent.length;
        const range = document.createRange();
        const selection = window.getSelection();
            if (responsiveText.firstChild) {
                range.setStart(responsiveText.firstChild, textLength);
            } else {
                range.setStart(responsiveText, 0);
            }        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function renderHistoryPage() {
    console.log("renderHistoryPage()")
    currentPage = 'history';
    const contentDiv = getElementById(CONTENT_DIV_ID);
    if (contentDiv) {
        previousContent = contentDiv.innerHTML;
        contentDiv.innerHTML = `
        <div class="fullscreen-scrollable-list">
            <button id="back-button">Back</button>
            <div class="entry-container">
                ${textHistory.slice().reverse().map(text => `
                    <div class="entry">
                        ${text.split('\n').map(line => `<div>${line}</div>`).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
        `;
        document.getElementById('back-button').addEventListener('click', renderMainContent);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                renderMainContent();
            }
        });

        const entryContainer = contentDiv.querySelector('.entry-container');
        entryContainer.addEventListener('click', (event) => {
            const clickedEntry = event.target.closest('.entry');
            if (clickedEntry) {
                console.log(clickedEntry.textContent);
                renderMainContent(clickedEntry.textContent);
            }
        });
    }
}

function addEventListeners() {
    console.log(textHistory.length);
    const historyBtn = getElementById(HISTORY_BUTTON_ID);
    const clearBtn = getElementById(CLEAR_BUTTON_ID);
    const responsiveText = getElementById(ELEMENT_ID);


    // Support both click and touch events for the history button
    historyBtn.addEventListener('click', renderHistoryPage);
    historyBtn.addEventListener('touchstart', renderHistoryPage);

    // Support both click and touch events for the clear button
    clearBtn.addEventListener('click', clearText);
    clearBtn.addEventListener('touchstart', clearText);

    window.addEventListener('resize', adjustFontSize);
    window.addEventListener('load', () => {
        adjustFontSize();
        responsiveText.focus();
    });
    responsiveText.addEventListener('input', adjustFontSize);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            clearText();
        }
    });

    window.addEventListener('load', () => {
        document.addEventListener('click', (event) => {
            if (responsiveText.textContent === '') {
                if (event.target !== historyBtn) {
                    clearText();
                }
            }
        });
    });
}

// Initialization
(function init() {
    loadTextHistory();
    registerServiceWorker();
    addEventListeners();
})();
