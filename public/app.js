const images = {
  'TEE-SPACE-001': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=86',
  'TEE-ARCADE-002': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=86',
  'HOOD-MOON-001': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=86',
  'HOOD-PIXEL-002': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=86',
  'CAP-STAR-001': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=86',
  'TOTE-COMIC-002': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=86'
};

const badges = {
  'TEE-SPACE-001': 'Bestseller',
  'TEE-ARCADE-002': 'New',
  'HOOD-MOON-001': 'Trending',
  'CAP-STAR-001': 'Limited'
};

const state = {
  products: [],
  categories: [],
  category: 'all',
  query: '',
  sort: 'featured',
  cart: readStore('pc-cart', []),
  wishlist: readStore('pc-wishlist', []),
  user: readStore('pc-user', null),
  activeProduct: null,
  selectedVariant: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
}

function imageFor(product) {
  return images[product.sku] || 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=86';
}

function visibleProducts() {
  let data = state.products.filter(product => {
    const matchesCategory = state.category === 'all' || String(product.category_id) === state.category;
    const term = state.query.toLowerCase();
    const matchesQuery = !term || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term);
    return matchesCategory && matchesQuery;
  });
  if (state.sort === 'price-low') data.sort((a, b) => a.price_cents - b.price_cents);
  if (state.sort === 'price-high') data.sort((a, b) => b.price_cents - a.price_cents);
  if (state.sort === 'name') data.sort((a, b) => a.name.localeCompare(b.name));
  return data;
}

function renderProducts() {
  const products = visibleProducts();
  $('#product-count').textContent = products.length;
  $('#catalogue-status').textContent = state.query ? `Results for “${state.query}”` : '';
  $('#empty-state').hidden = products.length > 0;
  $('#product-grid').innerHTML = products.map(product => {
    const saved = state.wishlist.includes(product.id);
    const stockClass = product.stock === 0 ? 'out' : product.stock < 8 ? 'low' : '';
    const stockText = product.stock === 0 ? 'Sold out' : product.stock < 8 ? `Only ${product.stock} left` : 'In stock';
    return `<article class="product-card" data-product-id="${product.id}">
      <div class="product-image-wrap" tabindex="0" role="button" aria-label="View ${escapeHTML(product.name)}">
        <img class="product-image" src="${imageFor(product)}" alt="${escapeHTML(product.name)}" loading="lazy">
        ${badges[product.sku] ? `<span class="product-badge">${badges[product.sku]}</span>` : ''}
        <button class="wish-toggle ${saved ? 'active' : ''}" type="button" data-wish="${product.id}" aria-label="${saved ? 'Remove from' : 'Add to'} wishlist">${saved ? '♥' : '♡'}</button>
        <button class="quick-view" type="button" data-view="${product.id}">Quick view</button>
      </div>
      <div class="product-meta">
        <p class="product-category">${escapeHTML(product.category)}</p>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-price-row"><span class="product-price">${money(product.price_cents)}</span><span class="stock ${stockClass}">${stockText}</span></div>
      </div>
    </article>`;
  }).join('');
}

