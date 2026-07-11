
function injectFonts() {
  if (!document.getElementById('wa-ai-fonts')) {
    const link = document.createElement('link');
    link.id = 'wa-ai-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    
    const style = document.createElement('style');
    style.textContent = '@keyframes wa-ai-pulse {' +
                      '  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }' +
                      '  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }' +
                      '  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }' +
                      '}' +
                      '.wa-ai-pulse {' +
                      '  animation: wa-ai-pulse 2s infinite;' +
                      '}' +
                      '@keyframes holoGradient {' +
                      '  0% { background-position: 0% 50%; }' +
                      '  50% { background-position: 100% 50%; }' +
                      '  100% { background-position: 0% 50%; }' +
                      '}' +
                      '.wa-ai-spin { animation: wa-ai-spin 1s linear infinite; }' +
                      '@keyframes wa-ai-spin { 100% { transform: rotate(360deg); } }' +
                      '@keyframes wa-ai-menu-in {' +
                      '  from { opacity: 0; transform: scale(0.95) translateY(-10px); }' +
                      '  to { opacity: 1; transform: scale(1) translateY(0); }' +
                      '}' +
                      '@keyframes wa-ai-modal-in {' +
                      '  from { opacity: 0; transform: scale(0.95) translateY(20px); }' +
                      '  to { opacity: 1; transform: scale(1) translateY(0); }' +
                      '}' +
                      '@keyframes wa-ai-bounce {' +
                      '  0%, 80%, 100% { transform: scale(0); }' +
                      '  40% { transform: scale(1); }' +
                      '}' +
                      '.wa-ai-typing { display: flex; align-items: center; gap: 4px; height: 20px; }' +
                      '.wa-ai-dot { width: 4px; height: 4px; background: currentColor; border-radius: 50%; animation: wa-ai-bounce 1.4s infinite ease-in-out both; }' +
                      '.wa-ai-dot:nth-child(1) { animation-delay: -0.32s; }' +
                      '.wa-ai-dot:nth-child(2) { animation-delay: -0.16s; }';
    document.head.appendChild(style);
  }
}

// Theme detection for injected UI - adapts to host page (WhatsApp/Messenger) theme
function detectHostTheme() {
  // Check WhatsApp's data-theme attribute
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  if (htmlTheme === 'light') return 'light';
  if (htmlTheme === 'dark') return 'dark';
  // Check body background color brightness
  const bg = window.getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const brightness = (parseInt(match[1]) * 299 + parseInt(match[2]) * 587 + parseInt(match[3]) * 114) / 1000;
    return brightness > 128 ? 'light' : 'dark';
  }
  return 'dark'; // default
}

// Returns color scheme for injected UI based on host theme
function getInjectUIColors() {
  const theme = detectHostTheme();
  if (theme === 'light') {
    return {
      bg: 'linear-gradient(145deg, #ffffff, #f4f4f5)',
      bgSolid: '#ffffff',
      text: '#09090b',
      textSecondary: '#71717a',
      border: 'rgba(0,0,0,0.08)',
      inputBg: 'rgba(0,0,0,0.03)',
      inputBorder: 'rgba(0,0,0,0.1)',
      inputText: '#09090b',
      hoverBg: 'rgba(124,58,237,0.08)',
      shadow: '0 20px 60px rgba(0,0,0,0.15),0 0 0 1px rgba(0,0,0,0.06)',
      accent: '#7c3aed'
    };
  }
  return {
    bg: 'linear-gradient(145deg, #1a1a2e, #16213e)',
    bgSolid: '#1a1a2e',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    border: 'rgba(255,255,255,0.1)',
    inputBg: 'rgba(0,0,0,0.3)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText: '#e2e8f0',
    hoverBg: 'rgba(124,58,237,0.2)',
    shadow: '0 20px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.1)',
    accent: '#7c3aed'
  };
}

