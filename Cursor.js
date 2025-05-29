window.Cursor = class Cursor {
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

    this.FLAG_ENTERED_GAME = 0x00;
    this.FLAG_ENTERED_ROOM = 0x01;
    this.FLAG_DOES_EXIST = 0x02;
    this.FLAG_LEFT_GAME = 0x03;
    this.FLAG_CLOSED_WS = 0x02;
    this.FLAG_LEFT_ROOM = 0x01;

    this.img = document.createElement("img");
    this.img.src = "http://brutal.nekoweb.org/cursor.png";

    this.element.appendChild(this.img);

    this.label = document.createElement("div");
    this.label.className = "cursor-label";
    this.label.innerText = "Anonymous";

    this.element.appendChild(this.label);
  }

  hide() {
    $(this.element).fadeOut(300);
  }

  show() {
    $(this.element).fadeIn(300);
  }

  create() {
    this.element.style.display = "none";
    document.getElementById("cursor-place").appendChild(this.element);
    $(this.element).fadeIn(300);
  }

  delete() {
    $(this.element).fadeOut(300);
    setTimeout(() => {
      document.getElementById("cursor-place").removeChild(this.element);
    }, 300);
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    var rawT = (window.now - this.lastUpdateTime) / window.INTERP_TIME;
    var t = window.clamp(easeOutQuad(rawT), 0.0, 1.0);

    var newPosX = t * (this.dstX - this.origX) + this.origX;
    var newPosY = t * (this.dstY - this.origY) + this.origY;

    this.updateCursor(newPosX, newPosY);
  }

  createCursor(reason) {
    if (window.debug) console.log("create", reason);
    if (this.id == window.myId) {
      return;
    }
    if (
      reason == this.FLAG_ENTERED_GAME ||
      reason == this.FLAG_DOES_EXIST
    ) {
      this.create();
    } else if (reason == this.FLAG_ENTERED_ROOM) {
      this.show();
    } else console.log("unknown create reason", reason);
  }

  updateCursor(x, y) {
    this.x = x;
    this.y = y;
    this.element.style.marginLeft = x + "px";
    this.element.style.marginTop = y + "px";
  }

  deleteCursor(killReason) {
    if (window.debug) console.log("delete", killReason);
    if (
      killReason == this.FLAG_LEFT_GAME ||
      killReason == this.FLAG_CLOSED_WS
    ) {
      this.delete();
      window.cursors.delete(this.id);
    } else if (killReason == this.FLAG_LEFT_ROOM) {
      this.hide();
    } else console.log("unknown kill reason", killReason);
  }

  updateNick(nick) {
    this.label.innerText = nick;
  }

  updateNetwork(view, offset, isFull) {
    let x = (view.getUint16(offset, true) / 65535) * window.innerWidth;
    offset += 2;
    let y = (view.getUint16(offset, true) / 65535) * window.innerHeight;
    offset += 2;

    if (isFull) {
      let res = window.getString(view, offset);
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

    this.lastUpdateTime = window.now;
    return offset;
  }

  deleteNetwork(view, offset) {
    let killReason = view.getUint8(offset++);
    this.deleteCursor(killReason);
    return offset;
  }
}
