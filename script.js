// script.js

'use strict';

// Proměnné pro vybraný prvek a panel nástrojů
let selectedElement = null;
const propertyPanel = document.getElementById('propertyPanel');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontWeightInput = document.getElementById('fontWeightInput');

// Nastavení velikosti gridu (např. 20px)
const gridSize = 20;

// Funkce pro manipulaci s přetažením
function dragMoveListener(event) {
    const target = event.target;
    let dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    let dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Zarovnání podle gridu
    dx = Math.round(dx / gridSize) * gridSize;
    dy = Math.round(dy / gridSize) * gridSize;

    target.style.transform = `translate(${dx}px, ${dy}px)`;

    target.setAttribute('data-x', dx);
    target.setAttribute('data-y', dy);
}

// Inicializace přetahovatelných prvků v toolbaru
interact('.draggable').draggable({
    inertia: true,
    autoScroll: true,
    modifiers: [
        interact.modifiers.snap({
            targets: [
                interact.snappers.grid({ x: gridSize, y: gridSize })
            ],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }]
        })
    ],
    onmove: dragMoveListener,
    onend(event) {
        event.target.style.transform = '';
        event.target.removeAttribute('data-x');
        event.target.removeAttribute('data-y');
    }
});

// Inicializace dropzóny (oblast faktury)
interact('#invoice').dropzone({
    accept: '.draggable',
    ondrop(event) {
        const type = event.relatedTarget.getAttribute('data-type');
        let element;

        if (type === 'h2') {
            element = document.createElement('h2');
            element.textContent = 'Nový nadpis';
            element.contentEditable = 'true';
        } else if (type === 'p') {
            element = document.createElement('p');
            element.textContent = 'Nový odstavec';
            element.contentEditable = 'true';
        } else if (type === 'input') {
            element = document.createElement('input');
            element.type = 'text';
            element.value = '';
        }

        element.classList.add('dropped');
        const invoiceRect = event.target.getBoundingClientRect();
        const x = event.dragEvent.clientX - invoiceRect.left - event.relatedTarget.offsetWidth / 2;
        const y = event.dragEvent.clientY - invoiceRect.top - event.relatedTarget.offsetHeight / 2;
        element.style.left = `${Math.round(x / gridSize) * gridSize}px`;
        element.style.top = `${Math.round(y / gridSize) * gridSize}px`;
        element.setAttribute('data-left', x);
        element.setAttribute('data-top', y);

        document.getElementById('invoice').appendChild(element);

        // Přidání přetahovatelnosti pro nový prvek s gridem
        interact(element).draggable({
            inertia: true,
            autoScroll: true,
            modifiers: [
                interact.modifiers.snap({
                    targets: [
                        interact.snappers.grid({ x: gridSize, y: gridSize })
                    ],
                    range: Infinity,
                    relativePoints: [{ x: 0, y: 0 }]
                })
            ],
            onmove(event) {
                const target = event.target;
                let dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                let dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                // Zarovnání podle gridu
                dx = Math.round(dx / gridSize) * gridSize;
                dy = Math.round(dy / gridSize) * gridSize;

                target.style.transform = `translate(${dx}px, ${dy}px)`;
                target.setAttribute('data-x', dx);
                target.setAttribute('data-y', dy);
            },
            onend(event) {
                const target = event.target;
                const dx = parseFloat(target.getAttribute('data-x')) || 0;
                const dy = parseFloat(target.getAttribute('data-y')) || 0;
                const left = Math.round((parseFloat(target.style.left) + dx) / gridSize) * gridSize;
                const top = Math.round((parseFloat(target.style.top) + dy) / gridSize) * gridSize;
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
                target.style.transform = 'translate(0, 0)';
                target.removeAttribute('data-x');
                target.removeAttribute('data-y');
                target.setAttribute('data-left', left);
                target.setAttribute('data-top', top);
            }
        });

        // Přidání klikacího eventu pro výběr prvku
        element.addEventListener('click', function (e) {
            e.stopPropagation();
            selectElement(element);
        });
    }
});

// Funkce pro výběr prvku a zobrazení panelu nástrojů
function selectElement(element) {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    selectedElement = element;
    selectedElement.classList.add('selected');
    showPropertyPanel();
}

// Funkce pro zobrazení panelu nástrojů
function showPropertyPanel() {
    propertyPanel.style.display = 'flex';

    const computedStyle = window.getComputedStyle(selectedElement);
    fontSizeInput.value = parseInt(computedStyle.fontSize);
    fontWeightInput.value = computedStyle.fontWeight;

    fontSizeInput.oninput = function () {
        selectedElement.style.fontSize = `${fontSizeInput.value}px`;
    };
    fontWeightInput.onchange = function () {
        selectedElement.style.fontWeight = fontWeightInput.value;
    };
}

// Skrytí panelu nástrojů při kliknutí mimo
document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropped') && !e.target.closest('#propertyPanel')) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
        }
        propertyPanel.style.display = 'none';
    }
});

// Zabránění propagace události při kliknutí na panel nástrojů
propertyPanel.addEventListener('click', function (e) {
    e.stopPropagation();
});

// Generování HTML a zobrazení ve druhé A4
document.getElementById('generate').addEventListener('click', function () {
    const htmlContent = generateHTMLFromElements();
    document.getElementById('generatedInvoice').innerHTML = htmlContent;
});

