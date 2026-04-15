const API = '/api';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let products = [];
let isRegister = false;

// === INIT ===
async function init() {
  products = await fetch(`${API}/products`).then(r => r.json());
  renderFeatured();
  renderCategories();
  renderCatalog();
  updateCartCount();
  updateAuthArea();
}

// === PAGES ===
function showPage(page, data) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');
  window.scrollTo(0, 0);
  if (page === 'product' && data) renderProductDetail(data);
  if (page === 'cart') renderCart();
  if (page === 'orders') loadOrders();
  if (page === 'admin') renderAdminProducts();
}

// === PRODUCTS ===
function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = products.slice(0, 4).map(productCard).join('');
}

function renderCategories() {
  const cats = [...new Set(products.map(p => p.category))];
  document.getElementById('categories-grid').innerHTML = cats.map(c => {
    const count = products.filter(p => p.category === c).length;
    return `<div class="category-card" onclick="filterByCategory('${c}')"><h3>${c}</h3><p>${count} produto${count > 1 ? 's' : ''}</p></div>`;
  }).join('');

  const select = document.getElementById('category-filter');
  select.innerHTML = '<option value="">Todas categorias</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderCatalog(filtered) {
  document.getElementById('catalog-grid').innerHTML = (filtered || products).map(productCard).join('');
}

function productCard(p) {
  return `<div class="product-card" onclick="showPage('product', ${p.id})">
    <img src="${p.image}" alt="${p.name}" loading="lazy">
    <div class="product-card-info">
      <div class="category">${p.category}</div>
      <h3>${p.name}</h3>
      <div class="price">R$ ${p.price.toFixed(2)}</div>
    </div>
  </div>`;
}

function filterProducts() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-filter').value;
  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)) &&
    (!category || p.category === category)
  );
  renderCatalog(filtered);
}

function filterByCategory(cat) {
  showPage('catalog');
  document.getElementById('category-filter').value = cat;
  filterProducts();
}

// === PRODUCT DETAIL ===
function renderProductDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const stockClass = p.stock <= 5 ? 'low' : '';
  document.getElementById('product-detail').innerHTML = `
    <div><img src="${p.image}" alt="${p.name}"></div>
    <div class="product-detail-info">
      <div class="category">${p.category}</div>
      <h1>${p.name}</h1>
      <div class="price">R$ ${p.price.toFixed(2)}</div>
      <p class="description">${p.description}</p>
      <p class="stock ${stockClass}">${p.stock > 0 ? `${p.stock} em estoque` : 'Esgotado'}</p>
      ${p.stock > 0 ? `
        <div class="quantity-selector">
          <button onclick="changeQty(-1)">−</button>
          <span id="qty">1</span>
          <button onclick="changeQty(1)">+</button>
        </div>
        <button class="btn-primary" onclick="addToCart(${p.id})">ADICIONAR AO CARRINHO</button>
      ` : '<button class="btn-primary" disabled style="opacity:0.3">ESGOTADO</button>'}
    </div>`;
}

let qty = 1;
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById('qty').textContent = qty;
}

// === CART ===
function addToCart(productId) {
  const existing = cart.find(i => i.productId === productId);
  if (existing) existing.quantity += qty;
  else cart.push({ productId, quantity: qty });
  qty = 1;
  saveCart();
  updateCartCount();
  showPage('cart');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  saveCart();
  updateCartCount();
  renderCart();
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  renderCart();
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function updateCartCount() { document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + i.quantity, 0); }

function renderCart() {
  const el = document.getElementById('cart-content');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty"><p>Seu carrinho está vazio</p><button class="btn-secondary" onclick="showPage('catalog')">EXPLORAR PRODUTOS</button></div>`;
    return;
  }
  let total = 0;
  const items = cart.map(item => {
    const p = products.find(x => x.id === item.productId);
    if (!p) return '';
    const subtotal = p.price * item.quantity;
    total += subtotal;
    return `<div class="cart-item">
      <img src="${p.image}" alt="${p.name}">
      <div class="cart-item-info">
        <h3>${p.name}</h3>
        <div class="price">R$ ${p.price.toFixed(2)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-selector">
          <button onclick="updateCartQty(${p.id}, -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQty(${p.id}, 1)">+</button>
        </div>
        <span style="font-weight:700;min-width:100px;text-align:right">R$ ${subtotal.toFixed(2)}</span>
        <button class="btn-danger" onclick="removeFromCart(${p.id})">Remover</button>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = items + `<div class="cart-summary">
    <div class="cart-total">Total: R$ ${total.toFixed(2)}</div>
    <button class="btn-primary" onclick="checkout()">FINALIZAR PEDIDO</button>
  </div>`;
}

async function checkout() {
  if (!token) return openModal();
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: cart })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    cart = [];
    saveCart();
    updateCartCount();
    alert(`Pedido #${data.orderId} realizado! Total: R$ ${data.total.toFixed(2)}`);
    showPage('orders');
  } catch { alert('Erro ao finalizar pedido'); }
}

