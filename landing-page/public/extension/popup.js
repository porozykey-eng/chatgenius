// ChatGenius AI - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.local.get(['apiKey', 'model', 'tone']);
  
  if (settings.apiKey) {
    document.getElementById('apiKey').value = settings.apiKey;
  }
  if (settings.model) {
    document.getElementById('model').value = settings.model;
  }
  if (settings.tone) {
    document.getElementById('tone').value = settings.tone;
  }
  
  // Save settings
  document.getElementById('save').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('model').value;
    const tone = document.getElementById('tone').value;
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    try {
      await chrome.storage.local.set({ apiKey, model, tone });
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showStatus('Failed to save settings', 'error');
    }
  });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
