const state = { token: sessionStorage.getItem('pc-admin-token'), products: [], orders: [], customers: [] };
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(cents) / 100);
const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(state.token ? { Authorization:`Bearer ${state.token}` } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/api/admin/login') showLogin();
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

function showLogin() {
  state.token = null;
  sessionStorage.removeItem('pc-admin-token');
  $('#login-screen').hidden = false;
  $('#admin-app').hidden = true;
}

async function enterAdmin(email) {
  $('#login-screen').hidden = true;
  $('#admin-app').hidden = false;
  $('#admin-email').textContent = email || 'Administrator';
  await Promise.all([loadDashboard(), loadProducts(), loadOrders(), loadCustomers()]);
}

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  $('#login-error').textContent = '';
  try {
    const result = await api('/api/admin/login', { method:'POST', body:JSON.stringify({ email:form.get('email'), password:form.get('password') }) });
    state.token = result.token;
    sessionStorage.setItem('pc-admin-token', state.token);
    await enterAdmin(result.admin.email);
  } catch (error) { $('#login-error').textContent = error.message; }
}

function showPage(name) {
  $$('.page').forEach(page => page.classList.toggle('active', page.id === `${name}-page`));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === name));
  $('#page-title').textContent = name[0].toUpperCase() + name.slice(1);
  $('#sidebar').classList.remove('open');
}

async function loadDashboard() {
  const data = await api('/api/admin/dashboard');
  const cards = [
    ['Products', data.summary.products, 'Live catalogue items', '◇'],
    ['Orders', data.summary.orders, 'All customer orders', '▤'],
    ['Customers', data.summary.customers, 'Email accounts', '♙'],
    ['Revenue', money(data.summary.revenue_cents), 'Excluding cancelled', '$']
  ];
  $('#metrics').innerHTML = cards.map(card => `<article class="metric"><div class="metric-head"><span>${card[0]}</span><span class="metric-icon">${card[3]}</span></div><strong>${escapeHTML(card[1])}</strong><small>${card[2]}</small></article>`).join('');
  $('#recent-orders').innerHTML = data.recent_orders.length ? data.recent_orders.map(order => `<div class="compact-row"><div><strong>Order #${order.id} · ${escapeHTML(order.customer_name)}</strong><small>${escapeHTML(order.email)} · ${new Date(order.created_at + 'Z').toLocaleDateString('en-AU')}</small></div><div><strong>${money(order.total_cents)}</strong><span class="status-pill ${order.status === 'Cancelled' ? 'cancelled' : ''}">${escapeHTML(order.status)}</span></div></div>`).join('') : '<div class="compact-row"><small>No orders yet.</small></div>';
  $('#low-stock').innerHTML = data.low_stock.length ? data.low_stock.map(item => `<div class="compact-row"><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.size)} · ${escapeHTML(item.colour)}</small></div><span class="stock-pill">${item.stock} left</span></div>`).join('') : '<div class="compact-row"><small>All products are well stocked.</small></div>';
}

async function loadProducts() {
  state.products = (await api('/api/admin/products')).data;
  renderProducts();
}

function renderProducts() {
  const term = $('#product-search')?.value.toLowerCase() || '';
  const products = state.products.filter(item => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(term));
  $('#product-total').textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
  $('#product-rows').innerHTML = products.length ? products.map(product => `<tr>
    <td><div class="product-cell"><span class="product-thumb">${escapeHTML(product.sku.split('-')[0])}</span><div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.sku)}</small></div></div></td>
    <td>${escapeHTML(product.category)}</td><td>${money(product.price_cents)}</td>
    <td><div class="stock-editor">${product.variants.map(v => `<label title="${escapeHTML(v.colour)}"><span>${escapeHTML(v.size)}</span><input type="number" min="0" max="100000" value="${v.stock}" data-stock="${v.id}" aria-label="Stock for ${escapeHTML(product.name)} ${escapeHTML(v.size)}"></label>`).join('')}</div></td>
    <td><strong>${product.stock}</strong></td><td><div class="row-actions"><button class="icon-action" data-edit="${product.id}">Edit</button><button class="icon-action" data-delete="${product.id}">Delete</button></div></td>
  </tr>`).join('') : '<tr><td class="empty-row" colspan="6">No matching products.</td></tr>';
}

async function updateStock(input) {
  try {
    await api(`/api/admin/variants/${input.dataset.stock}`, { method:'PATCH', body:JSON.stringify({ stock:Number(input.value) }) });
    toast('Stock updated');
    await Promise.all([loadProducts(), loadDashboard()]);
  } catch (error) { toast(error.message); await loadProducts(); }
}

