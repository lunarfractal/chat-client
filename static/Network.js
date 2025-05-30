function leftGame() {
  window.cursors.forEach((cursor, id) => {
    cursor.delete();
    cursors.delete(id);
  });

  window.fadeInUI();
  window.isInGame = false;
}

window.Network = class Network {
  constructor() {
    this.webSocket = null;

    this.address = window.isSecure
      ? "wss://192.168.1.12:9091"
      : "ws://192.168.1.12:8081";
    this.hasConnection = false;
    this.sentHello = false;
    this.lastPing = 0;

    // Client -> Server
    this.OPCODE_PING = 0x00;
    this.OPCODE_HI = 0x01;
    this.OPCODE_HI_BOT = 0x02;
    this.OPCODE_ENTER_GAME = 0x03;
    this.OPCODE_LEAVE_GAME = 0x04;
    this.OPCODE_RESIZE = 0x05;
    this.OPCODE_CURSOR = 0x06;
    this.OPCODE_CD = 0x07;
    this.OPCODE_LS = 0x08;
    this.OPCODE_CHAT = 0x09;
    this.OPCODE_LS_MESSAGES = 0x10;

    // Server -> Client
    this.OPCODE_PONG = 0x00;
    this.OPCODE_ENTERED_GAME = 0xa0;
    this.OPCODE_CYCLE_S = 0xa4;
    this.OPCODE_EVENTS = 0xa1;
    this.OPCODE_HISTORY = 0xb1;
    this.OPCODE_CONFIG = 0xb2;
  }

  getServerAndConnect() {
    let url = new URL(location.href);
    let id = url.searchParams.get("id");

    if (id) {
      this.address = `${this.address}/?id=${id}`;
    }

    this.connect();
  }

  connect() {
    try {
      this.webSocket = new WebSocket(this.address);
    } catch (e) {
      setTimeout(() => this.connect(), 1e3);
      console.log(e);
      return;
    }
    this.webSocket.binaryType = "arraybuffer";
    this.webSocket.onopen = this.onSocketOpen;
    this.webSocket.onclose = this.onSocketClose;
    this.webSocket.onerror = this.onError;
    this.webSocket.onmessage = this.onSocketMessage;
  }

  onSocketOpen() {
    console.log("Connected!");
    window.network.hasConnection = true;
    window.network.hello();
  }

  onSocketClose() {
    console.log("disconnected");
    window.network.hasConnection = false;
    setTimeout(() => window.network.connect(), 1e3);
    leftGame();
  }

  onError(a) {
    console.error(a);
  }

  onSocketMessage(event) {
    window.network.processMessage(event.data);
  }

  hello() {
    this.ping();
    this.sendHello();
  }

  processEvents(view) {
    let offset = 1;
    let type = view.getUint8(offset++);
    switch (type) {
      case 0x1: {
        let id = view.getUint16(offset, true);
        offset += 2;
        let res = window.getString(view, offset);
        let nick = res.nick;
        offset = res.offset;
        let res0 = window.getString(view, offset);
        let message = res0.nick;
        offset = res0.offset;
        let color = window.cursors.get(id)?.hue || 240;
        window.chatbox.addMessage(nick, color, message);
        break;
      }

      default:
        break;
    }
  }

  processConfig(view) {
    let offset = 1,
      byteLength = view.byteLength;
    while (offset != byteLength) {
      let res = window.getLobbyName(view, offset);
      let name = res.nick;
      offset = res.offset;
      console.log("lobby: " + name);
    }
  }

  processHistory(view) {
    let offset = 1,
      byteLength = view.byteLength;
    while (offset != byteLength) {
      let id = view.getUint16(offset, true);
      offset += 2;
      let timestamp = view.getFloat64(offset, true);
      offset += 8;
      let res = window.getString(view, offset);
      let nick = res.nick;
      offset = res.offset;
      res = window.getString(view, offset);
      let content = res.nick;
      offset = res.offset;
      let color = window.cursors.get(id)?.hue || 240;
      window.chatbox.addMessage(nick, color, content);
    }
  }

  processCursors(view) {
    let offset = 1;
    while (true) {
      let id = view.getUint16(offset, true);
      offset += 2;
      if (id == 0x00) break;
      let flags = view.getUint8(offset, true);
      offset++;
      switch (flags) {
        case 0x0: { // create
          let cursor = new window.Cursor();
          cursor.id = id;
          offset = cursor.updateNetwork(view, offset, true);
          window.cursors.set(id, cursor);
          break;
        }

        case 0x1: { // update
          let cursor = window.cursors.get(id);
          if (cursor) {
            offset = cursor.updateNetwork(view, offset, false);
          } else {
            console.log("cursor with id: " + id + " not found");
          }
          break;
        }

        case 0x2: { // delete
          let cursor = window.cursors.get(id);
          if (cursor) {
            offset = cursor.deleteNetwork(view, offset);
          } else {
            console.log("unknown cursor: " + id + " can't delete it");
          }
          break;
        }

        default:
          console.log("unknown flags", flags);
      }
    }
  }

  processMessage(buffer) {
    let view = new DataView(buffer);
    let op = view.getUint8(0);
    switch (op) {
      case this.OPCODE_PONG:
        console.log("Pong", +new Date() - this.lastPing);
        break;
      case this.OPCODE_ENTERED_GAME:
        window.isInGame = true;
        window.myId = view.getUint16(1, true);
        console.log("my id:", window.myId);
        window.myHue = view.getUint16(3, true);
        console.log("my hue", window.myHue);
        window.hideUI();
        this.list();
        this.getHistory();
        break;
      case this.OPCODE_CYCLE_S:
        this.processCursors(view, op);
        break;
      case this.OPCODE_EVENTS:
        this.processEvents(view);
        break;
      case this.OPCODE_HISTORY:
        this.processHistory(view);
        break;
      case this.OPCODE_CONFIG:
        this.processConfig(view);
        break;
      default:
        console.log("unknown op:", op);
        break;
    }
  }

  ping() {
    let buffer = new ArrayBuffer(1);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_PING);

    this.webSocket.send(buffer);
    this.lastPing = +new Date();
  }

  sendHello() {
    let buffer = new ArrayBuffer(5);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_HI);

    view.setUint16(1, window.innerWidth, true);
    view.setUint16(3, window.innerHeight, true);

    this.webSocket.send(buffer);
  }

  sendResize() {
    let buffer = new ArrayBuffer(5);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_RESIZE);

    view.setUint16(1, window.innerWidth, true);
    view.setUint16(3, window.innerHeight, true);

    this.webSocket.send(buffer);
  }

  sendCursor(x, y) {
    let buffer = new ArrayBuffer(5);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_CURSOR);

    view.setUint16(1, x, true);
    view.setUint16(3, y, true);

    this.webSocket.send(buffer);
  }

  sendNick(nick) {
    let buffer = new ArrayBuffer(1 + 2 * nick.length + 3);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_ENTER_GAME);

    for (let i = 0; i < nick.length; i++) {
      view.setUint16(1 + i * 2, nick.charCodeAt(i), true);
    }

    this.webSocket.send(buffer);
  }

  leave() {
    let buffer = new ArrayBuffer(1);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_LEAVE_GAME);

    this.webSocket.send(buffer);

    setTimeout(leftGame, 300);
  }

  sendChat(value) {
    let buffer = new ArrayBuffer(1 + 2 * value.length + 3);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_CHAT);

    for (let i = 0, l = value.length; i < l; i++) {
      view.setUint16(1 + i * 2, value.charCodeAt(i), true);
    }

    this.webSocket.send(buffer);
  }

  changeRoom(value) {
    let buffer = new ArrayBuffer(1 + value.length + 3);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_CD);

    for (let i = 0, l = value.length; i < l; i++) {
      view.setUint8(1 + i, value.charCodeAt(i));
    }

    this.webSocket.send(buffer);
  }

  list() {
    let buffer = new ArrayBuffer(1);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_LS);

    this.webSocket.send(buffer);
  }

  getHistory() {
    let buffer = new ArrayBuffer(1);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_LS_MESSAGES);

    this.webSocket.send(buffer);
  }
}
