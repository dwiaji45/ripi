let cart = {}; 
let allProducts = {}; 

// Konfigurasi Jam Operasional
const JAM_BUKA = 9;  // 09:00 WIB
const JAM_TUTUP = 21; // 21:00 WIB

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function bukaLayarPenuh() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    document.getElementById('fs-container').style.display = 'none';
}

function cekJamOperasional() {
    const jamSekarang = new Date().getHours();
    const isBuka = jamSekarang >= JAM_BUKA && jamSekarang < JAM_TUTUP;
    
    if (!isBuka) {
        document.getElementById('store-status').style.display = 'block';
        document.getElementById('btn-checkout').style.display = 'none';
    }
    return isBuka;
}

function initMenu() {
    const container = document.getElementById('menu-container');
    const savedCart = JSON.parse(localStorage.getItem('ripiCart')) || {};
    
    menuData.forEach(category => {
        const titleWrapper = document.createElement('div');
        titleWrapper.innerHTML = `
            <div class="category-title">${category.category}</div>
            ${category.note ? `<div class="category-note">${category.note}</div>` : ''}
        `;
        container.appendChild(titleWrapper);

        category.items.forEach(item => {
            allProducts[item.id] = item; 
            cart[item.id] = savedCart[item.id] || 0; 

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="menu-img" onerror="this.src='https://via.placeholder.com/150x150?text=No+Img'">
                <div class="menu-info">
                    <div class="menu-name">${item.name}</div>
                    ${item.desc ? `<div class="menu-desc">${item.desc}</div>` : ''}
                    <div class="menu-price">${formatRupiah(item.price)}</div>
                </div>
                <div class="cart-controls">
                    <button class="btn-qty" aria-label="Kurangi" onclick="updateCart('${item.id}', -1)">−</button>
                    <span class="qty-display" id="qty-${item.id}">${cart[item.id]}</span>
                    <button class="btn-qty" aria-label="Tambah" onclick="updateCart('${item.id}', 1)">+</button>
                </div>
            `;
            container.appendChild(menuItem);
        });
    });

    cekJamOperasional();
    calculateTotal();
}

function updateCart(id, change) {
    if(!cekJamOperasional()) {
        alert("Maaf, saat ini toko sedang tutup.");
        return;
    }

    let newQty = cart[id] + change;
    if (newQty < 0) newQty = 0;
    
    cart[id] = newQty;
    document.getElementById(`qty-${id}`).innerText = newQty;
    
    localStorage.setItem('ripiCart', JSON.stringify(cart));
    calculateTotal();
}

function calculateTotal() {
    let totalPrice = 0;
    let totalItems = 0;

    for (const id in cart) {
        if (cart[id] > 0) {
            totalPrice += cart[id] * allProducts[id].price;
            totalItems += cart[id];
        }
    }

    document.getElementById('total-price').innerText = formatRupiah(totalPrice);
    
    const btnCheckout = document.getElementById('btn-checkout');
    if (totalItems > 0 && cekJamOperasional()) {
        btnCheckout.removeAttribute('disabled');
    } else {
        btnCheckout.setAttribute('disabled', 'true');
    }
}

function openModal() {
    const summaryContainer = document.getElementById('order-summary');
    summaryContainer.innerHTML = '';
    let totalPrice = 0;

    for (const id in cart) {
        if (cart[id] > 0) {
            const item = allProducts[id];
            const itemTotal = cart[id] * item.price;
            totalPrice += itemTotal;
            
            summaryContainer.innerHTML += `
                <div class="summary-item">
                    <span>${cart[id]}x ${item.name}</span>
                    <strong>${formatRupiah(itemTotal)}</strong>
                </div>
            `;
        }
    }
    
    summaryContainer.innerHTML += `
        <div class="summary-item" style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
            <strong>TOTAL</strong>
            <strong style="color: #2d6a4f; font-size: 1.1rem;">${formatRupiah(totalPrice)}</strong>
        </div>
    `;

    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function checkoutWA() {
    const nama = document.getElementById('input-name').value;
    const alamat = document.getElementById('input-address').value;
    const catatan = document.getElementById('input-notes').value;

    if(!nama || !alamat) {
        alert("Mohon lengkapi Nama dan Meja/Alamat!");
        return;
    }

    const phoneNumber = "62816847468"; // Ganti jika perlu
    let textMessage = `*PESANAN BARU RIPI FOOD*\n\n`;
    textMessage += `👤 Nama: ${nama}\n`;
    textMessage += `📍 Meja/Alamat: ${alamat}\n`;
    textMessage += `📝 Catatan: ${catatan ? catatan : '-'}\n\n`;
    textMessage += `*Rincian Pesanan:*\n`;

    let totalPrice = 0;
    for (const id in cart) {
        if (cart[id] > 0) {
            const item = allProducts[id];
            const itemTotal = cart[id] * item.price;
            totalPrice += itemTotal;
            textMessage += `▪️ ${cart[id]}x ${item.name} (${formatRupiah(itemTotal)})\n`;
        }
    }

    textMessage += `\n*Total Tagihan: ${formatRupiah(totalPrice)}*`;

    localStorage.removeItem('ripiCart');
    closeModal();

    const encodedMessage = encodeURIComponent(textMessage);
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
    
    setTimeout(() => location.reload(), 1500); 
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', initMenu);

// Registrasi Service Worker untuk PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Error', err));
    });
}

