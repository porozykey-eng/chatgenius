
function injectFonts() {
  if (!document.getElementById('wa-ai-fonts')) {
    const link = document.createElement('link');
    link.id = 'wa-ai-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    
    const style = document.createElement('style');
    style.innerHTML = '@keyframes wa-ai-pulse {' +
                      '  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }' +
                      '  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }' +
                      '  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }' +
                      '}' +
                      '.wa-ai-pulse {' +
                      '  animation: wa-ai-pulse 2s infinite;' +
                      '}' +
                      '@keyframes holoGradient {' +
                      '  0% { background-position: 0% 50%; }' +
                      '  50% { background-position: 100% 50%; }' +
                      '  100% { background-position: 0% 50%; }' +
                      '}';
    document.head.appendChild(style);
  }
}

// Create floating status toast
function createStatusToast() {
  let toast = document.getElementById('wa-ai-status-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wa-ai-status-toast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: rgba(20, 20, 22, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 100px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: none;
      align-items: center;
      gap: 10px;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    `;
    document.body.appendChild(toast);
  }
  return toast;
}

function showToast(message, type = 'info', duration = 3000) {
  const toast = createStatusToast();
  let icon = '🤖';
  if (type === 'loading') icon = '<svg class="wa-ai-spin" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';
  if (type === 'success') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  if (type === 'error') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  toast.innerHTML = `<style>.wa-ai-spin { animation: wa-ai-spin 1s linear infinite; } @keyframes wa-ai-spin { 100% { transform: rotate(360deg); } }</style><span style="display:flex;align-items:center;">${icon}</span><span>${message}</span>`;
  toast.style.display = 'flex';
  
  // Trigger reflow
  void toast.offsetWidth;
  
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, duration);
  }
}

// Platform detection
const PLATFORMS = {
  WHATSAPP: 'whatsapp',
  MESSENGER: 'messenger'
};

function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes('whatsapp.com')) return PLATFORMS.WHATSAPP;
  if (host.includes('messenger.com') || host.includes('facebook.com')) return PLATFORMS.MESSENGER;
  return null;
}

// Make button draggable with long-press to start drag
function makeDraggable(el) {
  let isDragging = false;
  let isLongPress = false;
  let startX, startY, initialLeft, initialTop;
  let animationFrameId = null;
  let currentX, currentY;
  let longPressTimer = null;
  const LONG_PRESS_DELAY = 500; // 500ms to start dragging

  el.addEventListener('pointerdown', dragStart);

  function dragStart(e) {
    if (e.button !== 0) return; // Only left click

    e.preventDefault();
    isDragging = false;
    isLongPress = false;

    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;

    // Get current computed style
    const rect = el.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // Start long-press timer
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      // Visual feedback for long-press activation
      el.style.transform = 'scale(1.1)';
      el.style.transition = 'transform 0.2s ease';

      // Temporarily disable transitions for smooth dragging
      el.style.transition = 'none';

      // Convert right/bottom to left/top for consistent dragging
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.left = initialLeft + 'px';
      el.style.top = initialTop + 'px';
    }, LONG_PRESS_DELAY);

    document.addEventListener('pointermove', drag);
    document.addEventListener('pointerup', dragEnd);
    document.addEventListener('pointercancel', dragEnd);
  }

  function updatePosition() {
    if (!isDragging) return;

    const dx = currentX - startX;
    const dy = currentY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Keep within window bounds
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - el.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - el.offsetHeight));

    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';

    animationFrameId = requestAnimationFrame(updatePosition);
  }

  function drag(e) {
    currentX = e.clientX;
    currentY = e.clientY;

    const dx = currentX - startX;
    const dy = currentY - startY;

    // Cancel long-press timer if moved before timeout
    if (longPressTimer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // Only start dragging if long-press was activated and moved more than 3 pixels
    if (isLongPress && !isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      isDragging = true;
      el.style.transform = 'scale(1)'; // Reset scale when dragging starts
      animationFrameId = requestAnimationFrame(updatePosition);
    }
  }

  function dragEnd(e) {
    // Clear long-press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    document.removeEventListener('pointermove', drag);
    document.removeEventListener('pointerup', dragEnd);
    document.removeEventListener('pointercancel', dragEnd);

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Restore transition
    el.style.transition = 'all 0.2s ease';
    el.style.transform = 'scale(1)'; // Reset scale

    if (isDragging) {
      // Save button position to storage
      const rect = el.getBoundingClientRect();
      chrome.storage.sync.set({
        btnPosition: {
          left: rect.left,
          top: rect.top
        }
      });

      // Prevent click event from firing after a drag
      const preventClick = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        el.removeEventListener('click', preventClick, true);
      };
      el.addEventListener('click', preventClick, true);

      // Reset isDragging after a short delay so normal clicks work again
      setTimeout(() => {
        isDragging = false;
        isLongPress = false;
      }, 50);
    } else {
      // Reset long-press state if no drag occurred
      isLongPress = false;
    }
  }
}

// Create and inject the AI Reply button
function createAIButton() {
  const btn = document.createElement('button');
  btn.id = 'wa-ai-reply-btn';
  btn.className = 'wa-ai-pulse';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>AI</span>';
  
  chrome.storage.sync.get({ btnOpacity: 100, btnTheme: 'gradient', btnPosition: null, shortcut: 'Alt + 1' }, (data) => {
    const opacity = data.btnOpacity / 100;
    const theme = data.btnTheme || 'gradient';
    const savedPosition = data.btnPosition;
    const shortcut = data.shortcut;

    // Add shortcut tooltip
    if (shortcut) {
      btn.title = `AI 回复 (${shortcut})\n长按可拖拽`;
    } else {
      btn.title = 'AI 回复\n长按可拖拽';
    }

    let themeStyles = '';
    let hoverStyles = '';
    
    switch(theme) {
      case 'glass':
        themeStyles = `
          background: rgba(255, 255, 255, ${opacity * 0.12});
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        `;
        hoverStyles = `background: rgba(255, 255, 255, ${opacity * 0.2}); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);`;
        break;
      case 'neon':
        themeStyles = `
          background: rgba(0, 0, 0, ${opacity * 0.9});
          color: #00ffcc;
          border: 1px solid rgba(0, 255, 204, 0.5);
          box-shadow: 0 0 12px rgba(0, 255, 204, 0.3), inset 0 0 12px rgba(0, 255, 204, 0.1);
        `;
        hoverStyles = `box-shadow: 0 0 20px rgba(0, 255, 204, 0.5), inset 0 0 16px rgba(0, 255, 204, 0.2);`;
        break;
      case 'minimal':
        themeStyles = `
          background: rgba(255, 255, 255, ${opacity});
          color: #1d1d1f;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        `;
        hoverStyles = `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); transform: translateY(-1px);`;
        break;
      case 'gradient':
      default:
        themeStyles = `
          background: linear-gradient(135deg, rgba(102, 126, 234, ${opacity}), rgba(118, 75, 162, ${opacity}));
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 16px rgba(102, 126, 234, ${opacity * 0.4});
        `;
        hoverStyles = `box-shadow: 0 6px 24px rgba(102, 126, 234, ${opacity * 0.5}); transform: translateY(-1px);`;
        break;
    }

    // Use saved position or default
    const positionStyles = savedPosition 
      ? `left: ${savedPosition.left}px; top: ${savedPosition.top}px; right: auto; bottom: auto;`
      : 'right: 20px; bottom: 80px;';

    btn.style.cssText = `
      position: fixed;
      ${positionStyles}
      z-index: 9999;
      border-radius: 12px;
      padding: 12px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: grab;
      display: none;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      letter-spacing: -0.01em;
      outline: none;
      ${themeStyles}
    `;
    
    btn.onmouseover = () => {
      if (!btn.disabled) {
        const rect = btn.getBoundingClientRect();
        const currentPosStyles = `left: ${rect.left}px; top: ${rect.top}px; right: auto; bottom: auto;`;
        const currentStyles = `
          position: fixed;
          ${currentPosStyles}
          z-index: 9999;
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: grab;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          letter-spacing: -0.01em;
          outline: none;
          ${themeStyles}
        `;
        btn.style.cssText = currentStyles + hoverStyles;
      }
    };
    
    btn.onmouseout = () => {
      const rect = btn.getBoundingClientRect();
      const currentPosStyles = `left: ${rect.left}px; top: ${rect.top}px; right: auto; bottom: auto;`;
      btn.style.cssText = `
        position: fixed;
        ${currentPosStyles}
        z-index: 9999;
        border-radius: 12px;
        padding: 12px 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: -0.01em;
        outline: none;
        ${themeStyles}
      `;
    };
  });

  btn.addEventListener('click', handleGenerateReply);
  makeDraggable(btn);
  return btn;
}

