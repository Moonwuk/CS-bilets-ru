'use strict';
window.CS_ANDROID = true;
// This external script is allowed by the native WebView CSP.
const androidMenu = document.querySelector('.mode-menu');
if (androidMenu) {
  const mobile = matchMedia('(max-width: 800px)');
  const syncMenu = () => { androidMenu.open = !mobile.matches; };
  syncMenu();
  mobile.addEventListener('change', syncMenu);
  androidMenu.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('[data-page]')) androidMenu.open = false;
  });
}
window.csNativeBack = () => {
  const dialog = document.querySelector('dialog[open]');
  if (dialog) {
    if (dialog.dispatchEvent(new Event('cancel', {cancelable: true}))) dialog.close();
    return true;
  }
  return Boolean(window.trainerNativeBack && window.trainerNativeBack());
};