function setCategory(value) {
  state.category = String(value);
  $$('#category-filters button').forEach(button => button.classList.toggle('active', button.dataset.category === state.category));
  renderProducts();
  $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function openProduct(id) {
  const product = state.products.find(item => item.id === Number(id));
  if (!product) return;
  state.activeProduct = product;
  state.selectedVariant = null;
  const detail = $('#product-detail');
  detail.innerHTML = '<div class="modal-content"><p>Loading product options…</p></div>';
  $('#product-modal').showModal();
  try {
    const { data: variants } = await api(`/api/products/${product.id}/variants`);
    state.selectedVariant = variants.find(variant => variant.stock > 0) || null;
    const saved = state.wishlist.includes(product.id);
    detail.innerHTML = `<div class="product-detail-grid">
      <img class="detail-image" src="${imageFor(product)}" alt="${escapeHTML(product.name)}">
      <div class="detail-copy">
        <p class="eyebrow">${escapeHTML(product.category)} · ${escapeHTML(product.sku)}</p>
        <h2>${escapeHTML(product.name)}</h2>
        <p class="detail-price">${money(product.price_cents)}</p>
        <p class="detail-description">${escapeHTML(product.description)} A comfortable statement piece designed for everyday wear.</p>
        <div class="detail-list">
          <div><span>Material</span><strong>${escapeHTML(product.material)}</strong></div>
          <div><span>Size guide</span><strong>${escapeHTML(product.size_guide)}</strong></div>
          <div><span>Availability</span><strong>${product.stock} units</strong></div>
        </div>
        <div class="variant-label"><span>Choose an option</span><span id="selected-option">${state.selectedVariant ? `${state.selectedVariant.size} · ${state.selectedVariant.colour}` : 'Unavailable'}</span></div>
        <div class="variant-grid">${variants.map(variant => `<button class="variant-button ${state.selectedVariant?.id === variant.id ? 'active' : ''}" type="button" data-variant="${variant.id}" ${variant.stock < 1 ? 'disabled' : ''}>${escapeHTML(variant.size)}<small>${escapeHTML(variant.colour)} · ${variant.stock} left</small></button>`).join('')}</div>
        <div class="detail-actions">
          <button class="button button-dark" id="add-to-cart" type="button" ${state.selectedVariant ? '' : 'disabled'}>Add to bag · ${money(product.price_cents)}</button>
          <button class="detail-heart" id="detail-wish" type="button" aria-label="Save product">${saved ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>`;
    detail.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
      state.selectedVariant = variants.find(variant => variant.id === Number(button.dataset.variant));
      detail.querySelectorAll('[data-variant]').forEach(item => item.classList.toggle('active', item === button));
      $('#selected-option').textContent = `${state.selectedVariant.size} · ${state.selectedVariant.colour}`;
    }));
    $('#add-to-cart').addEventListener('click', addActiveProductToCart);
    $('#detail-wish').addEventListener('click', event => {
      toggleWishlist(product.id);
      event.currentTarget.textContent = state.wishlist.includes(product.id) ? '♥' : '♡';
    });
  } catch (error) {
    detail.innerHTML = `<div class="modal-content"><h2>Unable to load product</h2><p>${escapeHTML(error.message)}</p></div>`;
  }
}

function addActiveProductToCart() {
  if (!state.activeProduct || !state.selectedVariant) return;
  const key = `${state.activeProduct.id}:${state.selectedVariant.id}`;
  const existing = state.cart.find(item => item.key === key);
  if (existing) {
    if (existing.quantity >= Math.min(10, state.selectedVariant.stock)) return toast('Maximum available quantity reached');
    existing.quantity += 1;
  } else {
    state.cart.push({
      key,
      product_id: state.activeProduct.id,
      variant_id: state.selectedVariant.id,
      name: state.activeProduct.name,
      sku: state.activeProduct.sku,
      price_cents: state.activeProduct.price_cents,
      size: state.selectedVariant.size,
      colour: state.selectedVariant.colour,
      stock: state.selectedVariant.stock,
      quantity: 1
    });
  }
  saveCart();
  $('#product-modal').close();
  openDrawer('cart');
  toast('Added to your bag');
}

function saveCart(sync = true) {
  writeStore('pc-cart', state.cart);
  renderCart();
  if (sync && state.user) {
    clearTimeout(saveCart.timer);
    saveCart.timer = setTimeout(persistCart, 250);
  }
}

async function persistCart() {
  if (!state.user) return;
  try {
    await api('/api/cart', { method: 'PUT', body: JSON.stringify({
      email: state.user.email,
      name: state.user.name,
      items: state.cart.map(item => ({ variant_id: item.variant_id, quantity: item.quantity }))
    }) });
  } catch (error) { toast(`Cart could not sync: ${error.message}`); }
}

