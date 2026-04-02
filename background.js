// Open intro page on first install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'intro.html' });
  }
});

// Reply history management
const MAX_HISTORY = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Fetch with retry and exponential backoff
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited (429), wait and retry
      if (response.status === 429 && attempt < retries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For server errors (5xx), retry with backoff
      if (response.status >= 500 && attempt < retries - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed after ' + retries + ' retries');
}

async function addToHistory(reply, context) {
  const data = await chrome.storage.sync.get({ replyHistory: [] });
  const history = data.replyHistory || [];
  
  history.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    reply: reply,
    context: context.slice(-3).map(m => m.content.substring(0, 100)),
    timestamp: Date.now()
  });
  
  if (history.length > MAX_HISTORY) history.pop();
  
  await chrome.storage.sync.set({ replyHistory: history });
  return history;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReply') {
    chrome.storage.sync.get(['provider', 'apiUrl', 'apiKey', 'modelName', 'personas', 'activePersonaId', 'tone', 'replyLength', 'faqData', 'totalReplies'], async (data) => {
      try {
        if (!data.apiKey) {
          throw new Error('API Key not configured. Please open settings.');
        }

        let systemInstruction = 'You are a helpful assistant.';
        
        if (data.personas && data.activePersonaId) {
          const activePersona = data.personas.find(p => p.id === data.activePersonaId);
          if (activePersona && activePersona.prompt) {
            systemInstruction = activePersona.prompt;
          }
        }

        if (data.tone && data.tone !== 'auto') {
          systemInstruction += '\n\nPlease reply with a ' + data.tone + ' tone.';
        }

        systemInstruction += '\n\nCRITICAL: Detect the language of the last message and reply in that SAME language automatically unless specified otherwise.';

        if (data.replyLength && data.replyLength !== 'auto') {
          const lengthMap = {
            short: '1-2 sentences',
            medium: '2-4 sentences',
            long: 'detailed'
          };
          systemInstruction += '\n\nPlease provide a ' + lengthMap[data.replyLength] + ' response.';
        }

        if (data.faqData && data.faqData.length > 0) {
          systemInstruction += '\n\nKnowledge Base (FAQ):\n' + data.faqData.map(f => 'Q: ' + f.q + '\nA: ' + f.a).join('\n---\n');
          systemInstruction += '\n\nPlease use the above information to answer questions if relevant, but keep the conversation natural.';
        }

        const messages = [
          { role: 'system', content: systemInstruction },
          ...request.context
        ];

        if (request.context.length === 0) {
          messages.push({ role: 'user', content: 'Hello! Please introduce yourself.' });
        }

        let apiUrl = (data.apiUrl || 'https://api.openai.com/v1/chat/completions').replace(/\/+$/, '');
        if (!apiUrl.endsWith('/chat/completions') && !apiUrl.endsWith('/messages')) {
          apiUrl += '/chat/completions';
        }

        const bodyData = {
          model: data.modelName || 'gpt-3.5-turbo',
          messages: messages
        };

        if (!bodyData.model.startsWith('o1') && !bodyData.model.startsWith('o3')) {
          bodyData.temperature = 0.7;
        }

        // Track response time
        const startTime = Date.now();

        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.apiKey.trim()}`
          },
          body: JSON.stringify(bodyData)
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        let reply = 'No reply generated.';
        if (result.choices && result.choices.length > 0) {
          reply = result.choices[0].message?.content || result.choices[0].text || '';
        } else if (result.content && result.content.length > 0) {
          reply = result.content[0].text || '';
        } else if (result.message && result.message.content) {
          reply = result.message.content;
        }
        reply = reply.trim();
        
        // Save to history
        await addToHistory(reply, request.context);
        
        // Update statistics
        const stats = await chrome.storage.sync.get({
          totalReplies: 0,
          totalResponseTime: 0,
          successCount: 0,
          failedCount: 0,
          lastUsedModel: ''
        });
        
        await chrome.storage.sync.set({
          totalReplies: (stats.totalReplies || 0) + 1,
          totalResponseTime: (stats.totalResponseTime || 0) + responseTime,
          successCount: (stats.successCount || 0) + 1,
          lastUsedModel: data.modelName || 'gpt-3.5-turbo'
        });
        
        sendResponse({ success: true, reply });
      } catch (error) {
        // Track failed requests
        const stats = await chrome.storage.sync.get({ failedCount: 0 });
        await chrome.storage.sync.set({ failedCount: (stats.failedCount || 0) + 1 });
        
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }
  
  // Get reply history
  if (request.action === 'getHistory') {
    chrome.storage.sync.get({ replyHistory: [] }, (data) => {
      sendResponse({ success: true, history: data.replyHistory });
    });
    return true;
  }
  
  // Clear history
  if (request.action === 'clearHistory') {
    chrome.storage.sync.set({ replyHistory: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});