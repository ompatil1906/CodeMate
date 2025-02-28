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

    resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken
    ) {
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
            body { 
              font-family: Arial, sans-serif; 
              padding: 10px; 
              display: flex;
              flex-direction: column;
              height: 100vh;
            }
            h2 { color: #007ACC; }
            #chat { 
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
          </style>
        </head>
        <body>
          <h2>CodeMate AI Assistant</h2>
          <div id="chat">Chat messages will appear here</div>
          <div class="input-container">
            <input type="text" id="userInput" placeholder="Ask me anything...">
            <button id="sendButton">Send</button>
          </div>
        </body>
        </html>`;
    }
  }