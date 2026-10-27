const form = document.querySelector('#contact-form');
if (form) form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  const message = document.querySelector('#contact-result');
  const body = Object.fromEntries(new FormData(form));
  submit.disabled = true;
  message.className = 'form-error';
  message.textContent = '';
  try {
    const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send message');
    form.reset();
    message.className = 'contact-success wide';
    message.textContent = `Message #${result.id} received. Our demonstration support team will review it.`;
  } catch (error) {
    message.textContent = error.message;
  } finally { submit.disabled = false; }
});
