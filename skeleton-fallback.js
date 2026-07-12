// 骨架屏兜底：3秒后无条件隐藏，不依赖 options.js 任何逻辑
// 独立文件，避免被 CSP script-src 'self' 阻止
(function () {
  function hideSkeleton() {
    var sk = document.getElementById('skeletonScreen');
    var ct = document.querySelector('.page-container');
    if (sk) sk.style.display = 'none';
    if (ct) ct.style.opacity = '1';
  }
  // 页面 load 后 3 秒强制隐藏
  if (document.readyState === 'complete') {
    setTimeout(hideSkeleton, 3000);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hideSkeleton, 3000);
    });
  }
  // 双保险：5 秒后再试一次
  setTimeout(hideSkeleton, 5000);
})();