// Create floating status toast
function createStatusToast() {
  let toast = document.getElementById('wa-ai-status-toast');
  if (!toast) {
    const c = getInjectUIColors();
    toast = document.createElement('div');
    toast.id = 'wa-ai-status-toast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: ${c.bgSolid};
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: ${c.text};
      padding: 12px 24px;
      border-radius: 100px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
      border: 1px solid ${c.border};
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

let _toastHideTimer = null;
let _toastFadeTimer = null;

function showToast(message, type = 'info', duration = 3000) {
  // Clear pending timers from previous toast to prevent display conflicts
  if (_toastHideTimer) { clearTimeout(_toastHideTimer); _toastHideTimer = null; }
  if (_toastFadeTimer) { clearTimeout(_toastFadeTimer); _toastFadeTimer = null; }

  const toast = createStatusToast();
  
  // Build icon using DOM methods (static trusted SVG markup)
  const iconWrapper = document.createElement('span');
  iconWrapper.style.cssText = 'display:flex;align-items:center;';
  
  if (type === 'loading') {
    iconWrapper.innerHTML = '<svg class="wa-ai-spin" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';
  } else if (type === 'success') {
    iconWrapper.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconWrapper.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  } else {
    iconWrapper.textContent = '🤖';
  }
  
  // Build message span using textContent (prevents XSS)
  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  msgSpan.style.cssText = 'flex:1;';
  
  // Clear and rebuild toast content
  toast.textContent = '';
  toast.appendChild(iconWrapper);
  toast.appendChild(msgSpan);

  // Add close button for error toasts (stays visible longer)
  if (type === 'error') {
    const c = getInjectUIColors();
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `background:none;border:none;color:${c.textSecondary};cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px;margin-left:8px;flex-shrink:0;`;
    closeBtn.onmouseover = () => { closeBtn.style.color = c.text; };
    closeBtn.onmouseout = () => { closeBtn.style.color = c.textSecondary; };
    closeBtn.addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      _toastFadeTimer = setTimeout(() => { toast.style.display = 'none'; _toastFadeTimer = null; }, 400);
    });
    toast.appendChild(closeBtn);
  }
  
  toast.style.display = 'flex';
  
  // Trigger reflow
  void toast.offsetWidth;
  
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  if (duration > 0) {
    _toastHideTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      _toastFadeTimer = setTimeout(() => { toast.style.display = 'none'; _toastFadeTimer = null; }, 400);
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
  const SNAP_THRESHOLD = 30; // Distance from edge to snap
  const SNAP_ANIMATION_DURATION = 300;

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
      // Visual feedback: dashed border ring + "可拖拽" label
      el.style.transform = 'scale(1.08)';
      el.style.outline = '2px dashed rgba(255,255,255,0.7)';
      el.style.outlineOffset = '4px';
      el.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), outline 0.2s ease';

      // Show draggable hint label
      let hint = document.getElementById('wa-ai-drag-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'wa-ai-drag-hint';
        hint.textContent = '可拖拽';
        hint.style.cssText = 'position:fixed;z-index:10000;background:rgba(0,0,0,0.75);color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;pointer-events:none;font-family:Inter,sans-serif;transition:opacity 0.2s;';
        document.body.appendChild(hint);
      }
      const btnRect = el.getBoundingClientRect();
      hint.style.left = (btnRect.left + btnRect.width / 2 - hint.offsetWidth / 2) + 'px';
      hint.style.top = (btnRect.bottom + 6) + 'px';
      hint.style.opacity = '1';
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Temporarily disable transitions for smooth dragging
      setTimeout(() => {
        el.style.transition = 'none';
      }, 200);

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

  function snapToEdge() {
    const rect = el.getBoundingClientRect();
    const btnWidth = el.offsetWidth;
    const btnHeight = el.offsetHeight;
    
    let newLeft = rect.left;
    let newTop = rect.top;
    let snapped = false;
    
    // Check horizontal edges
    if (rect.left < SNAP_THRESHOLD) {
      newLeft = 10;
      snapped = true;
    } else if (rect.left + btnWidth > window.innerWidth - SNAP_THRESHOLD) {
      newLeft = window.innerWidth - btnWidth - 10;
      snapped = true;
    }
    
    // Check vertical edges
    if (rect.top < SNAP_THRESHOLD) {
      newTop = 10;
      snapped = true;
    } else if (rect.top + btnHeight > window.innerHeight - SNAP_THRESHOLD) {
      newTop = window.innerHeight - btnHeight - 10;
      snapped = true;
    }
    
    if (snapped) {
      el.style.transition = `all ${SNAP_ANIMATION_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
      
      // Visual feedback for snap
      el.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.6)';
      setTimeout(() => {
        el.style.boxShadow = '';
        // Restore normal transition after snap animation
        setTimeout(() => {
          el.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        }, SNAP_ANIMATION_DURATION);
      }, SNAP_ANIMATION_DURATION);
    }
    
    return { left: newLeft, top: newTop };
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
      el.style.outline = 'none';
      el.style.outlineOffset = '';
      el.style.cursor = 'grabbing';
      // Hide drag hint
      const dragHint = document.getElementById('wa-ai-drag-hint');
      if (dragHint) dragHint.style.opacity = '0';
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
      el.style.cursor = 'grab';
      
      // Snap to edge and get final position
      const finalPosition = snapToEdge();
      
      // Save button position to storage after snap animation
      setTimeout(() => {
        chrome.storage.sync.set({
          btnPosition: finalPosition
        });
      }, SNAP_ANIMATION_DURATION);

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
        // Clean up drag hint
        const h = document.getElementById('wa-ai-drag-hint');
        if (h) h.remove();
      }, 150);
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
  // Pulse animation only on hover (not constant) to reduce visual fatigue
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>AI</span>';
  
  chrome.storage.sync.get({ btnOpacity: 100, btnTheme: 'gradient', btnPosition: null, shortcut: 'Alt + 1' }, (data) => {
    const opacity = data.btnOpacity / 100;
    const theme = data.btnTheme || 'gradient';
    const savedPosition = data.btnPosition;
    const shortcut = data.shortcut;

    // Add shortcut tooltip with usage hints
    if (shortcut) {
      btn.title = `AI 回复 (${shortcut})\n右键更多选项 · 长按可拖拽`;
    } else {
      btn.title = 'AI 回复\n右键更多选项 · 长按可拖拽';
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
          background: linear-gradient(135deg, rgba(124, 58, 237, ${opacity}), rgba(118, 75, 162, ${opacity}));
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 16px rgba(124, 58, 237, ${opacity * 0.4});
        `;
        hoverStyles = `box-shadow: 0 6px 24px rgba(124, 58, 237, ${opacity * 0.5}); transform: translateY(-1px);`;
        break;
    }

    // Use saved position or default
    const positionStyles = savedPosition 
      ? `left: ${savedPosition.left}px; top: ${savedPosition.top}px; right: auto; bottom: auto;`
      : 'right: 20px; bottom: 80px;';

    // Helper: generate base button styles with current position
    function getBaseStyles(display) {
      const rect = btn.getBoundingClientRect();
      const posStyles = rect.width > 0
        ? `left: ${rect.left}px; top: ${rect.top}px; right: auto; bottom: auto;`
        : positionStyles;
      return `
        position: fixed;
        ${posStyles}
        z-index: 9999;
        border-radius: 12px;
        padding: 12px 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: grab;
        display: ${display};
        align-items: center;
        gap: 8px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: -0.01em;
        outline: none;
        ${themeStyles}
      `;
    }

    btn.style.cssText = getBaseStyles('none');
    
    btn.onmouseover = () => {
      if (!btn.disabled) {
        btn.classList.add('wa-ai-pulse'); // Pulse only on hover
        btn.style.cssText = getBaseStyles('flex') + hoverStyles;
      }
    };
    
    btn.onmouseout = () => {
      btn.classList.remove('wa-ai-pulse'); // Stop pulse when leaving
      btn.style.cssText = getBaseStyles('flex');
    };
  });

  btn.addEventListener('click', handleGenerateReply);
  
  // Right-click context menu for quick options
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showQuickMenu(e.clientX, e.clientY);
  });
  
  makeDraggable(btn);
  return btn;
}

