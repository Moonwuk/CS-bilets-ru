"use strict";
(() => {
  const form = document.querySelector('#support-form');
  const input = document.querySelector('#support-amount');
  const error = document.querySelector('#support-error');
  function validate() {
    const raw = input.value.trim();
    const amount = Number(raw);
    const valid = /^[0-9]+$/.test(raw) && Number.isSafeInteger(amount) && amount >= 50;
    error.textContent = valid ? '' : 'Введите целое число от 50 ₽.';
    input.setAttribute('aria-invalid', String(!valid));
    input.setCustomValidity(valid ? '' : error.textContent);
    document.querySelectorAll('[data-amount]').forEach(button => button.setAttribute('aria-pressed', String(valid && Number(button.dataset.amount) === amount)));
    return valid;
  }
  input.addEventListener('input', validate);
  document.querySelectorAll('[data-amount]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.amount;
    validate();
  }));
  // No checkout until a verified native RuStore Pay integration is configured.
  form.addEventListener('submit', event => { event.preventDefault(); validate(); });
  validate();
})();