async function mergeAccountCart() {
  if (!state.user) return;
  const { data } = await api(`/api/cart?email=${encodeURIComponent(state.user.email)}`);
  const combined = new Map();
  for (const item of [...data, ...state.cart]) {
    const existing = combined.get(item.variant_id);
    combined.set(item.variant_id, {
      key: `${item.product_id}:${item.variant_id}`,
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      sku: item.sku,
      price_cents: item.price_cents,
      size: item.size,
      colour: item.colour,
      stock: item.stock,
      quantity: Math.min(10, item.stock, Math.max(existing?.quantity || 0, item.quantity))
    });
  }
  state.cart = [...combined.values()].filter(item => item.quantity > 0);
  saveCart();
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#cart-count').textContent = count;
  $('#cart-items').innerHTML = state.cart.length ? state.cart.map(item => `<article class="line-item">
    <img src="${images[item.sku]}" alt="${escapeHTML(item.name)}">
    <div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.size)} · ${escapeHTML(item.colour)}</p><span class="line-price">${money(item.price_cents)}</span>
      <div class="quantity"><button type="button" data-qty="down" data-key="${item.key}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-qty="up" data-key="${item.key}" aria-label="Increase quantity">+</button></div>
    </div>
    <button class="remove-button" type="button" data-remove="${item.key}" aria-label="Remove item">×</button>
  </article>`).join('') : '<div class="drawer-empty"><strong>Your bag is empty</strong><span>Choose something from the latest collection.</span></div>';
  const subtotal = state.cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  $('#cart-subtotal').textContent = money(subtotal);
  $('#checkout-button').disabled = state.cart.length === 0;
}

function updateQuantity(key, direction) {
  const item = state.cart.find(entry => entry.key === key);
  if (!item) return;
  if (direction === 'up' && item.quantity < Math.min(10, item.stock)) item.quantity += 1;
  if (direction === 'down') item.quantity -= 1;
  if (item.quantity < 1) state.cart = state.cart.filter(entry => entry.key !== key);
  saveCart();
}

function toggleWishlist(id) {
  const productId = Number(id);
  state.wishlist = state.wishlist.includes(productId) ? state.wishlist.filter(item => item !== productId) : [...state.wishlist, productId];
  writeStore('pc-wishlist', state.wishlist);
  renderWishlist();
  renderProducts();
  toast(state.wishlist.includes(productId) ? 'Saved to wishlist' : 'Removed from wishlist');
}

function renderWishlist() {
  $('#wishlist-count').textContent = state.wishlist.length;
  const products = state.wishlist.map(id => state.products.find(product => product.id === id)).filter(Boolean);
  $('#wishlist-items').innerHTML = products.length ? products.map(product => `<article class="line-item">
    <img src="${imageFor(product)}" alt="${escapeHTML(product.name)}">
    <div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.category)}</p><span class="line-price">${money(product.price_cents)}</span><br><button class="button button-dark" type="button" data-view="${product.id}">Choose options</button></div>
    <button class="remove-button" type="button" data-wish="${product.id}" aria-label="Remove from wishlist">×</button>
  </article>`).join('') : '<div class="drawer-empty"><strong>Nothing saved yet</strong><span>Tap the heart on a style you love.</span></div>';
}

function openDrawer(name) {
  closeDrawers();
  const drawer = $(`#${name}-drawer`);
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  $('#overlay').hidden = false;
  document.body.classList.add('locked');
}

