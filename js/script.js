// Centralized script for inventory demo: login, dashboard, products
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_PRODUCTS_KEY = 'inv_products_v1';

    // Default data
    const defaultSummary = { totalProducts: 120, totalSales: 85, totalRevenue: 12500000 };
    const defaultProducts = [
        { id: 1, name: 'Kopi Gayo', price: 25000, stock: 50 },
        { id: 2, name: 'Teh Hitam', price: 18000, stock: 30 },
        { id: 3, name: 'Coklat Aceh', price: 30000, stock: 20 }
    ];

    // App state
    let products = loadProducts();
    const summary = { ...defaultSummary };

    // --- Login page ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (document.getElementById('email') || {}).value || '';
            const password = (document.getElementById('password') || {}).value || '';
            const errorEl = document.getElementById('errorMessage');

            if (!email || !password) {
                if (errorEl) { errorEl.textContent = 'Email dan password harus diisi.'; errorEl.style.display = 'block'; }
                showToast('error', 'Email dan password harus diisi.');
                animateShake('.login-card');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (errorEl) { errorEl.textContent = 'Format email tidak valid.'; errorEl.style.display = 'block'; }
                showToast('error', 'Format email tidak valid.');
                animateShake('.login-card');
                return;
            }

            if (errorEl) errorEl.style.display = 'none';
            const btn = loginForm.querySelector('.login-btn');
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }
            showToast('success', 'Login berhasil. Mengalihkan...');
            setTimeout(() => { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } window.location.href = 'dashboard.html'; }, 900);
        });
    }

    // --- Dashboard ---
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) updateDashboard();

    // --- Products page ---
    const tableBody = document.getElementById('productsTableBody');
    if (tableBody) {
        renderProducts();

        // Add product button
        const btnAdd = document.getElementById('btnAddProduct');
        if (btnAdd) btnAdd.addEventListener('click', () => openEditModal());

        // Edit modal buttons
        const modal = document.getElementById('editProductModal');
        if (modal) {
            modal.querySelector('.btn-cancel').addEventListener('click', () => modal.classList.add('hidden'));
            modal.querySelector('.btn-save').addEventListener('click', onSaveProduct);
        }
    }

    // Wire confirm & dialog modal close buttons (if exist)
    const dialog = document.getElementById('dialogModal');
    if (dialog) {
        const ok = dialog.querySelector('.btn-ok');
        if (ok) ok.addEventListener('click', () => dialog.classList.add('hidden'));
    }

    // --- Functions ---
    function loadProducts() {
        try {
            const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
            if (!raw) return defaultProducts.slice();
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return defaultProducts.slice();
            return parsed;
        } catch (e) { return defaultProducts.slice(); }
    }

    function saveProducts() {
        try { localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products)); }
        catch (e) { console.warn('Failed to save products', e); }
        updateDashboard();
    }

    function updateDashboard() {
        // summary.totalProducts reflect actual data
        summary.totalProducts = products.length;
        if (totalProductsEl) totalProductsEl.textContent = summary.totalProducts.toLocaleString();
        const salesEl = document.getElementById('totalSales'); if (salesEl) salesEl.textContent = summary.totalSales.toLocaleString();
        const revenueEl = document.getElementById('totalRevenue'); if (revenueEl) revenueEl.textContent = formatCurrency(summary.totalRevenue);
    }

    function renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        products.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i+1}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${formatCurrency(p.price)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${p.id}">✏️</button>
                    <button class="btn-action btn-delete" data-id="${p.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
            // stagger animation
            tr.classList.add('fade-in'); tr.style.animationDelay = `${i*70}ms`;
        });

        // bind action buttons
        tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.dataset.id); openEditModal(id);
        }));
        tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.dataset.id); onDeleteProduct(id);
        }));
    }

    function openEditModal(productId) {
        const modal = document.getElementById('editProductModal');
        if (!modal) return;
        const title = document.getElementById('editProductTitle');
        const inpName = document.getElementById('editName');
        const inpPrice = document.getElementById('editPrice');
        const inpStock = document.getElementById('editStock');

        if (!productId) {
            title.textContent = 'Tambah Produk';
            inpName.value = '';
            inpPrice.value = '';
            inpStock.value = '';
            modal.dataset.editId = '';
        } else {
            const prod = products.find(x => x.id === productId);
            if (!prod) return;
            title.textContent = 'Edit Produk';
            inpName.value = prod.name;
            inpPrice.value = prod.price;
            inpStock.value = prod.stock;
            modal.dataset.editId = String(productId);
        }
        modal.classList.remove('hidden');
        inpName.focus();
    }

    function onSaveProduct() {
        const modal = document.getElementById('editProductModal');
        const idStr = modal.dataset.editId;
        const name = document.getElementById('editName').value.trim();
        const price = Number(document.getElementById('editPrice').value) || 0;
        const stock = Number(document.getElementById('editStock').value) || 0;
        if (!name) { showToast('error', 'Nama produk harus diisi'); return; }

        if (idStr) {
            const id = Number(idStr);
            const idx = products.findIndex(p => p.id === id);
            if (idx !== -1) {
                products[idx].name = name; products[idx].price = price; products[idx].stock = stock;
                showToast('success', 'Produk diperbarui');
            }
        } else {
            const newId = products.reduce((m, r) => Math.max(m, r.id), 0) + 1;
            products.push({ id: newId, name, price, stock });
            showToast('success', 'Produk ditambahkan');
        }
        saveProducts(); renderProducts();
        modal.classList.add('hidden');
    }

    async function onDeleteProduct(productId) {
        const ok = await confirmDialog('Apakah Anda yakin ingin menghapus produk ini?');
        if (!ok) return;
        const idx = products.findIndex(p => p.id === productId);
        if (idx !== -1) {
            products.splice(idx, 1); saveProducts(); renderProducts(); showToast('success', 'Produk berhasil dihapus');
        }
    }

    // Utilities: toast, confirm modal, dialog
    function showToast(type, message, timeout = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return; const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `<div class="toast-msg">${escapeHtml(message)}</div><button class="toast-close">✕</button>`; container.appendChild(el);
        const close = () => { el.style.opacity = '0'; el.style.transform = 'translateY(6px) scale(.98)'; setTimeout(()=>el.remove(), 300); };
        el.querySelector('.toast-close').addEventListener('click', close);
        setTimeout(close, timeout);
    }

    function animateShake(selector) { const el = document.querySelector(selector); if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'),600); }

    function confirmDialog(message) {
        return new Promise(resolve => {
            const overlay = document.getElementById('confirmModal');
            if (!overlay) { resolve(confirm(message)); return; }
            overlay.querySelector('.confirm-text').textContent = message; overlay.classList.remove('hidden');
            const yes = overlay.querySelector('.btn-yes'); const no = overlay.querySelector('.btn-no');
            function cleanup(val){ overlay.classList.add('hidden'); yes.removeEventListener('click', onYes); no.removeEventListener('click', onNo); resolve(val);} function onYes(){ cleanup(true);} function onNo(){ cleanup(false);} yes.addEventListener('click', onYes); no.addEventListener('click', onNo);
        });
    }

    // small helpers
    function formatCurrency(amount) { return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(amount); }
    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

});