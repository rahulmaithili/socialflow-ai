// SocialFlow AI Extension - Background Service Worker
console.log('SocialFlow AI Background Service Worker initialized.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Listener for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_AUTH_TOKEN') {
    // In a real implementation, you would use chrome.identity.getAuthToken 
    // or securely share the Firebase auth state from the web app.
    sendResponse({ token: 'mock_extension_token' });
  }
  return true; // Keep the message channel open for async response
});
