// SocialFlow AI Extension - Popup Script (CSP Compliant)
document.addEventListener('DOMContentLoaded', () => {
  const routes = {
    'btn-dashboard': 'http://localhost:5173/dashboard',
    'btn-create': 'http://localhost:5173/create',
    'btn-queue': 'http://localhost:5173/queue',
    'btn-calendar': 'http://localhost:5173/calendar'
  };

  Object.entries(routes).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        chrome.tabs.create({ url });
      });
    }
  });
});