// Show first-use guide bubble next to the AI button
function showFirstUseBubble(btn) {
  chrome.storage.local.get({ guideBubbleShown: false }, (data) => {
    if (data.guideBubbleShown) return;
    // Wait for button to be visible
    const waitForVisible = setInterval(() => {
      // M1 修复：按钮被移除时停止轮询，避免 setInterval 永不清理
      if (!document.body.contains(btn)) {
        clearInterval(waitForVisible);
        return;
      }
      if (btn.offsetWidth > 0) {
        clearInterval(waitForVisible);
        const c = getInjectUIColors();
        const bubble = document.createElement('div');
        bubble.id = 'wa-ai-guide-bubble';
        bubble.style.cssText = `
          position:fixed;z-index:10001;
          background:${c.bg};
          border-radius:12px;padding:14px 18px;
          box-shadow:${c.shadow};
          color:${c.text};font-family:'Inter',-apple-system,sans-serif;
          font-size:13px;line-height:1.7;
          max-width:240px;
          animation:wa-ai-menu-in 0.2s cubic-bezier(0.16,1,0.3,1);
        `;
        bubble.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="color:${c.text};font-weight:600;font-size:14px;">💡 快速上手</span>
            <button id="wa-ai-bubble-close" style="background:none;border:none;color:${c.textSecondary};cursor:pointer;font-size:16px;padding:0 2px;">✕</button>
          </div>
          <div>🖱️ <b>左键</b> 生成回复</div>
          <div>📋 <b>右键</b> 切换风格</div>
          <div>✋ <b>长按</b> 拖拽移动</div>
        `;
        document.body.appendChild(bubble);
        // Position near button
        const r = btn.getBoundingClientRect();
        bubble.style.left = Math.min(r.left - 250, window.innerWidth - 260) + 'px';
        bubble.style.top = (r.top - 10) + 'px';
        if (parseFloat(bubble.style.left) < 10) {
          bubble.style.left = (r.right + 10) + 'px';
        }
        const dismiss = () => {
          bubble.style.opacity = '0';
          bubble.style.transition = 'opacity 0.2s';
          setTimeout(() => bubble.remove(), 300);
          chrome.storage.local.set({ guideBubbleShown: true });
        };
        bubble.querySelector('#wa-ai-bubble-close').addEventListener('click', dismiss);
        // Auto dismiss after 5s
        setTimeout(dismiss, 5000);
      }
    }, 200);
    // M1 修复：超时保护，30 秒后自动停止，避免按钮永远不可见时 setInterval 永不清理
    setTimeout(() => clearInterval(waitForVisible), 30000);
  });
}

// Extract chat history based on platform
function getChatContext(platform) {
  const messages = [];
  
  if (platform === PLATFORMS.WHATSAPP) {
    const rows = document.querySelectorAll('div[role="row"]');
    const recentRows = Array.from(rows).slice(-20);
    
    recentRows.forEach(row => {
      const isOut = row.querySelectorAll('div.message-out').length > 0 || 
                    row.querySelector('[class*="message-out"]') !== null ||
                    (row.getAttribute('data-id') && row.getAttribute('data-id').startsWith('true_'));
      
      let text = '';
      
      const selectableSpans = row.querySelectorAll('.selectable-text span.selectable-text, .selectable-text span[dir="ltr"], .selectable-text span[dir="rtl"]');
      if (selectableSpans.length > 0) {
        text = Array.from(selectableSpans).map(s => s.innerText).join(' ');
      } else {
        const selectable = row.querySelector('.selectable-text');
        if (selectable) {
          text = selectable.innerText;
        }
      }
      
      if (!text || !text.trim()) {
        const copyable = row.querySelector('.copyable-text span');
        if (copyable) text = copyable.innerText;
      }
      
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
    // Use modern approach instead of deprecated execCommand
    if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
      // For input/textarea elements, set value directly
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window[inputEl.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype, 'value').set;
      nativeInputValueSetter.call(inputEl, text);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (inputEl.isContentEditable) {
      // For contenteditable elements (WhatsApp/Messenger)
      // WhatsApp React 状态依赖 beforeinput/input 事件的 inputType 字段更新
      // 旧的 Selection API + appendChild 不触发这些事件，导致插入内容无法被 WhatsApp 识别
      inputEl.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      selection.removeAllRanges();
      selection.addRange(range);

      // 优先用 execCommand('insertText')：会触发正确的 beforeinput/input 事件链
      // WhatsApp 的 React handler 依赖此事件流更新内部状态
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, text);
      } catch (err) {
        inserted = false;
      }

      if (!inserted) {
        // Fallback：Selection API + InputEvent（带 inputType）手动派发
        selection.deleteFromDocument();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        // 用 InputEvent 替代普通 Event，携带 inputType 字段
        inputEl.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true, cancelable: true, inputType: 'insertText', data: text
        }));
        inputEl.dispatchEvent(new InputEvent('input', {
          bubbles: true, cancelable: true, inputType: 'insertText', data: text
        }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Fallback to execCommand only if necessary
      document.execCommand('insertText', false, text);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, 100);
  
  return true;
}

// ---- 打字机效果：逐字插入 + 思考动画 ----
let _thinkingIndicatorEl = null;

function _showThinkingIndicator(inputEl) {
  _hideThinkingIndicator();
  if (!inputEl) return;
  const rect = inputEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.id = 'wa-ai-thinking-indicator';
  // 定位在输入框上方
  const bottom = window.innerHeight - rect.top + 10;
  el.style.cssText = [
    'position:fixed',
    'bottom:' + bottom + 'px',
    'right:24px',
    'z-index:99999',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'padding:8px 14px',
    'background:rgba(67,97,238,0.1)',
    'border:1px solid rgba(67,97,238,0.3)',
    'border-radius:20px',
    'font-size:13px',
    'font-weight:500',
    'color:#4361ee',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)',
    'box-shadow:0 4px 12px rgba(67,97,238,0.15)',
    'transition:opacity 0.3s, transform 0.3s',
    'opacity:0',
    'transform:translateY(8px)'
  ].join(';');
  // spinner + 文字（用 textContent 防 XSS）
  const spinnerSvg = '<svg class="wa-ai-spin" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>';
  const label = document.createElement('span');
  label.textContent = detectPlatform() === PLATFORMS.WHATSAPP ? 'AI 思考中' : 'AI thinking';
  el.innerHTML = spinnerSvg;
  el.appendChild(label);
  document.body.appendChild(el);
  _thinkingIndicatorEl = el;
  // 触发进场动画
  void el.offsetWidth;
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';
}

function _hideThinkingIndicator() {
  if (_thinkingIndicatorEl) {
    const el = _thinkingIndicatorEl;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => { el.remove(); }, 300);
    _thinkingIndicatorEl = null;
  }
}

// 打字机逐字插入（返回 Promise<boolean>）
async function typewriterInsert(text, platform) {
  let inputEl = null;
  if (platform === PLATFORMS.WHATSAPP) {
    inputEl = document.querySelector('#main footer div[contenteditable="true"][data-tab="10"]') ||
              document.querySelector('#main footer div[contenteditable="true"]');
  } else if (platform === PLATFORMS.MESSENGER) {
    inputEl = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
              document.querySelector('div[aria-label="Message"][contenteditable="true"]') ||
              document.querySelector('div[aria-label="Message"]');
  }
  if (!inputEl) return false;

  inputEl.focus();
  _showThinkingIndicator(inputEl);

  // 等待 focus 生效
  await new Promise(r => setTimeout(r, 120));

  // 清空输入框
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(inputEl);
  selection.removeAllRanges();
  selection.addRange(range);
  selection.deleteFromDocument();

  // 逐字插入（Array.from 支持 emoji 等多字节字符）
  const chars = Array.from(text);
  const charDelay = 20; // 每字 20ms（快速但可见）

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // 优先 execCommand（触发 WhatsApp React 正确事件链）
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, char);
    } catch (err) {
      inserted = false;
    }

    if (!inserted) {
      // Fallback：Selection API + InputEvent
      const textNode = document.createTextNode(char);
      const r = document.createRange();
      r.selectNodeContents(inputEl);
      r.collapse(false);
      r.insertNode(textNode);
      r.setStartAfter(textNode);
      r.collapse(true);
      selection.removeAllRanges();
      selection.addRange(r);
      inputEl.dispatchEvent(new InputEvent('input', {
        bubbles: true, cancelable: true, inputType: 'insertText', data: char
      }));
    }

    await new Promise(r => setTimeout(r, charDelay));
  }

  _hideThinkingIndicator();
  return true;
}

// Check if chat is active
function isChatActive(platform) {
  if (platform === PLATFORMS.WHATSAPP) {
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
    <div class="wa-ai-typing">
      <div class="wa-ai-dot"></div>
      <div class="wa-ai-dot"></div>
      <div class="wa-ai-dot"></div>
    </div>
  `;
  
  btn.disabled = true;
  btn.style.cursor = 'wait';
  btn.style.boxShadow = '0 0 25px #7c3aed, 0 0 50px rgba(124, 58, 237, 0.5)';
  btn.style.transform = 'scale(0.98)';

  // Check remaining daily quota before generating
  chrome.storage.sync.get(['licenseType'], (licenseResult) => {
  chrome.storage.local.get(['dailyReplyCount'], (usageData) => {
    const dailyLimit = 20;
    const currentCount = usageData.dailyReplyCount || 0;
    const isPro = licenseResult && licenseResult.licenseType && licenseResult.licenseType !== 'free';

    // If free user and quota exhausted, show upgrade panel
    if (!isPro && currentCount >= dailyLimit) {
      resetButton(btn, originalHTML);
      showQuotaExhaustedPanel();
      return;
    }

  // Dynamic progress toast with staged text
  showToast('正在读取聊天记录...', 'loading', 0);
  const _toastStage1 = setTimeout(() => showToast('AI 正在思考...', 'loading', 0), 3000);
  const _toastStage2 = setTimeout(() => showToast('即将完成...', 'loading', 0), 6000);

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
    clearTimeout(_toastStage1);
    clearTimeout(_toastStage2);
    resetButton(btn, originalHTML);
    
    if (chrome.runtime.lastError) {
      showToast('插件连接错误: ' + chrome.runtime.lastError.message + ' (请刷新页面重试)', 'error', 5000);
      hideRegenerateButton();
      return;
    }
    
    if (response && response.success) {
      // Show preview modal instead of directly inserting
      showPreviewModal(response.reply);
      showToast('回复已生成！请预览编辑后插入。', 'success', 3000);
      showRegenerateButton();

      // Show remaining quota warning for free users
      if (!isPro) {
        const remaining = dailyLimit - (currentCount + 1);
        if (remaining > 0 && remaining <= 3) {
          setTimeout(() => {
            showToast(`今日剩余 ${remaining} 次，明天重置。`, 'info', 5000);
          }, 3500);
        }
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
      showToast('AI 回复出错: ' + errorMsg, 'error', 8000);
      hideRegenerateButton();
    }
  });
  }); // close chrome.storage.local.get callback
  }); // close chrome.storage.sync.get callback
}

function resetButton(btn, originalHTML) {
  btn.innerHTML = originalHTML;
  btn.disabled = false;
  btn.style.cursor = 'grab';
  btn.style.transform = '';
  // Re-apply theme-specific box shadow by triggering mouseout
  btn.dispatchEvent(new Event('mouseout'));
}

// Show quota exhausted panel with upgrade CTA
function showQuotaExhaustedPanel() {
  const c = getInjectUIColors();
  const panel = document.createElement('div');
  panel.id = 'wa-ai-quota-panel';
  panel.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);
    z-index:10001;width:360px;max-width:90vw;
    background:${c.bg};border-radius:16px;padding:24px;
    box-shadow:${c.shadow};
    font-family:'Inter',-apple-system,sans-serif;opacity:0;
    transition:opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),transform 0.25s cubic-bezier(0.16,1,0.3,1);
  `;
  panel.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">⏳</div>
      <h3 style="color:${c.text};font-size:16px;font-weight:600;margin:0 0 6px 0;">今日免费额度已用完</h3>
      <p style="color:${c.textSecondary};font-size:13px;margin:0 0 18px 0;">每天 20 次免费额度已耗尽，明天自动重置</p>
      <button id="wa-ai-quota-upgrade" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#764ba2);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 16px rgba(124,58,237,0.35);">
        ✨ 升级 Pro 无限次使用
      </button>
      <button id="wa-ai-quota-close" style="background:none;border:none;color:${c.textSecondary};font-size:13px;cursor:pointer;">
        关闭
      </button>
    </div>
  `;
  document.body.appendChild(panel);
  void panel.offsetWidth;
  panel.style.opacity = '1';
  panel.style.transform = 'translateX(-50%) translateY(0)';

  panel.querySelector('#wa-ai-quota-upgrade').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openOptions', tab: 'upgrade' });
    panel.remove();
  });
  panel.querySelector('#wa-ai-quota-close').addEventListener('click', () => {
    panel.style.opacity = '0';
    setTimeout(() => panel.remove(), 250);
  });
  // Click outside
  const dismissHandler = (e) => {
    if (!panel.contains(e.target)) {
      panel.style.opacity = '0';
      setTimeout(() => { panel.remove(); document.removeEventListener('mousedown', dismissHandler); }, 250);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', dismissHandler), 100);
}

// Last context for regenerate functionality
let lastContext = null;
let lastGeneratedReply = null;

// Quick menu templates - grouped for faster scanning
const QUICK_TEMPLATES_COMMON = [
  { id: 'friendly', label: '😊 友好回复', prompt: '生成一个友好、热情的回复' },
  { id: 'professional', label: '💼 专业回复', prompt: '生成一个专业、正式的回复' },
  { id: 'concise', label: '⚡ 简洁回复', prompt: '生成一个简洁、直接的回复，不超过2句话' },
  { id: 'detailed', label: '📝 详细回复', prompt: '生成一个详细、全面的回复' }
];
const QUICK_TEMPLATES_MORE = [
  { id: 'humorous', label: '😄 幽默回复', prompt: '生成一个轻松幽默的回复' },
  { id: 'question', label: '❓ 提问回复', prompt: '生成一个带有相关问题的回复，以继续对话' },
  { id: 'agreement', label: '✅ 同意回复', prompt: '生成一个表示同意/支持的回复' },
  { id: 'disagreement', label: '🤔 委婉拒绝', prompt: '生成一个委婉表示不同意的回复' },
  { id: 'thanks', label: '🙏 感谢回复', prompt: '生成一个表达感谢的回复' },
  { id: 'followup', label: '🔔 跟进提醒', prompt: '生成一个跟进或提醒的回复' }
];
const QUICK_TEMPLATES = [...QUICK_TEMPLATES_COMMON, ...QUICK_TEMPLATES_MORE];

// Example chips for custom prompt dialog
const CUSTOM_PROMPT_EXAMPLES = ['用英语回复', '语气更委婉', '加上表情符号', '简短确认即可'];

// Handler for closing quick menu from outside clicks (hoisted to allow cleanup)
let _quickMenuCloseHandler = null;

// Create quick menu
function createQuickMenu() {
  const c = getInjectUIColors();
  const menu = document.createElement('div');
  menu.id = 'wa-ai-quick-menu';
  menu.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: ${c.bg};
    border-radius: 16px;
    padding: 12px;
    min-width: 200px;
    box-shadow: ${c.shadow};
    display: none;
    flex-direction: column;
    gap: 4px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    animation: wa-ai-menu-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    max-height: 400px;
    overflow-y: auto;
  `;
  
  // Menu header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 8px 12px;
    margin-bottom: 8px;
    border-bottom: 1px solid ${c.border};
  `;
  header.innerHTML = `
    <div style="color: ${c.text}; font-size: 14px; font-weight: 600;">快捷指令</div>
    <div style="color: ${c.textSecondary}; font-size: 12px; margin-top: 2px;">选择回复风格</div>
  `;
  menu.appendChild(header);

  // Helper: render a template item button
  const renderTemplateItem = (template) => {
    const item = document.createElement('button');
    item.className = 'wa-ai-quick-item';
    item.dataset.templateId = template.id;
    item.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:transparent;color:${c.text};font-size:14px;cursor:pointer;border-radius:10px;transition:all 0.15s cubic-bezier(0.16, 1, 0.3, 1);text-align:left;width:100%;`;
    item.innerHTML = `<span style="font-size:16px;">${template.label.split(' ')[0]}</span><span style="flex:1;">${template.label.split(' ').slice(1).join(' ')}</span>`;
    item.onmouseover = () => { item.style.background = c.hoverBg; item.style.color = c.text; };
    item.onmouseout = () => { item.style.background = 'transparent'; item.style.color = c.text; };
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // Track usage
      chrome.storage.local.get(['recentTemplateIds'], (d) => {
        let recent = (d.recentTemplateIds || []).filter(id => id !== template.id);
        recent.unshift(template.id);
        if (recent.length > 3) recent = recent.slice(0, 3);
        chrome.storage.local.set({ recentTemplateIds: recent });
      });
      handleQuickTemplate(template);
      hideQuickMenu();
    });
    return item;
  };

  // Helper: section divider with label
  const addSectionLabel = (text) => {
    const lbl = document.createElement('div');
    lbl.style.cssText = `padding:4px 12px 2px;font-size:11px;color:${c.textSecondary};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;`;
    lbl.textContent = text;
    menu.appendChild(lbl);
  };

  // Load recent templates and render
  chrome.storage.local.get(['recentTemplateIds'], (d) => {
    const recentIds = d.recentTemplateIds || [];
    const recentTemplates = recentIds.map(id => QUICK_TEMPLATES.find(t => t.id === id)).filter(Boolean);

    if (recentTemplates.length > 0) {
      addSectionLabel('最近使用');
      recentTemplates.forEach(t => menu.appendChild(renderTemplateItem(t)));
      const sep = document.createElement('div');
      sep.style.cssText = `height:1px;background:${c.border};margin:6px 0;`;
      menu.appendChild(sep);
    }

    addSectionLabel('常用');
    QUICK_TEMPLATES_COMMON.forEach(t => menu.appendChild(renderTemplateItem(t)));

    const sep2 = document.createElement('div');
    sep2.style.cssText = `height:1px;background:${c.border};margin:6px 0;`;
    menu.appendChild(sep2);

    addSectionLabel('更多风格');
    QUICK_TEMPLATES_MORE.forEach(t => menu.appendChild(renderTemplateItem(t)));
  });
  
  // Separator
  const separator = document.createElement('div');
  separator.style.cssText = `
    height: 1px;
    background: ${c.border};
    margin: 8px 0;
  `;
  menu.appendChild(separator);
  
  // Custom prompt option
  const customItem = document.createElement('button');
  customItem.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    color: ${c.accent};
    font-size: 14px;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: left;
    width: 100%;
    font-weight: 500;
  `;
  customItem.innerHTML = `
    <span style="font-size: 16px;">✨</span>
    <span>自定义提示...</span>
  `;
  customItem.onmouseover = () => {
    customItem.style.background = c.hoverBg;
  };
  customItem.onmouseout = () => {
    customItem.style.background = 'transparent';
  };
  customItem.addEventListener('click', (e) => {
    e.stopPropagation();
    hideQuickMenu();
    showCustomPromptDialog();
  });
  menu.appendChild(customItem);
  
  // Scrollbar style
  const style = document.createElement('style');
  style.textContent = `
    #wa-ai-quick-menu::-webkit-scrollbar {
      width: 6px;
    }
    #wa-ai-quick-menu::-webkit-scrollbar-track {
      background: transparent;
    }
    #wa-ai-quick-menu::-webkit-scrollbar-thumb {
      background: ${c.border};
      border-radius: 3px;
    }
  `;
  menu.appendChild(style);
  
  // Remove old close handler to prevent listener leaks on menu recreation
  if (_quickMenuCloseHandler) {
    document.removeEventListener('click', _quickMenuCloseHandler);
  }
  _quickMenuCloseHandler = (e) => {
    if (!menu.contains(e.target)) {
      hideQuickMenu();
    }
  };
  document.addEventListener('click', _quickMenuCloseHandler);
  
  return menu;
}

function showQuickMenu(x, y) {
  let menu = document.getElementById('wa-ai-quick-menu');
  if (!menu) {
    menu = createQuickMenu();
    document.body.appendChild(menu);
  }
  
  // Adjust position to keep within viewport
  const menuWidth = 220;
  const menuHeight = Math.min(400, QUICK_TEMPLATES.length * 44 + 100);
  
  let left = x;
  let top = y;
  
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 20;
  }
  if (top + menuHeight > window.innerHeight) {
    top = window.innerHeight - menuHeight - 20;
  }
  
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.display = 'flex';
}

function hideQuickMenu() {
  const menu = document.getElementById('wa-ai-quick-menu');
  if (menu) {
    menu.style.display = 'none';
  }
}

// Handle quick template selection
function handleQuickTemplate(template) {
  const platform = detectPlatform();
  if (!platform) return;
  
  const context = getChatContext(platform);
  if (context.length === 0) {
    showToast('未找到聊天记录', 'error');
    return;
  }
  
  lastContext = context;
  
  showToast(`正在生成: ${template.label}...`, 'loading', 0);
  
  // Add template prompt to context
  const enhancedContext = [
    ...context,
    { role: 'system', content: template.prompt }
  ];
  
  chrome.runtime.sendMessage({ 
    action: 'generateReply', 
    context: enhancedContext 
  }, (response) => {
    if (chrome.runtime.lastError) {
      showToast('插件连接错误: ' + chrome.runtime.lastError.message, 'error', 5000);
      return;
    }
    
    if (response && response.success) {
      showPreviewModal(response.reply);
      showToast('回复已生成！', 'success', 3000);
      showRegenerateButton();
    } else {
      showToast('生成失败: ' + (response?.error || '未知错误'), 'error', 5000);
    }
  });
}

// Show custom prompt dialog
function showCustomPromptDialog() {
  const c = getInjectUIColors();
  const modal = document.createElement('div');
  modal.id = 'wa-ai-custom-prompt-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;
  
  modal.innerHTML = `
    <div style="
      background: ${c.bg};
      border-radius: 20px;
      padding: 28px;
      width: 90%;
      max-width: 480px;
      box-shadow: ${c.shadow};
      animation: wa-ai-modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <h3 style="margin: 0 0 8px 0; color: ${c.text}; font-size: 18px; font-weight: 600;">自定义提示</h3>
      <p style="margin: 0 0 16px 0; color: ${c.textSecondary}; font-size: 14px;">描述你想要的回复风格或内容</p>
      
      <textarea id="wa-ai-custom-input" style="
        width: 100%;
        min-height: 100px;
        background: ${c.inputBg};
        border: 1px solid ${c.inputBorder};
        border-radius: 12px;
        padding: 14px;
        color: ${c.inputText};
        font-size: 15px;
        line-height: 1.5;
        resize: vertical;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        margin-bottom: 12px;
      " placeholder="例如：用正式的语气回复，表达感谢并询问更多细节..."></textarea>

      <div id="wa-ai-custom-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="color:${c.textSecondary};font-size:12px;">Ctrl+Enter 提交</span>
        <button id="wa-ai-custom-cancel" style="
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid ${c.border};
          background: transparent;
          color: ${c.textSecondary};
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">取消</button>
        <button id="wa-ai-custom-submit" style="
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #7c3aed, #764ba2);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">生成回复</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const input = modal.querySelector('#wa-ai-custom-input');
  input.focus();

  // Render example chips
  const chipsWrap = modal.querySelector('#wa-ai-custom-chips');
  CUSTOM_PROMPT_EXAMPLES.forEach(ex => {
    const chip = document.createElement('button');
    chip.textContent = ex;
    chip.style.cssText = `padding:5px 10px;border-radius:14px;border:1px solid ${c.border};background:transparent;color:${c.textSecondary};font-size:12px;cursor:pointer;transition:all 0.15s;font-family:inherit;`;
    chip.onmouseover = () => { chip.style.background = c.hoverBg; chip.style.color = c.text; chip.style.borderColor = c.accent; };
    chip.onmouseout = () => { chip.style.background = 'transparent'; chip.style.color = c.textSecondary; chip.style.borderColor = c.border; };
    chip.addEventListener('click', () => { input.value = ex; input.focus(); });
    chipsWrap.appendChild(chip);
  });
  
  modal.querySelector('#wa-ai-custom-cancel').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('#wa-ai-custom-submit').addEventListener('click', () => {
    const customPrompt = input.value.trim();
    if (customPrompt) {
      modal.remove();
      handleQuickTemplate({ id: 'custom', label: '✨ 自定义', prompt: customPrompt });
    }
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      modal.querySelector('#wa-ai-custom-submit').click();
    }
    if (e.key === 'Escape') {
      modal.remove();
    }
  });
  // Note: listeners are attached to the modal element itself.
  // When modal.remove() is called, all listeners are automatically
  // garbage collected with the DOM node. No cleanup needed.
}

// Create inline preview panel (replaces full-screen modal for lighter interaction)
function createPreviewModal() {
  const c = getInjectUIColors();
  const panel = document.createElement('div');
  panel.id = 'wa-ai-preview-modal';
  panel.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    z-index: 10001;
    width: 400px;
    max-width: 92vw;
    background: ${c.bg};
    border-radius: 16px;
    padding: 20px;
    display: none;
    flex-direction: column;
    box-shadow: ${c.shadow};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    opacity: 0;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;';
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#764ba2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>
      <div>
        <div style="color:${c.text};font-size:15px;font-weight:600;">预览回复</div>
        <div style="color:${c.textSecondary};font-size:12px;margin-top:1px;">编辑后点击插入</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <button id="wa-ai-preview-expand" style="background:${c.inputBg};border:none;color:${c.textSecondary};width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;" title="全屏编辑">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
      </button>
      <button id="wa-ai-preview-close" style="background:${c.inputBg};border:none;color:${c.textSecondary};width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `;
  panel.appendChild(header);

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.id = 'wa-ai-preview-textarea';
  textarea.style.cssText = `
    width:100%;min-height:90px;max-height:200px;
    background:${c.inputBg};border:1px solid ${c.inputBorder};border-radius:10px;
    padding:14px;color:${c.inputText};font-size:14px;line-height:1.6;resize:vertical;outline:none;
    font-family:inherit;transition:border-color 0.2s;box-sizing:border-box;
  `;
  textarea.placeholder = 'AI 生成的回复将显示在这里...';
  panel.appendChild(textarea);

  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;margin-top:14px;';

  const mkBtn = (id, label, svg, isPrimary) => {
    const b = document.createElement('button');
    b.id = id;
    b.style.cssText = isPrimary
      ? 'flex:2;padding:10px 16px;border-radius:9px;border:none;background:linear-gradient(135deg,#7c3aed,#764ba2);color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;box-shadow:0 4px 14px rgba(124,58,237,0.35);'
      : `flex:1;padding:10px 12px;border-radius:9px;border:1px solid ${c.border};background:transparent;color:${c.textSecondary};font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;`;
    b.innerHTML = svg + '<span>' + label + '</span>';
    return b;
  };

  const regenSvg = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>';
  const copySvg = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const insertSvg = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';

  btnRow.appendChild(mkBtn('wa-ai-preview-regenerate', '重新生成', regenSvg, false));
  btnRow.appendChild(mkBtn('wa-ai-preview-copy', '复制', copySvg, false));
  btnRow.appendChild(mkBtn('wa-ai-preview-insert', '插入回复', insertSvg, true));
  panel.appendChild(btnRow);

  // Hover styles
  const style = document.createElement('style');
  style.textContent = `
    #wa-ai-preview-textarea:focus{border-color:${c.accent};box-shadow:0 0 0 3px rgba(124,58,237,0.2);}
    #wa-ai-preview-close:hover{background:${c.hoverBg};color:${c.text};}
    #wa-ai-preview-expand:hover{background:${c.hoverBg};color:${c.text};}
    #wa-ai-preview-regenerate:hover{border-color:${c.accent};color:${c.text};background:${c.hoverBg};}
    #wa-ai-preview-copy:hover{border-color:${c.accent};color:${c.text};background:${c.hoverBg};}
    #wa-ai-preview-insert:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,0.45);}
  `;
  panel.appendChild(style);

  // Event handlers
  panel.querySelector('#wa-ai-preview-close').addEventListener('click', hidePreviewModal);

  // Click outside to close
  document.addEventListener('mousedown', (e) => {
    const p = document.getElementById('wa-ai-preview-modal');
    if (p && p.style.display === 'flex' && !p.contains(e.target)) {
      hidePreviewModal();
    }
  });

  // Insert button
  panel.querySelector('#wa-ai-preview-insert').addEventListener('click', () => {
    const ta = panel.querySelector('#wa-ai-preview-textarea');
    const text = ta.value.trim();
    if (text) {
      const platform = detectPlatform();
      const success = insertTextIntoInput(text, platform);
      if (success) {
        showToast('回复已插入！', 'success');
        hidePreviewModal();
      } else {
        showToast('无法自动填充，请手动复制', 'error');
      }
    }
  });

  // Copy button
  panel.querySelector('#wa-ai-preview-copy').addEventListener('click', () => {
    const ta = panel.querySelector('#wa-ai-preview-textarea');
    navigator.clipboard.writeText(ta.value).then(() => {
      showToast('已复制到剪贴板！', 'success');
    });
  });

  // Regenerate button
  panel.querySelector('#wa-ai-preview-regenerate').addEventListener('click', () => {
    if (lastContext && lastContext.length > 0) {
      const ta = panel.querySelector('#wa-ai-preview-textarea');
      ta.value = '正在重新生成...';
      ta.disabled = true;
      chrome.runtime.sendMessage({ action: 'generateReply', context: lastContext }, (response) => {
        ta.disabled = false;
        // M3 修复：检查 lastError，避免连接断开时访问 undefined response
        if (chrome.runtime.lastError) {
          console.warn('Message error:', chrome.runtime.lastError.message);
          ta.value = lastGeneratedReply || '';
          showToast('插件连接错误: ' + chrome.runtime.lastError.message, 'error', 5000);
          return;
        }
        if (response && response.success) {
          ta.value = response.reply;
          lastGeneratedReply = response.reply;
          showToast('回复已重新生成！', 'success');
        } else {
          ta.value = lastGeneratedReply || '';
          showToast('重新生成失败', 'error');
        }
      });
    }
  });

  // Expand to fullscreen edit
  panel.querySelector('#wa-ai-preview-expand').addEventListener('click', () => {
    const ta = panel.querySelector('#wa-ai-preview-textarea');
    const currentText = ta.value;
    hidePreviewModal();
    showExpandedEditor(currentText);
  });

  // Keyboard shortcuts
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePreviewModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      panel.querySelector('#wa-ai-preview-insert').click();
    }
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      panel.querySelector('#wa-ai-preview-regenerate').click();
    }
  });

  return panel;
}

