const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const safeNext = value => value?.startsWith('/') && !value.startsWith('//') ? value : '/';

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function switchMode(mode) {
  const admin = mode === 'admin';
  $('#customer-tab').classList.toggle('active', !admin);
  $('#admin-tab').classList.toggle('active', admin);
  $('#customer-tab').setAttribute('aria-selected', String(!admin));
  $('#admin-tab').setAttribute('aria-selected', String(admin));
  $('#customer-panel').hidden = admin;
  $('#admin-panel').hidden = !admin;
  $('#customer-panel').classList.toggle('active', !admin);
  $('#admin-panel').classList.toggle('active', admin);
  history.replaceState(null, '', `${location.pathname}?type=${admin ? 'admin' : 'customer'}`);
}

function storeCustomer(user, token = null) {
  localStorage.setItem('pc-user', JSON.stringify(user));
  if (token) localStorage.setItem('pc-auth-token', JSON.stringify(token));
  else localStorage.removeItem('pc-auth-token');
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', resolve, { once:true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not load')), { once:true });
    document.head.append(script);
  });
}

async function initialiseCustomerLogin() {
  const message = $('#customer-message');
  try {
    const config = await api('/api/auth/config');
    if (!config.google.enabled) {
      $('#customer-fallback').hidden = false;
      message.textContent = 'Local demonstration mode is active.';
      return;
    }
    await loadGoogleIdentity();
    window.google.accounts.id.initialize({
      client_id: config.google.client_id,
      callback: async response => {
        message.textContent = 'Verifying your Google account…';
        try {
          const result = await api('/api/auth/google', { method:'POST', body:JSON.stringify({ credential:response.credential }) });
          storeCustomer(result.user, result.token);
          message.classList.add('success');
          message.textContent = `Welcome, ${result.user.name}. Redirecting…`;
          location.assign(safeNext(params.get('next') || '/?account=orders'));
        } catch (error) { message.textContent = error.message; }
      }
    });
    window.google.accounts.id.renderButton($('#google-signin'), { theme:'outline', size:'large', width:360, text:'continue_with' });
  } catch (error) { message.textContent = error.message; }
}

$('#customer-fallback').addEventListener('submit', async event => {
  event.preventDefault();
  const message = $('#customer-message');
  const form = new FormData(event.currentTarget);
  try {
    const result = await api('/api/auth/login', { method:'POST', body:JSON.stringify({ name:form.get('name'), email:form.get('email') }) });
    storeCustomer(result.user, result.token);
    location.assign('/?account=orders');
  } catch (error) { message.textContent = error.message; }
});

$('#admin-login').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const message = $('#admin-message');
  const form = new FormData(event.currentTarget);
  message.textContent = '';
  button.disabled = true;
  button.textContent = 'Signing in…';
  try {
    const result = await api('/api/admin/login', { method:'POST', body:JSON.stringify({ email:form.get('email'), password:form.get('password') }) });
    sessionStorage.setItem('pc-admin-token', result.token);
    message.classList.add('success');
    message.textContent = 'Access approved. Opening dashboard…';
    location.assign(safeNext(params.get('next') || '/admin.html'));
  } catch (error) {
    message.classList.remove('success');
    message.textContent = error.message;
    button.disabled = false;
    button.textContent = 'Open administration portal';
  }
});

$('#sample-orders').addEventListener('click', () => {
  storeCustomer({ name:'Demo Customer', email:'demo@popculture.com', demo:true });
  location.assign('/?account=orders');
});

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
switchMode(params.get('type') === 'admin' ? 'admin' : 'customer');
initialiseCustomerLogin();