// Extract chat history based on platform
function getChatContext(platform) {
  const messages = [];
  
  if (platform === PLATFORMS.WHATSAPP) {
    const rows = document.querySelectorAll('div[role="row"]');
    const recentRows = Array.from(rows).slice(-20);
    
    recentRows.forEach(row => {
      const isOut = row.querySelectorAll('div.message-out').length > 0 || 
                    row.innerHTML.includes('message-out') ||
                    (row.getAttribute('data-id') && row.getAttribute('data-id').startsWith('true_'));
      
      let text = '';
      
      // WhatsApp text is usually inside a span within .selectable-text
      const selectableSpans = row.querySelectorAll('.selectable-text span.selectable-text, .selectable-text span[dir="ltr"], .selectable-text span[dir="rtl"]');
      if (selectableSpans.length > 0) {
        text = Array.from(selectableSpans).map(s => s.innerText).join(' ');
      } else {
        const selectable = row.querySelector('.selectable-text');
        if (selectable) {
          text = selectable.innerText;
        }
      }
      
      // Fallback for some WhatsApp versions
      if (!text || !text.trim()) {
        const copyable = row.querySelector('.copyable-text span');
        if (copyable) text = copyable.innerText;
      }
      
      // Check for images
      const imgs = row.querySelectorAll('img');
      let hasImage = false;
      imgs.forEach(img => {
        if (img.src && img.src.startsWith('blob:')) {
          hasImage = true;
        }
      });
      if (hasImage) {
        text += ' [User attached an image/document]';
      }
      
      if (text && text.trim()) {
        // Ignore messages that are just timestamps
        if (!/^\d{1,2}:\d{2}$/.test(text.trim())) {
          messages.push({ role: isOut ? 'assistant' : 'user', content: text.trim() });
        }
      }
    });
  } 
  else if (platform === PLATFORMS.MESSENGER) {
    const rows = document.querySelectorAll('div[role="row"]');
    const recentRows = Array.from(rows).slice(-20);
    recentRows.forEach(row => {
      const textDiv = row.querySelector('div[dir="auto"]');
      if (textDiv && textDiv.innerText.trim()) {
        const rect = textDiv.getBoundingClientRect();
        const isOut = rect.left > window.innerWidth / 2;
        messages.push({ role: isOut ? 'assistant' : 'user', content: textDiv.innerText.trim() });
      }
    });
  }
  
  return messages;
}

