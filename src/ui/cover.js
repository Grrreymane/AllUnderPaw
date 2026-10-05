// ============================================================ cover (open index.html#cover, then tools/shot.py -> cover.png)
// cover: the painted key art (art/cover.jpg) with the title over the open sky on the right
function renderCover() {
  const img = new Image();
  img.onload = () => {
    const big = mk(1920, 1080), bx = big.getContext('2d');
    bx.drawImage(img, 0, 0, 1920, 1080);
    const gr = bx.createRadialGradient(1590, 300, 60, 1590, 300, 520); gr.addColorStop(0, 'rgba(10,20,28,.45)'); gr.addColorStop(1, 'rgba(10,20,28,0)');
    bx.fillStyle = gr; bx.fillRect(1000, 0, 920, 900);
    bx.textAlign = 'center'; bx.lineJoin = 'round'; bx.strokeStyle = '#1b1622';
    bx.font = '150px ' + FONT; bx.lineWidth = 24; bx.strokeText('一喵天下', 1590, 250); bx.fillStyle = '#ffe08a'; bx.fillText('一喵天下', 1590, 250);
    bx.font = '52px ' + FONT; bx.lineWidth = 11; bx.strokeText('All Under Paw', 1590, 340); bx.fillStyle = '#f2ead4'; bx.fillText('All Under Paw', 1590, 340);
    bx.font = '40px ' + FONT; bx.lineWidth = 9; bx.strokeText('押宝秦国质子 · 猫猫王朝模拟', 1590, 420); bx.fillText('押宝秦国质子 · 猫猫王朝模拟', 1590, 420);
    document.body.innerHTML = ''; big.style.cssText = 'position:fixed;left:0;top:0;width:1920px;height:1080px'; document.body.appendChild(big);
    document.title = 'COVER READY';
  };
  img.src = 'art/cover.jpg';
}