function closeDrawers() {
  $$('.drawer').forEach(drawer => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
  $('#overlay').hidden = true;
  document.body.classList.remove('locked');
}

function updateAccountLabel() {
  $('#account-label').textContent = state.user ? state.user.name.split(' ')[0] : 'Sign in';
}

async function openAccount() {
  const container = $('#account-content');
  if (!state.user) {
    container.innerHTML = `<p class="eyebrow">Your account</p><h2>Sign in with email</h2><p class="account-intro">Enter any valid email address to create or access your demo account. No password is required for this assessment storefront.</p>
      <form class="account-form" id="login-form"><label>Name<input name="name" required maxlength="80" autocomplete="name" placeholder="Your name"></label><label>Email address<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com"></label><p class="form-error" id="login-error" role="alert"></p><button class="button button-dark" type="submit">Continue with email</button></form>`;
    $('#account-modal').showModal();
    $('#login-form').addEventListener('submit', login);
    return;
  }
  container.innerHTML = `<p class="eyebrow">Your account</p><h2>Welcome back</h2><div class="account-profile"><span class="profile-avatar">${escapeHTML(state.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(state.user.name)}</strong><br><small>${escapeHTML(state.user.email)}</small></div></div><div class="account-actions"><button class="button button-dark" id="refresh-orders" type="button">Refresh orders</button><button class="button" id="sign-out" type="button">Sign out</button></div><h3>Order history</h3><div class="orders-list" id="orders-list"><p>Loading orders…</p></div>`;
  $('#account-modal').showModal();
  $('#sign-out').addEventListener('click', logout);
  $('#refresh-orders').addEventListener('click', loadOrders);
  await loadOrders();
}

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const error = $('#login-error');
  error.textContent = '';
  try {
    const { user } = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email') }) });
    state.user = user;
    writeStore('pc-user', user);
    await mergeAccountCart();
    updateAccountLabel();
    $('#account-modal').close();
    toast(`Welcome, ${user.name}`);
  } catch (requestError) { error.textContent = requestError.message; }
}

function logout() {
  state.user = null;
  localStorage.removeItem('pc-user');
  updateAccountLabel();
  $('#account-modal').close();
  toast('Signed out');
}

async function loadOrders() {
  const list = $('#orders-list');
  if (!list || !state.user) return;
  list.innerHTML = '<p>Loading orders…</p>';
  try {
    const { data } = await api(`/api/orders?email=${encodeURIComponent(state.user.email)}`);
    list.innerHTML = data.length ? data.map(order => `<article class="order-card"><header><div><h3>Order #${order.id}</h3><p>${new Date(`${order.created_at}Z`).toLocaleString('en-AU')}</p></div><span class="order-status">${escapeHTML(order.status)}</span></header><p>${order.items.map(item => `${item.quantity}× ${escapeHTML(item.name)} (${escapeHTML(item.size)})`).join('<br>')}</p><div class="order-card-footer"><strong>${money(order.total_cents)}</strong><button class="track-order-link" type="button" data-track-order="${order.id}">Track order →</button></div></article>`).join('') : '<p>No orders yet. Your completed demo orders will appear here.</p>';
  } catch (error) { list.innerHTML = `<p>${escapeHTML(error.message)}</p>`; }
}

function trackingPlaceholder() {
  return '<div class="tracking-placeholder"><span>⌖</span><h3>Live order progress</h3><p>Your delivery stages will appear here.</p></div>';
}

function openTracking(orderId = '') {
  const form = $('#tracking-form');
  form.reset();
  form.elements.order_id.value = orderId;
  if (state.user) form.elements.email.value = state.user.email;
  $('#tracking-error').textContent = '';
  $('#tracking-result').innerHTML = trackingPlaceholder();
  $('#tracking-modal').showModal();
  if (orderId && state.user) fetchTracking(orderId, state.user.email);
}

