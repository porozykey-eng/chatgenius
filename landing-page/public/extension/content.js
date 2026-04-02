// ChatGenius AI - Content Script
// Injects AI reply button into WhatsApp Web and Messenger Web

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    buttonId: 'chatgenius-reply-btn',
    buttonIcon: '🤖',
    buttonText: 'AI Reply'
  };

  // Create floating button
  function createFloatingButton() {
    if (document.getElementById(CONFIG.buttonId)) return;

    const button = document.createElement('div');
    button.id = CONFIG.buttonId;
    button.innerHTML = `
      <div class="chatgenius-btn">
        <span class="chatgenius-icon">${CONFIG.buttonIcon}</span>
        <span class="chatgenius-text">${CONFIG.buttonText}</span>
      </div>
    `;
    
    document.body.appendChild(button);
    
    button.addEventListener('click', handleAIReply);
  }

  // Handle AI reply generation
  async function handleAIReply() {
    const chatContext = getChatContext();
    if (!chatContext) {
      showNotification('Please select a conversation first');
      return;
    }

    showLoading(true);
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateReply',
        context: chatContext,
        apiKey: await getApiKey(),
        model: await getModel()
      });
      
      if (response.success) {
        insertReply(response.reply);
      } else {
        showNotification('Error: ' + response.error);
      }
    } catch (error) {
      showNotification('Failed to generate reply');
    } finally {
      showLoading(false);
    }
  }

  // Get chat context from current conversation
  function getChatContext() {
    // Implementation varies by platform (WhatsApp vs Messenger)
    const messages = document.querySelectorAll('[data-pre-plain-text], [dir="ltr"]');
    return Array.from(messages).slice(-5).map(m => m.textContent).join('\n');
  }

  // Insert generated reply into input box
  function insertReply(reply) {
    const inputBox = document.querySelector('[contenteditable="true"]') || 
                     document.querySelector('textarea');
    if (inputBox) {
      inputBox.focus();
      document.execCommand('insertText', false, reply);
    }
  }

  // Helper functions
  async function getApiKey() {
    const result = await chrome.storage.local.get('apiKey');
    return result.apiKey;
  }

  async function getModel() {
    const result = await chrome.storage.local.get('model');
    return result.model || 'gpt-3.5-turbo';
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'chatgenius-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  function showLoading(show) {
    const button = document.getElementById(CONFIG.buttonId);
    if (button) {
      button.classList.toggle('loading', show);
    }
  }

  // Initialize
  setTimeout(createFloatingButton, 2000);

  // Observe DOM changes for dynamic page loads
  const observer = new MutationObserver(() => {
    createFloatingButton();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
})();
