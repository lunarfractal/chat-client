window.ChatBox = class ChatBox {
  constructor() {
    this.element = document.getElementById('chatbox');
  }

  addMessage(nick, color, value) {
    let messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    let nickDisplay = document.createElement('span');
    nickDisplay.className = 'nick-display';
    nickDisplay.innerText = `${nick}: `;
    nickDisplay.style.color = "hsl("+color+", 100%, 50%)"
    let messageDisplay = document.createElement('span');
    messageDisplay.className = 'message-content';
    messageDisplay.innerText = value;
    messageBox.appendChild(nickDisplay);
    messageBox.appendChild(messageDisplay);
    this.element.appendChild(messageBox);
  }
}
