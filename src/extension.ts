import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ CodeMate Extension Activated");
  const provider = new CodeMateViewProvider(context.extensionUri);
  
  const registration = vscode.window.registerWebviewViewProvider("codemateView", provider);
  console.log("📍 WebView Provider Registered");
  
  context.subscriptions.push(registration);
}
  
class CodeMateViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
      this._view = webviewView;
      webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [this.extensionUri]
      };

      // Add message handler
      webviewView.webview.onDidReceiveMessage(async (data) => {
          const message = data.message;
          // Handle the message here
          console.log("Received message:", message);
      });

      webviewView.webview.html = this.getWebviewContent();
  }

  private getWebviewContent() {
      return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>CodeMate Assistant</title>
              <style>
                  body { 
                      font-family: Arial, sans-serif; 
                      padding: 10px; 
                      display: flex;
                      flex-direction: column;
                      height: 100vh;
                  }
                  #chat { 
                      flex: 1;
                      border: 1px solid #ccc;
                      margin-bottom: 10px;
                      padding: 10px;
                      overflow-y: auto;
                      background: var(--vscode-editor-background);
                  }
                  .message {
                      margin: 5px 0;
                      padding: 5px;
                      border-radius: 5px;
                  }
                  .input-container {
                      display: flex;
                      gap: 8px;
                  }
                  #userInput {
                      flex: 1;
                      padding: 8px;
                      border: 1px solid var(--vscode-input-border);
                      background: var(--vscode-input-background);
                      color: var(--vscode-input-foreground);
                  }
                  #sendButton {
                      padding: 8px 16px;
                      background: var(--vscode-button-background);
                      color: var(--vscode-button-foreground);
                      border: none;
                      cursor: pointer;
                  }
              </style>
          </head>
          <body>
              <div id="chat"></div>
              <div class="input-container">
                  <input type="text" id="userInput" placeholder="Type your message...">
                  <button id="sendButton">Send</button>
              </div>
              <script>
                  const vscode = acquireVsCodeApi();
                  const chatDiv = document.getElementById('chat');
                  const userInput = document.getElementById('userInput');
                  const sendButton = document.getElementById('sendButton');

                  function sendMessage() {
                      const message = userInput.value.trim();
                      if (message) {
                          // Add message to chat
                          const messageElement = document.createElement('div');
                          messageElement.className = 'message';
                          messageElement.textContent = 'You: ' + message;
                          chatDiv.appendChild(messageElement);
                            
                          // Send to extension
                          vscode.postMessage({ message });
                            
                          // Clear input
                          userInput.value = '';
                            
                          // Scroll to bottom
                          chatDiv.scrollTop = chatDiv.scrollHeight;
                      }
                  }

                  sendButton.addEventListener('click', sendMessage);
                  userInput.addEventListener('keypress', (e) => {
                      if (e.key === 'Enter') {
                          sendMessage();
                      }
                  });
              </script>
          </body>
          </html>
      `;
  }
}  