async function fetchTracking(orderId, email) {
  const result = $('#tracking-result');
  const error = $('#tracking-error');
  error.textContent = '';
  result.innerHTML = '<div class="tracking-placeholder"><span class="tracking-loader"></span><h3>Checking your order…</h3></div>';
  try {
    const { order } = await api(`/api/orders/${encodeURIComponent(orderId)}/tracking?email=${encodeURIComponent(email)}`);
    const stages = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];
    const currentIndex = stages.indexOf(order.status);
    const history = new Map(order.history.map(entry => [entry.status, entry]));
    const timeline = order.status === 'Cancelled'
      ? `<div class="tracking-cancelled"><strong>Order cancelled</strong><span>This order is no longer being prepared for delivery.</span></div>`
      : `<div class="tracking-timeline">${stages.map((stage, index) => {
          const entry = history.get(stage);
          const stateClass = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : '';
          return `<div class="tracking-step ${stateClass}"><span class="step-marker">${index < currentIndex ? '✓' : index + 1}</span><div><strong>${stage}</strong><small>${entry ? `${escapeHTML(entry.note)} · ${new Date(`${entry.created_at}Z`).toLocaleString('en-AU')}` : index === currentIndex ? 'Current order stage' : 'Waiting for update'}</small></div></div>`;
        }).join('')}</div>`;
    result.innerHTML = `<div class="tracking-summary"><p class="eyebrow">Order #${order.id}</p><div><h3>${escapeHTML(order.status)}</h3><strong>${money(order.total_cents)}</strong></div><p>Delivering to ${escapeHTML(order.shipping_name)} in ${escapeHTML(order.city)}.</p><p>Demo payment: <strong>${escapeHTML(order.payment_status || 'Pending')}</strong>${order.transaction_ref ? ` · ${escapeHTML(order.transaction_ref)}` : ''}</p></div>${timeline}<div class="tracking-items"><h4>Order contents</h4>${order.items.map(item => `<p><span>${item.quantity}× ${escapeHTML(item.name)}<small>${escapeHTML(item.size)} · ${escapeHTML(item.colour)}</small></span></p>`).join('')}</div>`;
  } catch (requestError) {
    result.innerHTML = trackingPlaceholder();
    error.textContent = requestError.message;
  }
}

function trackOrder(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  fetchTracking(form.get('order_id'), form.get('email'));
}

function openCheckout() {
  if (!state.cart.length) return;
  closeDrawers();
  const form = $('#checkout-form');
  form.reset();
  if (state.user) {
    form.elements.name.value = state.user.name;
    form.elements.email.value = state.user.email;
  }
  renderCheckoutSummary();
  $('#checkout-error').textContent = '';
  $('#checkout-modal').showModal();
}

function renderCheckoutSummary() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  const shipping = subtotal >= 8000 ? 0 : 995;
  $('#checkout-items').innerHTML = state.cart.map(item => `<div class="checkout-mini-item"><span>${item.quantity}× ${escapeHTML(item.name)}<br><small>${escapeHTML(item.size)} · ${escapeHTML(item.colour)}</small></span><strong>${money(item.price_cents * item.quantity)}</strong></div>`).join('');
  $('#checkout-totals').innerHTML = `<div class="checkout-total-row"><span>Subtotal</span><span>${money(subtotal)}</span></div><div class="checkout-total-row"><span>Shipping</span><span>${shipping ? money(shipping) : 'Free'}</span></div><div class="checkout-total-row total"><span>Total</span><span>${money(subtotal + shipping)}</span></div>`;
}

async function placeOrder(event) {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('[type="submit"]');
  const form = new FormData(event.currentTarget);
  const error = $('#checkout-error');
  error.textContent = '';
  submit.disabled = true;
  submit.textContent = 'Placing order…';
  try {
    const payload = {
      name: form.get('name'), email: form.get('email'), address: form.get('address'), city: form.get('city'), postcode: form.get('postcode'),
      items: state.cart.map(item => ({ variant_id: item.variant_id, quantity: item.quantity }))
    };
    const { order } = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    const { user } = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ name: payload.name, email: payload.email }) });
    state.user = user;
    writeStore('pc-user', user);
    state.cart = [];
    saveCart();
    updateAccountLabel();
    $('#checkout-modal').close();
    toast(`Order #${order.id} confirmed · ${money(order.total_cents)}`);
    await loadCatalogue();
  } catch (requestError) { error.textContent = requestError.message; }
  finally { submit.disabled = false; submit.textContent = 'Place order'; }
}

