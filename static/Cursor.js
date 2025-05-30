window.Cursor = class Cursor {
  constructor(maybeShow) {
    this.id = 0;

    this.x = this.y = this.prevX = this.prevY = 0;
    this.origX = this.origY = this.dstX = this.dstY = 0;

    this.nick = "Anonymous";
    this.hue = 240;
    
    this.lastUpdateTime = 0;

    // DOM
    this.element = document.createElement("div");
    this.element.className = "cursor";

    this.img = document.createElement("img");
    this.img.src = window.isSecure ? "https://brutal.nekoweb.org/cursor.png" : "http://brutal.nekoweb.org/cursor.png";
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

    const t = window.easeOutQuad(
      window.clamp((window.now - this.lastUpdateTime) / window.INTERP_TIME, 0.0, 1.0)
    );

    const newPosX = t * (this.dstX - this.origX) + this.origX;
    const newPosY = t * (this.dstY - this.origY) + this.origY;

    this.updateCursor(newPosX, newPosY);
  }

  createCursor() {
    if (this.id === window.myId) return;
    this.create();
  }

  updateCursor(x, y) {
    this.x = x;
    this.y = y;
    this.element.style.marginLeft = `${x}px`;
    this.element.style.marginTop = `${y}px`;
  }

  deleteCursor() {
    this.delete();
    window.cursors.delete(this.id);
  }

  updateNick(nick) {
    this.nick = window.getPlayerName(nick);
    this.label.innerText = nick;
  }

  updateColor(hue) {
    this.hue = hue;
    this.label.style.color = `hsl(${hue}, 100%, 50%)`;
  }

  updateNetwork(view, offset, isFull) {
    const x = (view.getUint16(offset, true) / 65535) * window.innerWidth;
    offset += 2;

    const y = (view.getUint16(offset, true) / 65535) * window.innerHeight;
    offset += 2;

    if (isFull) {
      const hue = view.getUint16(offset, true);
      offset += 2;

      const res = window.getString(view, offset);
      offset = res.offset;

      this.createCursor();
      this.updateNick(res.nick);
      this.updateColor(hue);
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
    this.deleteCursor();
    return offset;
  }
};
