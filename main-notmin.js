var debug = true;
var network;
var myId;
var cursors = new Map();

var now = Date.now();

function hideUI() {
  $('#overlay').fadeOut(100);
}

function fadeInUI() {
  $('#overlay').fadeIn(300);
}

function clamp(v, min, max){
	if(v < min) return min;
	if(v > max) return max;
	return v;
}

var UPDATE_EVERY_N_TICKS = 3;
var INTERP_TIME = (1000/30)*UPDATE_EVERY_N_TICKS;

var create_reason_entered_game = 0x00;
var create_reason_entered_room = 0x01;
var create_reason_existing = 0x02;

var kill_reason_left_game = 0x01;
var kill_reason_closed_ws = 0x02;
var kill_reason_left_room = 0x03;


function clickPlay(str) {
  if(window.network.hasConnection) {
    window.network.sendNick(str);
  }
}


function getString(view, offset) {
  var nick = "";
  for(;;){
    var v = view.getUint16(offset, true);
    offset += 2;
    if(v == 0) {
	break;
    }

    nick += String.fromCharCode(v);
  }
  return {
    nick: nick,
    offset: offset
  };
}

function addListeners() {
  document.addEventListener("mousemove", (e) => {
    if (network.hasConnection) network.sendCursor(e.clientX, e.clientY);
  });
}

function loop() {
    now = Date.now();
    cursors.forEach((cursor, id) => {
	cursor.update();
    });
    requestAnimationFrame(loop);
}

function resize() {
  network.sendResize();
}

class Cursor {
  constructor(maybeShow) {
    this.element = document.createElement("div");
    this.element.className = "cursor";

    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.origX = 0;
    this.origY = 0;
    this.dstX = 0;
    this.dstY = 0;

    this.lastUpdateTime = 0;

    this.id = 0;
    
    this.img = document.createElement("img");
    this.img.src = "http://brutal.nekoweb.org/cursor.png";

    this.element.appendChild(this.img);
  }

  hide() {
    this.element.style.display = "none";
  }

  show() {
    this.element.style.display = "block";
  }

  create() {
    document.getElementById("cursor-place").appendChild(this.element);
  }

  delete() {
    document.getElementById("cursor-place").removeChild(this.element);
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;
    
    var t = clamp((now - this.lastUpdateTime) / INTERP_TIME, 0.0, 1.0);
    var newPosX = t * (this.dstX - this.origX) + this.origX;
    var newPosY = t * (this.dstY - this.origY) + this.origY;
	  
    this.updateCursor(newPosX, newPosY);
  }
	
  createCursor(reason) {
    if(debug)
      console.log('create', reason);
    if(this.id == myId) {
      return;
    }
    if(reason == create_reason_entered_game || reason == create_reason_existing) {
      this.create();
    }
    else if(reason == create_reason_entered_room) {
      this.show();
    }
    else console.log('unknown create reason', reason);
  }

  updateCursor(x, y) {
    this.x = x;
    this.y = y;
    this.element.style.marginLeft = x + "px";
    this.element.style.marginTop = y + "px";
  }

  deleteCursor(killReason) {
    if(debug)
      console.log("delete", killReason);
    if(killReason == kill_reason_left_game || killReason == kill_reason_closed_ws) {
      this.delete();
      cursors.delete(this.id);
    }
    else if(killReason == kill_reason_left_room) {
      this.hide();
    }
    else console.log('unknown kill reason', killReason);
  }
  
  updateNick(nick) {
    console.log('nick', nick);
  }

  updateNetwork(view, offset, isFull) {
    let x = (view.getUint16(offset, true) / 65535) * window.innerWidth;
    offset += 2;
    let y = (view.getUint16(offset, true) / 65535) * window.innerHeight;
    offset += 2;
	  
    if(isFull) {
      let res = getString(view, offset);
      offset = res.offset;
      let createReason = view.getUint8(offset++);
      this.createCursor(createReason);
      this.updateNick(res.nick);
      this.updateCursor(x, y);
    }
	  
    this.origX = this.x;
    this.origY = this.y;
	  
    this.dstX = x;
    this.dstY = y;

    this.lastUpdateTime = now;
    return offset;
  }

  deleteNetwork(view, offset) {
    let killReason = view.getUint8(offset++);
    this.deleteCursor(killReason);
    return offset;
  }
}

class Network {
  constructor() {
    this.webSocket = null;

    this.address = "ws://192.168.1.12:8081";
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

    // Server -> Client
    this.OPCODE_PONG = 0x00;
    this.OPCODE_ENTERED_GAME = 0xA0;
    this.OPCODE_CYCLE_S = 0xA4;
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
    network.hasConnection = true;
    window.network.hello();
  }

  onSocketClose() {
    console.log("disconnected");
    network.hasConnection = false;
    setTimeout(() => window.network.connect(), 1e3);
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

  processCursors(view) {
    let offset = 1;
    while(true) {
      let id = view.getUint16(offset, true);
      offset += 2;
      if(id == 0x00) break;
      let flags = view.getUint8(offset, true);
      offset++;
      switch(flags) {
        case 0x0: // create
        {
          let cursor = new Cursor();
          cursor.id = id;
          offset = cursor.updateNetwork(view, offset, true);
          cursors.set(id, cursor);
	  if(debug)
		  console.log('Cursor create', cursor);
          break;
        }

        case 0x1: // update
        {
          let cursor = cursors.get(id);
          if(cursor) {
            offset = cursor.updateNetwork(view, offset, false);
          } else {
            console.log('cursor with id: ' + id + ' not found');
          }
	  if(debug)
		  console.log('Cursor update', cursor);
          break;
        }
          
        case 0x2: // delete
        {
          let cursor = cursors.get(id);
          if(cursor) {
           offset = cursor.deleteNetwork(view, offset);
          } else {
            console.log("unknown cursor: " + id + " can't delete it");
          }
	  if(debug)
		  console.log('Cursor delete', cursor);
          break;
        }
          
        default: console.log('unknown flags', flags);
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
        window.myId = view.getUint16(1, true);
        console.log('my id:', myId);
        hideUI();
        break;
      case this.OPCODE_CYCLE_S:
        this.processCursors(view, op);
        break;
      default:
        console.log('unknown op:', op);
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

    for(let i = 0; i < nick.length; i++) {
      view.setUint16(1 + i * 2, nick.charCodeAt(i), true);
    }
    
    this.webSocket.send(buffer);
  }

  leave() {
    let buffer = new ArrayBuffer(1);
    let view = new DataView(buffer);

    view.setUint8(0, this.OPCODE_LEAVE_GAME);

    this.webSocket.send(buffer)
  }
}

function init() {
  network = new Network();
  network.connect();
  loop();
  addListeners();
}

window.onload = init;
window.onresize = resize;
