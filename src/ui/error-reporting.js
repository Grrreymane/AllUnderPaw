// If the game fails to start or keeps crashing, show the error (players can screenshot it) instead of a blank screen.
window.__gameErr = function (msg) {
  try {
    var d = document.getElementById('game-err');
    if (!d) {
      d = document.createElement('div'); d.id = 'game-err';
      d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:20;background:#3a0a1a;color:#ffd6d6;font:12px/1.4 monospace;padding:10px;border:2px solid #ff6a6a;border-radius:4px;white-space:pre-wrap;word-break:break-all';
      d.onclick = function () { location.reload(); };
      document.body.appendChild(d);
    }
    d.textContent = '游戏出错了。截图发给开发者，点这里重新加载。' + String.fromCharCode(10) + msg + String.fromCharCode(10) + navigator.userAgent;
  } catch (e) {}
};
window.addEventListener('error', function (e) { window.__gameErr((e.message || 'error') + ' @' + (e.lineno || '?') + ':' + (e.colno || '?')); });
setTimeout(function () { if (!window.__gameBooted) window.__gameErr('启动超时：8 秒内游戏没有开始运行'); }, 8000);
