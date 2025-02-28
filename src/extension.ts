import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeMateViewProvider(context.extensionUri);
  context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(CodeMateViewProvider.viewType, provider)
  );

  console.log('CodeMate is now active!');
}

class CodeMateViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codemateView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
      this._view = webviewView;
      webviewView.webview.options = { enableScripts: true };

      webviewView.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
      return `
          <html>
          <body>
              <h2>CodeMate Assistant</h2>
              <p>Ask your coding questions here!</p>
          </body>
          </html>
      `;
  }
}
