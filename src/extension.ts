import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ CodeMate Extension Activated");
  const provider = new CodeMateViewProvider(context.extensionUri);
  
  const registration = vscode.window.registerWebviewViewProvider("codemateView", provider);
  console.log("📍 WebView Provider Registered");
  
  context.subscriptions.push(registration);
}

class CodeMateViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true, // Enable JavaScript inside Webview
    };

    webviewView.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
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
          h2 { color: #007ACC; }
          #messages { 
            flex: 1;
            border: 1px solid #ddd; 
            padding: 10px; 
            margin-bottom: 10px;
            overflow-y: auto;
          }
          .input-container {
            display: flex;
            gap: 8px;
            padding: 10px 0;
          }
          #userInput {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          #sendButton {
            padding: 8px 16px;
            background: #007ACC;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          #sendButton:hover {
            background: #005999;
          }
          .message {
            margin: 8px 0;
            padding: 8px;
            border-radius: 4px;
          }
          .user-message {
            background: #e9ecef;
            margin-left: 20px;
          }
          .assistant-message {
            background: #007ACC22;
            margin-right: 20px;
          }
        </style>
      </head>
      <body>
        <h2>CodeMate AI Assistant</h2>
        <div id="messages"></div>
        <div class="input-container">
          <input type="text" id="userInput" placeholder="Ask me anything about your code...">
          <button id="sendButton">Send</button>
        </div>
        <script>
          const messagesContainer = document.getElementById('messages');
          const userInput = document.getElementById('userInput');
          const sendButton = document.getElementById('sendButton');

          function addMessage(content, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
            messageDiv.textContent = content;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }

          sendButton.addEventListener('click', () => {
            const message = userInput.value.trim();
            if (message) {
              addMessage(message, true);
              userInput.value = '';
            }
          });

          userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              sendButton.click();
            }
          });
        </script>
      </body>
      </html>`;
  }

}
export function deactivate() {}