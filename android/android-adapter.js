'use strict';
window.CS_ANDROID = true;
window.csNativeBack = () => {
  const dialog = document.querySelector('dialog[open]');
  if (dialog) {
    if (dialog.dispatchEvent(new Event('cancel', {cancelable: true}))) dialog.close();
    return true;
  }
  return Boolean(window.trainerNativeBack && window.trainerNativeBack());
};