// Expanded fullscreen editor (fallback for long text editing)
function showExpandedEditor(text) {
  const c = getInjectUIColors();
  const overlay = document.createElement('div');
  overlay.id = 'wa-ai-expanded-overlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    z-index:10002;display:flex;align-items:center;justify-content:center;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:${c.bg};border-radius:20px;padding:28px;width:90%;max-width:520px;max-height:80vh;display:flex;flex-direction:column;box-shadow:${c.shadow};animation:wa-ai-modal-in 0.2s cubic-bezier(0.16,1,0.3,1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="color:${c.text};font-size:16px;font-weight:600;">全屏编辑</div>
        <button id="wa-ai-exp-close" style="background:${c.inputBg};border:none;color:${c.textSecondary};width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <textarea id="wa-ai-exp-textarea" style="flex:1;min-height:160px;background:${c.inputBg};border:1px solid ${c.inputBorder};border-radius:12px;padding:16px;color:${c.inputText};font-size:15px;line-height:1.6;resize:vertical;outline:none;font-family:inherit;"></textarea>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button id="wa-ai-exp-insert" style="flex:1;padding:12px 20px;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#764ba2);color:#fff;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(124,58,237,0.4);">插入回复</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const expTa = overlay.querySelector('#wa-ai-exp-textarea');
  expTa.value = text;
  setTimeout(() => { expTa.focus(); expTa.setSelectionRange(text.length, text.length); }, 100);
  overlay.querySelector('#wa-ai-exp-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#wa-ai-exp-insert').addEventListener('click', () => {
    const t = expTa.value.trim();
    if (t) {
      insertTextIntoInput(t, detectPlatform());
      showToast('回复已插入！', 'success');
      overlay.remove();
    }
  });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
}

