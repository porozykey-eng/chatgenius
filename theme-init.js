// 防止主题闪烁（FOUC）：在页面渲染前应用保存的主题
// 必须在 <head> 中同步加载，不能用 defer/async
(function () {
  try {
    var savedTheme = localStorage.getItem('chatgenius_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e) {
    // 默认亮色模式
  }
})();
