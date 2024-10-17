// Setup for dragging .draggable elements
interact('.draggable').draggable({
    inertia: true,
    autoScroll: true,
    listeners: {
        move: dragMoveListener,
    }
});

function dragMoveListener(event) {
    var target = event.target;
    // Keep the dragged position in the data attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Translate the element
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    // Update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// Dropzone logic
interact('#dropzone').dropzone({
    accept: '.draggable',
    ondrop: function (event) {
        let type = event.relatedTarget.getAttribute('data-type');
        let element;

        if (type === 'h2') {
            element = document.createElement('h2');
            element.textContent = 'H2 Heading';
        } else if (type === 'p') {
            element = document.createElement('p');
            element.textContent = 'This is a paragraph.';
        } else if (type === 'input') {
            element = document.createElement('input');
            element.setAttribute('type', 'text');
        }

        // Append dropped element to dropzone
        element.classList.add('dropped');
        document.getElementById('dropzone').appendChild(element);

        // Set position where element was dropped
        let x = event.dragEvent.pageX - event.target.offsetLeft;
        let y = event.dragEvent.pageY - event.target.offsetTop;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        // Add position to element's data attributes for use in generated HTML
        element.setAttribute('data-left', x);
        element.setAttribute('data-top', y);

        // Update generated HTML after dropping the element
        updateGeneratedHTML();
        renderGeneratedHTML();
    }
});

// Generate HTML logic
document.getElementById('generate').addEventListener('click', function () {
    let htmlContent = generateHTMLFromElements();
    let blob = new Blob([htmlContent], { type: 'text/html' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'generated.html';
    link.click();
});

// Function to update displayed HTML content
function updateGeneratedHTML() {
    let htmlContent = generateHTMLFromElements();
    document.getElementById('generatedHTML').textContent = htmlContent;
}

// Function to render the HTML output directly on the page
function renderGeneratedHTML() {
    let htmlContent = generateHTMLFromElements();
    document.getElementById('renderedHTML').innerHTML = htmlContent;
}

// Function to generate HTML from dropped elements, preserving their positions
function generateHTMLFromElements() {
    const elements = document.querySelectorAll('#dropzone .dropped');
    let htmlContent = '';

    elements.forEach(element => {
        const type = element.tagName.toLowerCase();
        const left = element.getAttribute('data-left');
        const top = element.getAttribute('data-top');
        const content = element.tagName === 'INPUT' ? '' : element.textContent;

        if (type === 'input') {
            htmlContent += `<${type} type="text" style="position:absolute; left:${left}px; top:${top}px;" />\n`;
        } else {
            htmlContent += `<${type} style="position:absolute; left:${left}px; top:${top}px;">${content}</${type}>\n`;
        }
    });

    return htmlContent;
}