function openProduct(product = null) {
  const form = $('#product-form');
  form.reset();
  $('#product-error').textContent = '';
  form.elements.id.value = product?.id || '';
  $('#product-dialog-title').textContent = product ? 'Edit product' : 'Add product';
  $('#initial-variant').hidden = Boolean(product);
  if (product) {
    for (const field of ['name','sku','category_id','description','material','size_guide']) form.elements[field].value = product[field];
    form.elements.price.value = (product.price_cents / 100).toFixed(2);
  }
  $('#product-dialog').showModal();
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  const body = { ...data, category_id:Number(data.category_id), price_cents:Math.round(Number(data.price) * 100), stock:Number(data.stock) };
  delete body.id; delete body.price;
  $('#product-error').textContent = '';
  try {
    await api(id ? `/api/admin/products/${id}` : '/api/admin/products', { method:id ? 'PUT' : 'POST', body:JSON.stringify(body) });
    $('#product-dialog').close();
    toast(id ? 'Product updated' : 'Product created');
    await Promise.all([loadProducts(), loadDashboard()]);
  } catch (error) { $('#product-error').textContent = error.message; }
}

async function deleteProduct(id) {
  const product = state.products.find(item => item.id === Number(id));
  if (!product || !confirm(`Delete ${product.name}? This cannot be undone.`)) return;
  try { await api(`/api/admin/products/${id}`, { method:'DELETE' }); toast('Product deleted'); await Promise.all([loadProducts(), loadDashboard()]); }
  catch (error) { toast(error.message); }
}

async function loadOrders() {
  state.orders = (await api('/api/admin/orders')).data;
  const statuses = ['Confirmed','Packed','Shipped','Delivered','Cancelled'];
  $('#order-rows').innerHTML = state.orders.length ? state.orders.map(order => `<tr><td><strong>#${order.id}</strong></td><td><div class="customer-cell"><strong>${escapeHTML(order.customer_name)}</strong><small>${escapeHTML(order.email)}</small></div></td><td>${new Date(order.created_at + 'Z').toLocaleDateString('en-AU')}</td><td><strong>${money(order.total_cents)}</strong></td><td><select class="status-select" data-order-status="${order.id}">${statuses.map(status => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td></tr>`).join('') : '<tr><td class="empty-row" colspan="5">No orders yet. Place an order in the customer store to see it here.</td></tr>';
}

async function updateOrder(select) {
  try { await api(`/api/admin/orders/${select.dataset.orderStatus}`, { method:'PATCH', body:JSON.stringify({ status:select.value }) }); toast('Order status updated'); await Promise.all([loadOrders(), loadDashboard()]); }
  catch (error) { toast(error.message); await loadOrders(); }
}

async function loadCustomers() {
  state.customers = (await api('/api/admin/customers')).data;
  $('#customer-rows').innerHTML = state.customers.length ? state.customers.map(customer => `<tr><td><strong>${escapeHTML(customer.name)}</strong></td><td>${escapeHTML(customer.email)}</td><td>${new Date(customer.created_at + 'Z').toLocaleDateString('en-AU')}</td><td>${customer.order_count}</td><td><strong>${money(customer.spent_cents)}</strong></td></tr>`).join('') : '<tr><td class="empty-row" colspan="5">No customer accounts yet.</td></tr>';
}

$('#admin-login').addEventListener('submit', login);
$('#product-form').addEventListener('submit', saveProduct);
$('#product-search').addEventListener('input', renderProducts);
$('#menu-button').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$$('.nav-item').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
$$('[data-page-link]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.pageLink)));
$$('[data-open-product]').forEach(button => button.addEventListener('click', () => openProduct()));
$('#product-rows').addEventListener('change', event => { if (event.target.matches('[data-stock]')) updateStock(event.target); });
$('#product-rows').addEventListener('click', event => { const edit = event.target.closest('[data-edit]'); const remove = event.target.closest('[data-delete]'); if (edit) openProduct(state.products.find(item => item.id === Number(edit.dataset.edit))); if (remove) deleteProduct(remove.dataset.delete); });
$('#order-rows').addEventListener('change', event => { if (event.target.matches('[data-order-status]')) updateOrder(event.target); });
$('#logout').addEventListener('click', async () => { try { await api('/api/admin/logout', { method:'POST' }); } catch {} showLogin(); });

if (state.token) enterAdmin().catch(showLogin); else showLogin();
