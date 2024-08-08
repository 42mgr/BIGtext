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
	range.setStart(element.childNodes[0], position);
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

	// Decrease font size until it fits within the container
	while (element.scrollWidth > parentWidth || element.scrollHeight > parentHeight) {
		fontSize--;
		element.style.fontSize = fontSize + 'px';
	}

	// Try adding newlines to see if it results in a larger font size
	const originalText = element.innerText;
	const words = originalText.split(' ');
	let bestText = originalText;
	let bestFontSize = fontSize;

	for (let i = 1; i < words.length; i++) {
		const newText = words.slice(0, i).join(' ') + '\n' + words.slice(i).join(' ');
		element.innerText = newText;
		element.style.fontSize = fontSize + 'px';

		// Decrease font size until it fits within the container
		while (element.scrollWidth > parentWidth || element.scrollHeight > parentHeight) {
			fontSize--;
			element.style.fontSize = fontSize + 'px';
		}

		// If the new font size is larger, keep the new text
		if (fontSize > bestFontSize) {
			bestText = newText;
			bestFontSize = fontSize;
		}
	}

	// Set the best text and font size
	element.innerText = bestText;
	element.style.fontSize = bestFontSize + 'px';

	// Restore cursor position
	restoreCursorPosition(element, cursorPosition);

	// Update debug overlay
	debugOverlay.innerText = `Font Size: ${bestFontSize}px`;
}

function clearText() {
	const element = document.getElementById('responsive-text');
	element.innerText = ' ';
	element.focus();
}
window.addEventListener('resize', adjustFontSize);
window.addEventListener('load', () => {
	adjustFontSize();
	document.getElementById('responsive-text').focus();
});
document.getElementById('responsive-text').addEventListener('input', adjustFontSize);
document.getElementById('clear-button').addEventListener('click', clearText);