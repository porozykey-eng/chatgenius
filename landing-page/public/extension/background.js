// ChatGenius AI - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGenius AI installed successfully!');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReply') {
    // Forward to AI API
    generateAIReply(request.context, request.apiKey, request.model)
      .then(response => sendResponse({ success: true, reply: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function generateAIReply(context, apiKey, model) {
  // This is a placeholder - actual implementation would call the AI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates professional replies.' },
        { role: 'user', content: `Generate a reply to this message: ${context}` }
      ]
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
