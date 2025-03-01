import * as vscode from "vscode";

export class CodeMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codemateView";
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.handleMessage(message);
    });

    webviewView.webview.html = this.getHtmlForWebview();
  }

  private async handleMessage(message: { type: string; text?: string }) {
    switch (message.type) {
      case "query":
        const response = await this.getAIResponse(message.text || "");
        this._view?.webview.postMessage({ type: "response", text: response });
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  private getHtmlForWebview(): string {
    return `
      <html>
        <head>
          <style>
            :root {
              --primary-color: #007acc;
              --background-color: #1e1e1e;
              --text-color: #ffffff;
            }
            body {
              font-family: Arial, sans-serif;
              background: var(--background-color);
              color: var(--text-color);
              margin: 0;
              padding: 10px;
            }
            .container {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            textarea {
              width: 100%;
              height: 100px;
              border-radius: 5px;
              padding: 5px;
              font-size: 14px;
            }
            button {
              background: var(--primary-color);
              color: white;
              border: none;
              padding: 10px;
              cursor: pointer;
              border-radius: 5px;
            }
            button:hover {
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <textarea id="input" placeholder="Ask me anything about coding..."></textarea>
            <button id="send">Send</button>
            <div id="response"></div>
          </div>
          <script>
            const vscode = acquireVsCodeApi();
            document.getElementById("send").addEventListener("click", () => {
              const input = document.getElementById("input").value;
              vscode.postMessage({ type: "query", text: input });
            });
            window.addEventListener("message", (event) => {
              const responseBox = document.getElementById("response");
              responseBox.innerText = event.data.text || "No response received.";
            });
          </script>
        </body>
      </html>`;
  }

  private async getAIResponse(query: string): Promise<string> {
    // Placeholder for AI integration
    return `Response for: ${query}`;
  }
}
