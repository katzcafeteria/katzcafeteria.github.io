const MENU_URL = 'https://pub-b82aed7f335645fb935202d919eb2526.r2.dev/menu.json';

let cart = {};
let sitePhone = '+5219994836285';

async function loadMenu() {
    try {
        const res = await fetch(MENU_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderSite(data.site);
        renderNav(data.categories);
        renderMenu(data.categories);
    } catch (e) {
        console.error('Error loading menu:', e);
        document.getElementById('menu-root').innerHTML =
            '<p style="text-align:center;padding:2rem;color:#888;">No se pudo cargar el menú. Intenta de nuevo más tarde.</p>';
    }
}

function renderSite(site) {
    if (!site) return;
    if (site.phone) sitePhone = site.phone;
    if (site.title) document.querySelector('.menu-header h1').textContent = site.title;
    if (site.eyebrow) document.querySelector('.menu-header .eyebrow').textContent = site.eyebrow;
    if (site.tagline) document.querySelector('.menu-header p:last-child').textContent = site.tagline;

    const banner = document.querySelector('.construction-banner');
    if (banner && site.construction_banner) {
        const b = site.construction_banner;
        if (b.visible) {
            banner.style.display = '';
            const strong = banner.querySelector('strong');
            const p = banner.querySelector('p');
            if (strong && b.text) strong.textContent = b.text;
            if (p && b.detail) p.textContent = b.detail;
        } else {
            banner.style.display = 'none';
        }
    }
}

function renderNav(categories) {
    const ul = document.getElementById('nav-pills');
    if (!ul) return;
    ul.innerHTML = categories.map(cat => `
        <li><a href="#${cat.id}"><i class="ph ${cat.nav_icon}"></i> ${cat.nav_label}</a></li>
    `).join('');
}

function renderMenu(categories) {
    const root = document.getElementById('menu-root');
    if (!root) return;

    const promos = categories.filter(c => c.type === 'promo');
    const col1 = categories.filter(c => c.column === 1);
    const col2 = categories.filter(c => c.column === 2);

    let html = '';
    promos.forEach(cat => { html += renderPromo(cat); });

    html += '<div class="menu-grid">';
    html += `<div class="menu-column">${col1.map(renderStandard).join('')}</div>`;
    html += `<div class="menu-column">${col2.map(renderStandard).join('')}</div>`;
    html += '</div>';

    root.innerHTML = html;
}

function renderPromo(cat) {
    const item = (cat.items || []).find(i => i.available);
    const title = item ? escHtml(item.name) : '¡Consulta en barra!';
    const price = item ? `$${item.price}` : '--';
    const desc = item ? escHtml(item.description) : 'Despertando al michi de las promos... 🐱';
    const btnStyle = item ? '' : 'display:none';
    const btnOnclick = item
        ? `onclick="addToCart('PROMO: ${escAttr(item.name)}', ${item.price})"`
        : '';

    return `
        <section id="${cat.id}" class="promo-day">
            <div class="promo-day__image">
                <div class="promo-day__image-placeholder"><i class="ph ph-tag"></i></div>
            </div>
            <div class="promo-day__content">
                <p class="promo-day__label">${escHtml(cat.label || 'Promoción del día')}</p>
                <h2>${title}</h2>
                <p class="promo-price">${price}</p>
                <p style="margin-bottom:1.2rem;">${desc}</p>
                <button class="add-btn-large" style="${btnStyle}" ${btnOnclick}>
                    <i class="ph ph-plus-bold"></i> Agregar a mi orden
                </button>
                ${cat.note ? `<p class="category-note">${escHtml(cat.note)}</p>` : ''}
            </div>
        </section>`;
}

function renderStandard(cat) {
    const availableItems = (cat.items || []).filter(i => i.available);

    let itemsHtml;
    if (availableItems.length === 0) {
        const fallback = cat.fallback_text || 'Sin artículos disponibles por el momento.';
        itemsHtml = `<p class="item-desc">${escHtml(fallback)}</p>`;
    } else {
        itemsHtml = `<ul class="combo-list">${availableItems.map(renderItem).join('')}</ul>`;
    }

    const noteHtml = cat.note
        ? `<p class="category-note">${escHtml(cat.note)}</p>`
        : '';
    const footnoteHtml = cat.footnote
        ? `<div class="combo-footnotes"><p>${escHtml(cat.footnote)}</p></div>`
        : '';

    return `
        <section id="${cat.id}" class="menu-category">
            <div class="category-banner">
                <div class="cat-icon"><i class="ph ${cat.nav_icon}"></i></div>
                <div>
                    <h2>${escHtml(cat.title)}</h2>
                    ${noteHtml}
                </div>
            </div>
            ${itemsHtml}
            ${footnoteHtml}
        </section>`;
}

function renderItem(item) {
    if (item.sizes) return renderSizedItem(item);

    const cartName = escAttr(item.name);
    return `
        <li class="combo-item">
            <div class="item-header">
                <span class="item-name">${escHtml(item.name)}</span>
                <span class="item-price">$${item.price}</span>
                <button class="add-btn" onclick="addToCart('${cartName}', ${item.price})">
                    <i class="ph ph-plus"></i>
                </button>
            </div>
            ${item.description ? `<p class="item-desc">${escHtml(item.description)}</p>` : ''}
        </li>`;
}

function renderSizedItem(item) {
    const sizeBtns = item.sizes.map(s =>
        `<button class="size-btn" onclick="addToCart('${escAttr(item.name)} (${s.label})', ${s.price})">${s.label} $${s.price} <i class="ph ph-plus"></i></button>`
    ).join('');

    return `
        <li class="combo-item">
            <div class="item-header">
                <span class="item-name">${escHtml(item.name)}</span>
            </div>
            ${item.description ? `<p class="item-desc">${escHtml(item.description)}</p>` : ''}
            <div class="item-sizes">${sizeBtns}</div>
        </li>`;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escAttr(str) {
    return String(str).replace(/'/g, "\\'");
}

function addToCart(name, price) {
    let cleanPrice = typeof price === 'string' ? parseInt(price.replace(/[^0-9]/g, '')) : price;
    if (isNaN(cleanPrice)) cleanPrice = 0;
    if (!cart[name]) cart[name] = { qty: 0, price: cleanPrice };
    cart[name].qty++;
    updateCartUI();
}

function changeQty(name, delta) {
    if (cart[name]) {
        cart[name].qty += delta;
        if (cart[name].qty <= 0) delete cart[name];
        updateCartUI();
    }
}

function updateCartUI() {
    let subtotal = 0;
    let count = 0;
    const modalContainer = document.getElementById('cart-items-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = '';

    for (const item in cart) {
        const qty = cart[item].qty;
        const price = cart[item].price;
        subtotal += qty * price;
        count += qty;

        modalContainer.innerHTML += `
            <div class="cart-row">
                <div class="cart-row-info">
                    <span class="cart-row-name">${escHtml(item)}</span>
                    <span class="cart-row-price">$${price * qty}</span>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty('${escAttr(item)}', -1)"><i class="ph ph-minus"></i></button>
                    <span class="qty-number">${qty}</span>
                    <button class="qty-btn" onclick="changeQty('${escAttr(item)}', 1)"><i class="ph ph-plus"></i></button>
                </div>
            </div>`;
    }

    document.getElementById('trigger-subtotal').innerText = `$${subtotal.toLocaleString()}`;
    document.getElementById('modal-subtotal').innerText = `$${subtotal.toLocaleString()}`;
    document.getElementById('trigger-count').innerText = `${count} platillos`;

    const trigger = document.getElementById('cart-trigger');
    const modal = document.getElementById('cart-modal');
    if (count > 0) {
        trigger.classList.add('active');
    } else {
        trigger.classList.remove('active');
        if (modal) modal.classList.remove('active');
    }
}

function toggleModal() {
    const modal = document.getElementById('cart-modal');
    if (modal && Object.keys(cart).length > 0) {
        modal.classList.toggle('active');
    }
}

function sendWhatsApp() {
    let message = '¡Hola Katz Café! 👋 Quisiera hacer el siguiente pedido:\n\n';
    let subtotal = 0;

    for (const item in cart) {
        const qty = cart[item].qty;
        const price = cart[item].price;
        message += `*${qty}x* ${item} _($${price * qty})_\n`;
        subtotal += qty * price;
    }

    message += `\n*Subtotal: $${subtotal.toLocaleString()}*`;
    message += `\n_(Por favor, confírmame el costo de envío a mi domicilio)_`;

    window.open(`https://wa.me/${sitePhone}?text=${encodeURIComponent(message)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();

    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.addEventListener('click', function (e) {
            if (e.target === this) toggleModal();
        });
    }
});