// Insert text into input box based on platform
function insertTextIntoInput(text, platform) {
  let inputEl = null;
  
  if (platform === PLATFORMS.WHATSAPP) {
    // Specifically target the message compose box, avoiding the search box
    // The main chat input is usually inside #main footer
    inputEl = document.querySelector('#main footer div[contenteditable="true"][data-tab="10"]') || 
              document.querySelector('#main footer div[contenteditable="true"]');
  } 
  else if (platform === PLATFORMS.MESSENGER) {
    inputEl = document.querySelector('div[contenteditable="true"][role="textbox"]') || 
              document.querySelector('div[aria-label="Message"][contenteditable="true"]') ||
              document.querySelector('div[aria-label="Message"]');
  }

  if (!inputEl) {
    console.error("Could not find input box for platform: " + platform);
    return false;
  }

  inputEl.focus();
  
  setTimeout(() => {
    document.execCommand('insertText', false, text);
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  }, 100);
  
  return true;
}

// Check if chat is active
function isChatActive(platform) {
  if (platform === PLATFORMS.WHATSAPP) {
    // Specifically target the message compose box area
    return !!document.querySelector('#main footer div[contenteditable="true"]') || document.querySelectorAll('div[role="row"]').length > 0;
  }
  else if (platform === PLATFORMS.MESSENGER) {
    return !!document.querySelector('div[contenteditable="true"][role="textbox"]') || 
           !!document.querySelector('div[aria-label="Message"][contenteditable="true"]') ||
           !!document.querySelector('div[aria-label="Message"]');
  }
  return false;
}

