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
	const element = document.getElementById('responsive-text');
	const debugOverlay = document.getElementById('debug-overlay');
	const parent = element.parentElement;
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

	// Decrease font size until it fits within the container
	while (element.scrollWidth > parentWidth || element.scrollHeight > parentHeight) {
		fontSize--;
		element.style.fontSize = fontSize + 'px';
	}

	// Set the font size
	element.style.fontSize = fontSize + 'px';

	// Restore cursor position
	restoreCursorPosition(element, cursorPosition);

	// Update debug overlay
	debugOverlay.textContent = `Font Size: ${fontSize}px`;
}


function clearText() {
	const element = document.getElementById('responsive-text');
	text = element.innerText.trim();
	if (text != '') {
		textHistory.push(text);
		saveTextHistory();
		console.log('Text history saved:', text);
	}
	element.innerText = ' ';
	element.focus();
}



function saveTextHistory() {
	localStorage.setItem('textHistory', JSON.stringify(textHistory));
}

function loadTextHistory() {
	const storedHistory = localStorage.getItem('textHistory');
    if (storedHistory) {
		textHistory = JSON.parse(storedHistory);
    } else {
		textHistory = [];
    }
}



if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('sw.js')
		.then(registration => {
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		})
		.catch(error => {
			console.log('ServiceWorker registration failed: ', error);
		});
    });
}

window.addEventListener('resize', adjustFontSize);
window.addEventListener('load', () => {
	adjustFontSize();
	document.getElementById('responsive-text').focus();
});
document.getElementById('responsive-text').addEventListener('input', adjustFontSize);
document.getElementById('clear-button').addEventListener('click', clearText);
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		clearText();

	}
})
window.addEventListener('load', loadTextHistory);