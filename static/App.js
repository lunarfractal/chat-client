window.App = class App {
  constructor() {
    setInterval(this.sendCursor, 1000/30);
  }

  clickPlay(str) {
    if (window.network.hasConnection) {
      window.network.sendNick(str);
      setTimeout(() => {
        window.chatbox.addMessage('System', 120, 'Type /room <room_name> to change your room/create one if not exists');
      }, 3000);
    }
  }
  
  loop() {
    window.now = Date.now();
    window.cursors.forEach((cursor, id) => {
      cursor.update();
    });
    window.requestAnimationFrame(window.app.loop);
  }
  
  resize() {
    if(window.network.hasConnection) window.network.sendResize();
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

  listRooms() {
    network.list();
  }

  changeRoom(id) {
    window.chatbox.element.innerHTML = "";
    network.changeRoom(id);
  }

  sendMessage() {
    if(window.network.hasConnection && window.isInGame) {
      let input = document.getElementById('chat');
      let value = input.value;
      if(value.startsWith('/')) {
        let command = value.substring(1);
        switch(command) {
          case 'list':
            this.listRooms();
            break;
          case 'room':
            let roomId = value.split(' ')[1];
            this.changeRoom(roomId);
            break;
          default: break;
        }
      } else {
        window.network.sendChat(value);
        input.value = "";
        window.chatbox.element.scrollTop = window.chatbox.element.scrollHeight;
      }
    }
  }
}