// Handle button click
function handleGenerateReply(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const platform = detectPlatform();
  if (!platform) return;

  const btn = e.currentTarget;
  const originalHTML = btn.innerHTML;
  
  // Typing indicator animation
  btn.innerHTML = `
    <style>
      .wa-ai-typing { display: flex; align-items: center; gap: 4px; height: 20px; }
      .wa-ai-dot { width: 4px; height: 4px; background: currentColor; border-radius: 50%; animation: wa-ai-bounce 1.4s infinite ease-in-out both; }
      .wa-ai-dot:nth-child(1) { animation-delay: -0.32s; }
      .wa-ai-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes wa-ai-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    </style>
    <div class="wa-ai-typing">
      <div class="wa-ai-dot"></div>
      <div class="wa-ai-dot"></div>
      <div class="wa-ai-dot"></div>
    </div>
  `;
  
  btn.disabled = true;
  btn.style.cursor = 'wait';
  btn.style.boxShadow = '0 0 25px #6366f1, 0 0 50px rgba(99, 102, 241, 0.5)';
  btn.style.transform = 'scale(0.98)';

  showToast('AI 正在思考回复...', 'loading', 0);

  const context = getChatContext(platform);
  
  if (context.length === 0) {
    showToast('未找到聊天记录，请打开一个包含消息的聊天窗口。', 'error');
    resetButton(btn, originalHTML);
    hideRegenerateButton();
    return;
  }

  // Store context for regenerate functionality
  lastContext = context;

  chrome.runtime.sendMessage({ action: 'generateReply', context: context }, (response) => {
    resetButton(btn, originalHTML);
    
    if (chrome.runtime.lastError) {
      showToast('插件连接错误: ' + chrome.runtime.lastError.message + ' (请刷新页面重试)', 'error', 5000);
      hideRegenerateButton();
      return;
    }
    
    if (response && response.success) {
      const success = insertTextIntoInput(response.reply, platform);
      if (success) {
        showToast('回复已生成！点击左侧按钮可重新生成。', 'success', 3000);
        showRegenerateButton();
      } else {
        showToast('回复已生成，但无法自动填充，请手动复制。', 'error');
        console.log('Generated Reply:', response.reply);
        showRegenerateButton();
      }
    } else {
      let errorMsg = response?.error || '未知错误，请检查 API 设置。';
      // Rationalize error messages
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = '网络请求失败，请检查您的网络连接或 API 地址是否正确。';
      } else if (errorMsg.includes('401')) {
        errorMsg = 'API 密钥无效或未授权 (HTTP 401)，请检查您的 API Key。';
      } else if (errorMsg.includes('404')) {
        errorMsg = 'API 地址不存在 (HTTP 404)，请检查 API URL 是否正确。';
      } else if (errorMsg.includes('429')) {
        errorMsg = '请求过于频繁或额度耗尽 (HTTP 429)，请稍后再试或检查账户余额。';
      } else if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
        errorMsg = 'AI 服务端错误 (' + errorMsg.match(/\d{3}/)?.[0] + ')，请稍后再试。';
      }
      showToast('AI 回复出错: ' + errorMsg, 'error', 6000);
      hideRegenerateButton();
    }
  });
}

function resetButton(btn, originalHTML) {
  btn.innerHTML = originalHTML;
  btn.disabled = false;
  btn.style.cursor = 'grab';
  btn.style.transform = '';
  // Re-apply theme-specific box shadow by triggering mouseout
  btn.dispatchEvent(new Event('mouseout'));
}

// Last context for regenerate functionality
let lastContext = null;

