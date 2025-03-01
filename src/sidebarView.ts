import * as vscode from "vscode";
import * as marked from 'marked';

export class CodeMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codemateView";
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "userInput") {
          console.log("User asked:", message.text);  // This will be captured in WebView chat
      }
  });
  

    // ✅ Pass webview as an argument
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, this.context.extensionUri);
}


  private async handleMessage(message: { type: string; text?: string }) {
    switch (message.type) {
      case "query":
        const response = await this.getAIResponse(message.text || "");
        const formattedResponse = this.formatResponse(response);
        this._view?.webview.postMessage({ type: "response", text: formattedResponse });
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  private formatResponse(response: string): string {
    // Convert markdown-style headers to HTML
    response = response.replace(/## (.*?)\n/g, '<h2>$1</h2>');
    response = response.replace(/### (.*?)\n/g, '<h3>$1</h3>');
    
    // Convert bullet points
    response = response.replace(/\* (.*?)\n/g, '<li>$1</li>');
    response = response.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
    
    // Convert inline code
    response = response.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert code blocks
    response = response.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    return response;
  }
     
  private getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Get the local URI for marked.js
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'marked.min.js'));
  
    return `
      <html>
        <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.0.3/marked.min.js"></script>
        </head>
        <body>
            <div id="chat"></div>
            <input id="userInput" type="text" />
            <button onclick="sendMessage()">Send</button>
            <script>
                function renderMarkdown(text) {
                    return marked.parse(text);
                }

                window.addEventListener("message", (event) => {
                    const message = event.data;
                    if (message.type === "response") {
                        document.getElementById("chat").innerHTML += "<div>CodeMate: " + renderMarkdown(message.text) + "</div>";
                    }
                });s
            </script>
        </body>

      </html>
    `;
  }
  
  
  
  private async getAIResponse(query: string): Promise<string> {
    // Placeholder AI response - Simulating formatted response
    const formattedResponse = `
      <h2>Introduction to Coding</h2>
      <p>We can work on a wide range of programming topics, from basic syntax to advanced concepts.</p>
      <h3>Available Services</h3>
      <ul>
        <li>Code reviews and debugging</li>
        <li>Algorithm design and implementation</li>
        <li>Data structure optimization</li>
        <li>Programming language tutorials</li>
      </ul>
      <h3>Example Code</h3>
      <pre><code class="language-python">print("Hello, World!")</code></pre>
      <p>This code can be used as a starting point for more complex programs.</p>
    `;
    return formattedResponse;
}

}