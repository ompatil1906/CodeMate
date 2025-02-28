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
    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeMate Assistant</title>
            <style>
                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 10px;
                    box-sizing: border-box;
                }
                body { 
                    display: flex;
                    flex-direction: column;
                    font-family: Arial, sans-serif;
                }
                #chat { 
                    flex: 1;
                    min-height: 200px;
                    border: 1px solid var(--vscode-input-border);
                    margin: 10px 0;
                    padding: 10px;
                    overflow-y: auto;
                    background: var(--vscode-editor-background);
                }
                .input-container {
                    position: sticky;
                    bottom: 0;
                    display: flex;
                    gap: 8px;
                    padding: 10px 0;
                    background: var(--vscode-editor-background);
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
                .message {
                    margin: 5px 0;
                    padding: 8px;
                    border-radius: 4px;
                    background: var(--vscode-editor-selectionBackground);
                }
            </style>
        </head>
        <body>
            <h2>CodeMate AI Assistant</h2>
            <div id="chat"></div>
            <div class="input-container">
                <input type="text" id="userInput" placeholder="Ask me anything...">
                <button id="sendButton">Send</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const chatDiv = document.getElementById('chat');
                const userInput = document.getElementById('userInput');
                const sendButton = document.getElementById('sendButton');

                function addMessage(text) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.textContent = text;
                    chatDiv.appendChild(messageDiv);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }

                sendButton.addEventListener('click', () => {
                    const message = userInput.value.trim();
                    if (message) {
                        addMessage('You: ' + message);
                        userInput.value = '';
                        vscode.postMessage({ type: 'message', text: message });
                    }
                });

                userInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendButton.click();
                    }
                });
            </script>
        </body>
        </html>
    `;
}
}  