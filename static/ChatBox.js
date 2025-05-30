window.ChatBox = class ChatBox {
  constructor() {
    this.element = document.getElementById('chatbox');
  }

  addMessage(nick, value) {
    let messageBox = document.createElement('div');
    messageBox.className  'message-box';
    let nickDisplay = document.createElement('span');
    nickDisplay.className = 'nick-display');
    nickDisplay.innerText = nick;
    let messageDisplay = document.createElement('div');
    messageDisplay.className = 'message-display';
    messageDisplay.innerText = value;
    messageBox.appendChild(nickDisplay);
    messageBox.appendChild(messageDisplay);
    this.element.appendChild(messageBox);
  }
}