function showPreviewModal(text) {
  let panel = document.getElementById('wa-ai-preview-modal');
  if (!panel) {
    panel = createPreviewModal();
    document.body.appendChild(panel);
  }
  
  const textarea = panel.querySelector('#wa-ai-preview-textarea');
  textarea.value = text;
  lastGeneratedReply = text;
  
  panel.style.display = 'flex';
  // Trigger reflow then animate in
  void panel.offsetWidth;
  panel.style.opacity = '1';
  panel.style.transform = 'translateX(-50%) translateY(0)';
  
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(text.length, text.length);
  }, 100);
}

function hidePreviewModal() {
  const panel = document.getElementById('wa-ai-preview-modal');
  if (panel) {
    panel.style.opacity = '0';
    panel.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => { panel.style.display = 'none'; }, 250);
  }
}

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
    color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.3);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: 'Inter', -apple-system, sans-serif;
  `;
  
  regenBtn.onmouseover = () => {
    regenBtn.style.background = '#7c3aed';
    regenBtn.style.color = '#ffffff';
    regenBtn.style.transform = 'scale(1.1)';
  };
  
  regenBtn.onmouseout = () => {
    regenBtn.style.background = 'rgba(255, 255, 255, 0.95)';
    regenBtn.style.color = '#7c3aed';
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
      showPreviewModal(response.reply);
      showToast('回复已重新生成！请预览编辑后发送。', 'success', 3000);
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

// Debounce utility to limit frequent calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Observe DOM changes to inject button and update visibility (debounced)
// Helper: pause observer during DOM injection to prevent self-triggering loops
const OBSERVER_OPTIONS = { childList: true, subtree: true };

function pauseObserverAndInject(injectFn) {
  observer.disconnect();
  injectFn();
  observer.observe(document.body, OBSERVER_OPTIONS);
}

const debouncedObserverCallback = debounce(() => {
  pauseObserverAndInject(() => {
    if (!document.getElementById('wa-ai-reply-btn')) {
      injectFonts();
      document.body.appendChild(createAIButton());
    }
    if (!document.getElementById('wa-ai-regen-btn')) {
      document.body.appendChild(createRegenerateButton());
    }
    updateButtonVisibility();
  });
}, 300);

const observer = new MutationObserver(debouncedObserverCallback);

// Start observing
observer.observe(document.body, OBSERVER_OPTIONS);

// Initial check
setTimeout(() => {
  pauseObserverAndInject(() => {
    if (!document.getElementById('wa-ai-reply-btn')) {
      injectFonts();
      const newBtn = createAIButton();
      document.body.appendChild(newBtn);
      showFirstUseBubble(newBtn);
    }
    if (!document.getElementById('wa-ai-regen-btn')) {
      document.body.appendChild(createRegenerateButton());
    }
    updateButtonVisibility();
  });
}, 2000);

// Shortcut listener
let currentShortcut = '';
let currentGenerationMode = 'auto';
chrome.storage.sync.get({ shortcut: 'Alt + 1', generationMode: 'auto' }, (data) => {
  currentShortcut = data.shortcut;
  _applyGenerationMode(data.generationMode || 'auto');
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.shortcut) {
    currentShortcut = changes.shortcut.newValue;
  }
  if (namespace === 'sync' && changes.generationMode) {
    _applyGenerationMode(changes.generationMode.newValue || 'auto');
  }
  if (namespace === 'sync' && (changes.btnTheme || changes.btnOpacity)) {
    // Recreate button if theme or opacity changes (pause observer to prevent self-trigger)
    pauseObserverAndInject(() => {
      const oldBtn = document.getElementById('wa-ai-reply-btn');
      if (oldBtn) oldBtn.remove();
      document.body.appendChild(createAIButton());
    });
  }
});

// ---- 自动模式：轮询监控未回复消息，自动生成并插入回复 ----
let _autoReplyLastMsgFingerprint = ''; // 上次处理的对方消息指纹
let _autoReplyTimer = null;
let _autoReplyInProgress = false;
const _AUTO_REPLY_INTERVAL = 8000;   // 轮询间隔 8 秒
const _AUTO_REPLY_COOLDOWN = 15000;  // 单次生成后冷却 15 秒，避免频繁触发
let _autoReplyLastTrigger = 0;

function _getLastIncomingMessage(platform) {
  const context = getChatContext(platform);
  if (context.length === 0) return null;
  // 从末尾往前找最后一条对方消息
  for (let i = context.length - 1; i >= 0; i--) {
    if (context[i].role === 'user') {
      return { message: context[i], index: i, isLast: i === context.length - 1 };
    }
  }
  return null;
}

function _hasUnrepliedMessage(platform) {
  const last = _getLastIncomingMessage(platform);
  if (!last) return false;
  // 最后一条消息必须是对方发的（未回复状态）
  if (!last.isLast) return false;
  // 消息指纹变化才算新消息（避免同一消息重复触发）
  const fingerprint = last.message.content;
  if (fingerprint === _autoReplyLastMsgFingerprint) return false;
  return true;
}

async function _autoGenerateAndInsert() {
  if (_autoReplyInProgress) return;
  const platform = detectPlatform();
  if (!platform) return;
  if (!_hasUnrepliedMessage(platform)) return;

  // 预览弹窗打开时不触发（避免打断用户编辑）
  const modal = document.getElementById('wa-ai-preview-modal');
  if (modal && modal.style.display !== 'none') return;

  // 冷却期内不触发
  const now = Date.now();
  if (now - _autoReplyLastTrigger < _AUTO_REPLY_COOLDOWN) return;

  _autoReplyInProgress = true;
  _autoReplyLastTrigger = now;

  const context = getChatContext(platform);
  if (context.length === 0) {
    _autoReplyInProgress = false;
    return;
  }

  // 记录消息指纹（无论成功失败都标记，避免重复触发）
  const lastIncoming = _getLastIncomingMessage(platform);
  if (lastIncoming) {
    _autoReplyLastMsgFingerprint = lastIncoming.message.content;
  }

  showToast('检测到新消息，自动生成回复中...', 'loading', 0);

  chrome.runtime.sendMessage({ action: 'generateReply', context: context }, async (response) => {
    _autoReplyInProgress = false;

    if (chrome.runtime.lastError) {
      showToast('自动回复失败: ' + chrome.runtime.lastError.message, 'error', 4000);
      return;
    }

    if (response && response.success) {
      // 打字机效果逐字插入 + 思考动画
      showToast('AI 正在输入...', 'loading', 0);
      try {
        const success = await typewriterInsert(response.reply, platform);
        if (success) {
          showToast('回复已生成，请检查后发送', 'success', 4000);
        } else {
          // 插入失败则回退到预览弹窗
          showPreviewModal(response.reply);
          showToast('自动插入失败，已打开预览编辑', 'info', 4000);
        }
      } catch (err) {
        _hideThinkingIndicator();
        showPreviewModal(response.reply);
        showToast('输入异常，已打开预览编辑', 'info', 4000);
      }
    } else {
      const errMsg = response?.error || '未知错误';
      showToast('自动生成失败: ' + errMsg, 'error', 5000);
    }
  });
}

function _startAutoReplyPolling() {
  if (_autoReplyTimer) return;
  _autoReplyTimer = setInterval(() => {
    if (currentGenerationMode !== 'auto') return;
    const platform = detectPlatform();
    if (!platform) return;
    if (!isChatActive(platform)) return;
    _autoGenerateAndInsert();
  }, _AUTO_REPLY_INTERVAL);
}

function _stopAutoReplyPolling() {
  if (_autoReplyTimer) {
    clearInterval(_autoReplyTimer);
    _autoReplyTimer = null;
  }
}

// 切换模式时启停轮询
function _applyGenerationMode(mode) {
  currentGenerationMode = mode;
  if (mode === 'auto') {
    _autoReplyLastMsgFingerprint = ''; // 重置指纹，切回自动模式时重新检测
    _startAutoReplyPolling();
  } else {
    _stopAutoReplyPolling();
  }
}

// storage.onChanged 中模式变更时调用
// （在下方 storage.onChanged 监听器里调用 _applyGenerationMode）

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

  // Alt+2: open quick menu at button position
  if (pressed === 'Alt + 2') {
    e.preventDefault();
    const btn = document.getElementById('wa-ai-reply-btn');
    if (btn && btn.style.display !== 'none') {
      const rect = btn.getBoundingClientRect();
      showQuickMenu(rect.left, rect.top - 10);
    }
  }
});

// Listen for popup toggle message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAIButton') {
    const btn = document.getElementById('wa-ai-reply-btn');
    if (btn) {
      btn.style.display = request.disabled ? 'none' : 'flex';
    }
    const regenBtn = document.getElementById('wa-ai-regen-btn');
    if (regenBtn && request.disabled) {
      regenBtn.style.display = 'none';
    }
  } else if (request.action === 'LICENSE_REVOKED') {
    // 强制下线：移除 AI 按钮与快捷菜单
    const btn = document.getElementById('wa-ai-reply-btn');
    if (btn) btn.remove();
    const menu = document.getElementById('wa-ai-quick-menu');
    if (menu) menu.remove();
    const regenBtn = document.getElementById('wa-ai-regen-btn');
    if (regenBtn) regenBtn.remove();
    // 显示提示
    if (typeof showToast === 'function') {
      showToast('您的许可证已被撤销，如需继续使用请重新激活。', 'error');
    } else {
      console.warn('License revoked: AI button removed.');
    }
  }
  sendResponse({ success: true });
  return true;
});

// Check initial AI button disabled state
chrome.storage.local.get(['aiButtonDisabled'], (data) => {
  if (data.aiButtonDisabled) {
    const btn = document.getElementById('wa-ai-reply-btn');
    if (btn) btn.style.display = 'none';
  }
});

// Global error handler - log errors to storage for debugging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('ChatGenius AI Error:', { message, source, lineno, colno, error: error?.message });
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('ChatGenius AI Unhandled Promise:', event.reason);
};