// Stažení vygenerovaného HTML
document.getElementById('download').addEventListener('click', function () {
    const htmlContent = generateHTMLFromElements();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'generated-invoice.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Náhled finální faktury ve třetí A4
document.getElementById('preview').addEventListener('click', function () {
    generatePreview();
});

// Tisk finální faktury
document.getElementById('print').addEventListener('click', function () {
    const printContents = document.getElementById('previewInvoice').innerHTML;
    const originalContents = document.body.innerHTML;
    const originalTitle = document.title;

    document.body.innerHTML = `<div id="printArea">${printContents}</div>`;
    document.title = 'Invoice';

    window.print();

    document.body.innerHTML = originalContents;
    document.title = originalTitle;

    // Znovu připojení event listenerů po tisku
    attachEventListeners();
});

// Vyčištění všech A4
document.getElementById('clear').addEventListener('click', function () {
    // Vyčištění první A4
    const invoice = document.getElementById('invoice');
    invoice.innerHTML = 'Přetáhněte prvky sem a vytvořte fakturu.';

    // Vyčištění druhé A4
    const generatedInvoice = document.getElementById('generatedInvoice');
    generatedInvoice.innerHTML = '';

    // Vyčištění třetí A4
    const previewInvoice = document.getElementById('previewInvoice');
    previewInvoice.innerHTML = '';

    // Resetování vybraného prvku a skrytí panelu
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
    }
    propertyPanel.style.display = 'none';
});

// Funkce pro znovu připojení event listenerů po tisku
function attachEventListeners() {
    // Připojení event listenerů pro tlačítka
    document.getElementById('generate').addEventListener('click', function () {
        const htmlContent = generateHTMLFromElements();
        document.getElementById('generatedInvoice').innerHTML = htmlContent;
    });

    document.getElementById('download').addEventListener('click', function () {
        const htmlContent = generateHTMLFromElements();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'generated-invoice.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('preview').addEventListener('click', function () {
        generatePreview();
    });

    document.getElementById('print').addEventListener('click', function () {
        const printContents = document.getElementById('previewInvoice').innerHTML;
        const originalContents = document.body.innerHTML;
        const originalTitle = document.title;

        document.body.innerHTML = `<div id="printArea">${printContents}</div>`;
        document.title = 'Invoice';

        window.print();

        document.body.innerHTML = originalContents;
        document.title = originalTitle;

        // Znovu připojení event listenerů po tisku
        attachEventListeners();
    });

    document.getElementById('clear').addEventListener('click', function () {
        // Vyčištění všech A4
        const invoice = document.getElementById('invoice');
        invoice.innerHTML = 'Přetáhněte prvky sem a vytvořte fakturu.';

        const generatedInvoice = document.getElementById('generatedInvoice');
        generatedInvoice.innerHTML = '';

        const previewInvoice = document.getElementById('previewInvoice');
        previewInvoice.innerHTML = '';

        // Resetování vybraného prvku a skrytí panelu
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
        }
        propertyPanel.style.display = 'none';
    });

    // Připojení drag-and-drop funkcionality
    interact('.draggable').draggable({
        inertia: true,
        autoScroll: true,
        onmove: dragMoveListener,
        onend(event) {
            event.target.style.transform = '';
            event.target.removeAttribute('data-x');
            event.target.removeAttribute('data-y');
        }
    });

    interact('#invoice').dropzone({
        accept: '.draggable',
        ondrop(event) {
            // Stejný kód jako předtím pro přidání prvku
            // ...
        }
    });
}

// Funkce pro generování HTML z prvků na faktuře
function generateHTMLFromElements() {
    const elements = document.querySelectorAll('#invoice .dropped');
    const invoice = document.getElementById('invoice');

    let htmlContent = `<div style="position: relative; width: ${invoice.offsetWidth}px; height: ${invoice.offsetHeight}px; background-color: white; box-sizing: border-box;">\n`;

    elements.forEach(element => {
        const type = element.tagName.toLowerCase();
        const left = parseFloat(element.style.left);
        const top = parseFloat(element.style.top);
        const content = type === 'input' ? '' : element.innerHTML;
        const styles = window.getComputedStyle(element);
        const fontSize = styles.fontSize;
        const fontWeight = styles.fontWeight;

        const style = `position:absolute; left:${left}px; top:${top}px; font-size:${fontSize}; font-weight:${fontWeight}; white-space: pre;`;

        if (type === 'input') {
            const value = element.value || '';
            htmlContent += `<input type="text" value="${value}" style="${style}" />\n`;
        } else {
            htmlContent += `<${type} style="${style}">${content}</${type}>\n`;
        }
    });

    htmlContent += '</div>';
    return htmlContent;
}

// Funkce pro generování náhledu pro tisk
function generatePreview() {
    const generatedInvoice = document.getElementById('generatedInvoice');
    const clone = generatedInvoice.cloneNode(true);
    const inputs = clone.getElementsByTagName('input');

    // Nahradit všechny inputy s jejich hodnotami
    Array.from(inputs).forEach(input => {
        const p = document.createElement('p');
        p.style.cssText = input.style.cssText;
        p.textContent = input.value;
        input.parentNode.replaceChild(p, input);
    });

    // Odstranit všechny ostatní tagy kromě <p> a <h1>-<h6>
    const allowedTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    const allElements = clone.getElementsByTagName('*');

    for (let i = allElements.length - 1; i >= 0; i--) {
        const el = allElements[i];
        if (!allowedTags.includes(el.tagName)) {
            const replacement = document.createElement('p');
            replacement.style.cssText = el.style.cssText;
            replacement.innerHTML = el.innerHTML;
            el.parentNode.replaceChild(replacement, el);
        }
    }

    // Nastavit obsah třetí A4
    document.getElementById('previewInvoice').innerHTML = clone.innerHTML;
}

// Připojení event listenerů při načtení stránky
attachEventListeners();
