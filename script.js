const sheetId = '1fhESskXdVoxUd2qJDDmtM-wzu3HQbgpQrm9_OQyUgSw'; 
const sheetName = 'Sheet1';
const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let cart = {}; 

async function initLiveContent() {
    try {
        const response = await fetch(endpoint);
        const text = await response.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const rows = json.table.rows;

        const panaderiaContainer = document.getElementById('panaderia-container');
        if(panaderiaContainer && panaderiaContainer.innerHTML === '') {
            panaderiaContainer.innerHTML = '<p class="item-desc">Pregunta en barra por la panadería disponible de hoy. <i class="ph ph-paw-print"></i></p>';
        }

        rows.forEach((row) => {
            if (!row.c || !row.c[0]) return;
            const cat = row.c[0].v;
            
            if (cat === 'Categoria') return; 

            const nombre = row.c[1]?.v;
            const precio = row.c[2]?.v;
            const desc = row.c[3]?.v || '';
            const disp = row.c[4]?.v;

            if (disp !== true && String(disp).toUpperCase() !== "TRUE") return;

            if (cat === 'Promo') {
                const titleEl = document.getElementById('promo-title');
                if(titleEl) {
                    titleEl.innerText = nombre;
                    document.getElementById('promo-price').innerText = isNaN(precio) ? precio : `$${precio}`;
                    document.getElementById('promo-desc').innerText = desc;
                    
                    const btn = document.getElementById('promo-btn');
                    btn.style.display = 'inline-flex';
                    btn.onclick = () => addToCart(`PROMO: ${nombre}`, precio);
                }
            }

            if (cat === 'Panaderia' && panaderiaContainer) {
                panaderiaContainer.innerHTML += `
                    <li class="menu-item">
                        <div class="item-header">
                            <span class="item-name">${nombre}</span>
                            <span class="item-price">$${precio}</span>
                            <button class="add-btn" onclick="addToCart('${nombre}', ${precio})"><i class="ph ph-plus"></i></button>
                        </div>
                        <p class="item-desc">${desc}</p>
                    </li>
                `;
            }
        });

        if(panaderiaContainer && panaderiaContainer.innerHTML === '') {
            panaderiaContainer.innerHTML = '<p class="item-desc">Pregunta en barra por la panadería disponible de hoy.</p>';
        }
    } catch (e) {
        console.error("Error conectando con Google Sheets:", e);
        const titleEl = document.getElementById('promo-title');
        if (titleEl) titleEl.innerText = "¡Consulta en barra!";
    }
}

function addToCart(name, price) {
    let cleanPrice = typeof price === 'string' ? parseInt(price.replace(/[^0-9]/g, "")) : price;
    if (isNaN(cleanPrice)) cleanPrice = 0;

    if (!cart[name]) { cart[name] = { qty: 0, price: cleanPrice }; }
    cart[name].qty++;
    updateCartUI();
}

function changeQty(name, delta) {
    if (cart[name]) {
        cart[name].qty += delta;
        if (cart[name].qty <= 0) { delete cart[name]; }
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
                    <span class="cart-row-name">${item}</span>
                    <span class="cart-row-price">$${price * qty}</span>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty('${item}', -1)"><i class="ph ph-minus"></i></button>
                    <span class="qty-number">${qty}</span>
                    <button class="qty-btn" onclick="changeQty('${item}', 1)"><i class="ph ph-plus"></i></button>
                </div>
            </div>
        `;
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
        if(modal) modal.classList.remove('active');
    }
}

function toggleModal() {
    const modal = document.getElementById('cart-modal');
    if (modal && Object.keys(cart).length > 0) {
        modal.classList.toggle('active');
    }
}

function sendWhatsApp() {
    const phone = "+5219994836285"; 
    let message = "¡Hola Katz Café! 👋 Quisiera hacer el siguiente pedido:\n\n";
    let subtotal = 0;

    for (const item in cart) {
        const qty = cart[item].qty;
        const price = cart[item].price;
        message += `*${qty}x* ${item} _($${price * qty})_\n`;
        subtotal += qty * price;
    }

    message += `\n*Subtotal: $${subtotal.toLocaleString()}*`;
    message += `\n_(Por favor, confírmame el costo de envío a mi domicilio)_`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    initLiveContent();

    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if(e.target === this) { toggleModal(); }
        });
    }
});