// Create regenerate button
function createRegenerateButton() {
  const regenBtn = document.createElement('button');
  regenBtn.id = 'wa-ai-regen-btn';
  regenBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 2v6h-6"></path>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
      <path d="M3 22v-6h6"></path>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
  `;
  regenBtn.title = '重新生成回复';
  regenBtn.style.cssText = `
    position: fixed;
    z-index: 9998;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.3);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-family: 'Inter', -apple-system, sans-serif;
  `;
  
  regenBtn.onmouseover = () => {
    regenBtn.style.background = '#667eea';
    regenBtn.style.color = '#ffffff';
    regenBtn.style.transform = 'scale(1.1)';
  };
  
  regenBtn.onmouseout = () => {
    regenBtn.style.background = 'rgba(255, 255, 255, 0.95)';
    regenBtn.style.color = '#667eea';
    regenBtn.style.transform = 'scale(1)';
  };
  
  regenBtn.addEventListener('click', handleRegenerate);
  
  return regenBtn;
}

// Handle regenerate click
function handleRegenerate(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!lastContext || lastContext.length === 0) {
    showToast('没有可用的聊天记录进行重新生成', 'error');
    return;
  }
  
  const btn = e.currentTarget;
  const mainBtn = document.getElementById('wa-ai-reply-btn');
  const platform = detectPlatform();
  
  // Show loading on regenerate button
  btn.innerHTML = `
    <svg class="wa-ai-spin" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
  `;
  btn.disabled = true;
  
  showToast('重新生成回复...', 'loading', 0);
  
  chrome.runtime.sendMessage({ action: 'generateReply', context: lastContext }, (response) => {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
      </svg>
    `;
    btn.disabled = false;
    
    if (chrome.runtime.lastError) {
      showToast('插件连接错误: ' + chrome.runtime.lastError.message, 'error', 5000);
      return;
    }
    
    if (response && response.success) {
      const success = insertTextIntoInput(response.reply, platform);
      if (success) {
        showToast('回复已重新生成！', 'success');
      } else {
        showToast('回复已生成，但无法自动填充', 'error');
        console.log('Regenerated Reply:', response.reply);
      }
    } else {
      let errorMsg = response?.error || '未知错误';
      showToast('重新生成失败: ' + errorMsg, 'error', 5000);
    }
  });
}

// Update regenerate button position
function updateRegenButtonPosition() {
  const mainBtn = document.getElementById('wa-ai-reply-btn');
  const regenBtn = document.getElementById('wa-ai-regen-btn');
  
  if (!mainBtn || !regenBtn) return;
  
  const rect = mainBtn.getBoundingClientRect();
  regenBtn.style.left = (rect.left - 44) + 'px';
  regenBtn.style.top = (rect.top + (rect.height / 2) - 18) + 'px';
}

// Show/hide regenerate button
function showRegenerateButton() {
  const regenBtn = document.getElementById('wa-ai-regen-btn');
  if (regenBtn) {
    updateRegenButtonPosition();
    regenBtn.style.display = 'flex';
  }
}

function hideRegenerateButton() {
  const regenBtn = document.getElementById('wa-ai-regen-btn');
  if (regenBtn) {
    regenBtn.style.display = 'none';
  }
}

function updateButtonVisibility() {
  const btn = document.getElementById('wa-ai-reply-btn');
  if (!btn) return;
  
  const platform = detectPlatform();
  if (isChatActive(platform)) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
    hideRegenerateButton();
  }
}

// Observe DOM changes to inject button and update visibility
const observer = new MutationObserver(() => {
  if (!document.getElementById('wa-ai-reply-btn')) {
    injectFonts();
    document.body.appendChild(createAIButton());
  }
  if (!document.getElementById('wa-ai-regen-btn')) {
    document.body.appendChild(createRegenerateButton());
  }
  updateButtonVisibility();
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Initial check
setTimeout(() => {
  if (!document.getElementById('wa-ai-reply-btn')) {
    injectFonts();
    document.body.appendChild(createAIButton());
  }
  if (!document.getElementById('wa-ai-regen-btn')) {
    document.body.appendChild(createRegenerateButton());
  }
  updateButtonVisibility();
}, 2000);

// Shortcut listener
let currentShortcut = '';
chrome.storage.sync.get({ shortcut: 'Alt + 1' }, (data) => {
  currentShortcut = data.shortcut;
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.shortcut) {
    currentShortcut = changes.shortcut.newValue;
  }
  if (namespace === 'sync' && (changes.btnTheme || changes.btnOpacity)) {
    // Recreate button if theme or opacity changes
    const oldBtn = document.getElementById('wa-ai-reply-btn');
    if (oldBtn) oldBtn.remove();
    document.body.appendChild(createAIButton());
  }
});

document.addEventListener('keydown', (e) => {
  if (!currentShortcut) return;
  
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.altKey) keys.push('Alt');
  if (e.shiftKey) keys.push('Shift');
  if (e.metaKey) keys.push('Cmd');
  if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
    keys.push(e.key.toUpperCase());
  }
  const pressed = keys.join(' + ');
  
  if (pressed === currentShortcut && keys.length > 0) {
    e.preventDefault();
    const btn = document.getElementById('wa-ai-reply-btn');
    if (btn && btn.style.display !== 'none' && !btn.disabled) {
      btn.click();
    }
  }
});
