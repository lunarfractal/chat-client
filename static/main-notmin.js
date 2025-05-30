window.isSecure = window.location.protocol == "https:";
window.href = window.location.href;
window.url = new URL(window.href);

window.debug = true;
window.now = Date.now();
window.UPDATE_EVERY_N_TICKS = 3;
window.INTERP_TIME = (1000 / 30) * window.UPDATE_EVERY_N_TICKS;

window.myId;
window.myX = 0;
window.myY = 0;
window.isInGame;
window.cursors = new Map();
window.network;
window.app;
window.chatbox;

function loadScript(url){var head = document.getElementsByTagName('head')[0];var script = document.createElement('script');script.type = 'text/javascript';script.src = url;head.appendChild(script);}

function init() {
  window.app = new window.App();
  window.chatbox = new window.ChatBox();
  window.network = new window.Network();
  window.network.connect();
  window.app.loop();
  window.app.addListeners();

  fadeInUI();
  window.onresize = window.app.resize;
}

loadScript("Utils.js");
loadScript("App.js");
loadScript("Network.js");
loadScript("Cursor.js");
loadScript("ChatBox.js");

window.onload = init;
