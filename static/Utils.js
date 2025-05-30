function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function getPlayerName(nick) {
  if(nick) return nick;
  else return "Anonymous";
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}


function hideUI() {
  $("#overlay").fadeOut(100);
}

function fadeInUI() {
  $("#overlay").fadeIn(300);
}

function getString(view, offset) {
  var nick = "";
  for (;;) {
    var v = view.getUint16(offset, true);
    offset += 2;
    if (v == 0) {
      break;
    }

    nick += String.fromCharCode(v);
  }
  return {
    nick: nick,
    offset: offset,
  };
}

function getLobbyName(view, offset) {
  var nick = "";
  for (;;) {
    var v = view.getUint8(offset, true);
    offset += 1;
    if (v == 0) {
      break;
    }

    nick += String.fromCharCode(v);
  }
  return {
    nick: nick,
    offset: offset,
  };
}
