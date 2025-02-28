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
          body { font-family: Arial, sans-serif; padding: 10px; }
          h2 { color: #007ACC; }
          #chat { border: 1px solid #ddd; padding: 10px; min-height: 100px; }
        </style>
      </head>
      <body>
        <h2>CodeMate AI Assistant</h2>
        <p>Ask anything about your code.</p>
        <div id="chat">Chat UI will be here.</div>
      </body>
      </html>`;
  }
}
export function deactivate() {}