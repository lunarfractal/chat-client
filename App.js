window.App = class App {
  constructor() {
    setInterval(this.sendCursor, 1000/30);
  }

  clickPlay(str) {
    if (window.network.hasConnection) {
      window.network.sendNick(str);
    }
  }
  
  loop() {
    window.now = Date.now();
    window.cursors.forEach((cursor, id) => {
      cursor.update();
    });
    window.requestAnimationFrame(this.loop);
  }
  
  sendCursor() {
    if(!window.isInGame)
      return;
    
    if (window.network.hasConnection)
      window.network.sendCursor(window.myX, window.myY);
  }
  
  addListeners() {
    document.addEventListener("mousemove", (e) => {
      window.myX = e.clientX;
      window.myY = e.clientY;
    });
  }
}