async function loadCatalogue() {
  $('#catalogue-status').textContent = 'Loading the collection…';
  try {
    const [productsResponse, categoriesResponse] = await Promise.all([api('/api/products'), api('/api/categories')]);
    state.products = productsResponse.data;
    state.categories = categoriesResponse.data;
    renderProducts();
    renderCart();
    renderWishlist();
  } catch (error) {
    $('#catalogue-status').textContent = `Could not load products: ${error.message}`;
  }
}

$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  state.query = $('#search-input').value.trim();
  renderProducts();
  $('#products').scrollIntoView({ behavior: 'smooth' });
});
$('#search-input').addEventListener('input', event => { if (!event.target.value) { state.query = ''; renderProducts(); } });
$('#sort-select').addEventListener('change', event => { state.sort = event.target.value; renderProducts(); });
$('#category-filters').addEventListener('click', event => { if (event.target.dataset.category) setCategory(event.target.dataset.category); });
$$('[data-category-jump], .nav-inner [data-category]').forEach(button => button.addEventListener('click', () => setCategory(button.dataset.categoryJump || button.dataset.category)));
$('#clear-filters').addEventListener('click', () => { state.query = ''; $('#search-input').value = ''; setCategory('all'); });

$('#product-grid').addEventListener('click', event => {
  const wish = event.target.closest('[data-wish]');
  if (wish) { event.stopPropagation(); return toggleWishlist(wish.dataset.wish); }
  const view = event.target.closest('[data-view]');
  const card = event.target.closest('[data-product-id]');
  if (view || card) openProduct((view || card).dataset.view || card.dataset.productId);
});
$('#product-grid').addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('product-image-wrap')) openProduct(event.target.closest('[data-product-id]').dataset.productId); });

$('#cart-items').addEventListener('click', event => {
  const qty = event.target.closest('[data-qty]');
  if (qty) updateQuantity(qty.dataset.key, qty.dataset.qty);
  const remove = event.target.closest('[data-remove]');
  if (remove) { state.cart = state.cart.filter(item => item.key !== remove.dataset.remove); saveCart(); }
});
$('#wishlist-items').addEventListener('click', event => {
  const wish = event.target.closest('[data-wish]');
  if (wish) toggleWishlist(wish.dataset.wish);
  const view = event.target.closest('[data-view]');
  if (view) { closeDrawers(); openProduct(view.dataset.view); }
});

$('#cart-button').addEventListener('click', () => openDrawer('cart'));
$('#wishlist-button').addEventListener('click', () => openDrawer('wishlist'));
$('#overlay').addEventListener('click', closeDrawers);
$$('[data-close]').forEach(button => button.addEventListener('click', closeDrawers));
$$('[data-dialog-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#checkout-button').addEventListener('click', openCheckout);
$('#checkout-form').addEventListener('submit', placeOrder);
$('#account-button').addEventListener('click', openAccount);
$('#footer-orders').addEventListener('click', openAccount);
$('#track-button').addEventListener('click', () => openTracking());
$('#nav-track').addEventListener('click', () => openTracking());
$('#footer-track').addEventListener('click', () => openTracking());
$('#tracking-form').addEventListener('submit', trackOrder);
$('#account-content').addEventListener('click', event => {
  const button = event.target.closest('[data-track-order]');
  if (!button) return;
  $('#account-modal').close();
  openTracking(button.dataset.trackOrder);
});

$('#mobile-menu').addEventListener('click', event => {
  const open = $('#primary-nav').classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

$('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  toast('Thanks — you are on the list');
  event.currentTarget.reset();
});

$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));

updateAccountLabel();
renderCart();
loadCatalogue().then(() => { if (state.user) mergeAccountCart().catch(error => toast(error.message)); });