// === ORDERS ===
async function loadOrders() {
  if (!token) return openModal();
  const orders = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  const el = document.getElementById('orders-content');
  if (!orders.length) { el.innerHTML = '<div class="cart-empty"><p>Nenhum pedido encontrado</p></div>'; return; }
  el.innerHTML = orders.map(o => `<div class="order-card">
    <div class="order-header">
      <h3>Pedido #${o.id}</h3>
      <span class="order-status ${o.status}">${o.status}</span>
    </div>
    <div class="order-items">
      ${o.items.map(i => `<div class="order-item"><span>${i.name} x${i.quantity}</span><span>R$ ${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
    </div>
    <div style="text-align:right;margin-top:16px;font-weight:700">Total: R$ ${o.total.toFixed(2)}</div>
  </div>`).join('');
}

// === AUTH ===
function updateAuthArea() {
  const el = document.getElementById('auth-area');
  if (user) {
    const adminBtn = user.role === 'admin' ? `<button class="btn-header" onclick="showPage('admin')">Admin</button>` : '';
    el.innerHTML = `<span class="user-name">${user.name}</span>
      ${adminBtn}
      <button class="btn-header" onclick="showPage('orders')">Pedidos</button>
      <button class="btn-header logout" onclick="logout()">Sair</button>`;
  } else {
    el.innerHTML = `<button class="btn-header" onclick="openModal()">Entrar</button>`;
  }
}

function openModal() {
  isRegister = false;
  updateModalMode();
  document.getElementById('auth-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('auth-modal').classList.add('hidden'); }

function toggleAuthMode(e) {
  e.preventDefault();
  isRegister = !isRegister;
  updateModalMode();
}

function updateModalMode() {
  document.getElementById('auth-title').textContent = isRegister ? 'CRIAR CONTA' : 'ENTRAR';
  document.getElementById('auth-name').style.display = isRegister ? 'block' : 'none';
  document.getElementById('auth-toggle-text').textContent = isRegister ? 'Já tem conta?' : 'Não tem conta?';
  document.getElementById('auth-toggle-link').textContent = isRegister ? 'Entrar' : 'Cadastre-se';
  document.querySelector('#auth-form button[type="submit"]').textContent = isRegister ? 'CADASTRAR' : 'ENTRAR';
}

async function handleAuth(e) {
  e.preventDefault();
  const endpoint = isRegister ? 'register' : 'login';
  const body = { email: document.getElementById('auth-email').value, password: document.getElementById('auth-password').value };
  if (isRegister) body.name = document.getElementById('auth-name').value;

  try {
    const res = await fetch(`${API}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    updateAuthArea();
    closeModal();
  } catch { alert('Erro de conexão'); }
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthArea();
  showPage('home');
}

// === START ===
// Admin: image preview
document.getElementById('prod-image')?.addEventListener('input', (e) => {
  const url = e.target.value;
  const preview = document.getElementById('prod-preview');
  const img = document.getElementById('prod-preview-img');
  if (url) { img.src = url; preview.classList.remove('hidden'); }
  else preview.classList.add('hidden');
});

async function handleAddProduct(e) {
  e.preventDefault();
  if (!token || user?.role !== 'admin') return alert('Acesso negado');
  const body = {
    name: document.getElementById('prod-name').value,
    price: parseFloat(document.getElementById('prod-price').value),
    image: document.getElementById('prod-image').value,
    description: document.getElementById('prod-description').value || '',
    category: document.getElementById('prod-category').value || 'Geral',
    stock: parseInt(document.getElementById('prod-stock').value) || 1
  };
  const res = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  alert('Produto adicionado!');
  document.getElementById('admin-product-form').reset();
  document.getElementById('prod-preview').classList.add('hidden');
  products = await fetch(`${API}/products`).then(r => r.json());
  renderAdminProducts();
  renderFeatured();
  renderCategories();
  renderCatalog();
}

function renderAdminProducts() {
  const el = document.getElementById('admin-products-list');
  if (!el) return;
  el.innerHTML = products.map(p => `<div class="admin-product-row">
    <img src="${p.image}" alt="${p.name}">
    <div class="info"><h4>${p.name}</h4><span>R$ ${p.price.toFixed(2)} · ${p.stock} em estoque</span></div>
    <button class="btn-danger" onclick="deleteProduct(${p.id})">Excluir</button>
  </div>`).join('');
}

async function deleteProduct(id) {
  if (!confirm('Excluir este produto?')) return;
  await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  products = await fetch(`${API}/products`).then(r => r.json());
  renderAdminProducts();
  renderFeatured();
  renderCategories();
  renderCatalog();
}

init();
