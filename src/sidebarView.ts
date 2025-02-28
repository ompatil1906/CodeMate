import * as vscode from "vscode";

export class CodeMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codemateView"; // Must match `package.json`

  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true, // Allow JS in WebView
    };

    webviewView.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; }
          </style>
        </head>
        <body>
          <h3>CodeMate AI Assistant</h3>
          <p>Ask CodeMate any coding question!</p>
        </body>
      </html>
    `;
  }
}
