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
              this.handleMessage(message);
          }
      });






      webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, this.context.extensionUri);
  }






  private async handleMessage(message: { type: string; text?: string }) {









      switch (message.type) {
          case "query":
              const response = await this.getAIResponse(message.text || "");
              const formattedResponse = this.formatResponse(response);
              this._view?.webview.postMessage({ type: "response", text: formattedResponse });
              break;
      }
  }

  private formatResponse(response: string): string {















      response = response.replace(/(\w+)?\n([\s\S]*?)/g, (match, language, code) => {
          const lang = language ? ` class="language-${language}"` : '';
          return `<pre><code${lang}>${code.trim()}</code></pre>`;
      });
        
      response = response.replace(/([^]+)/g, '<code>$1</code>');
      response = response.replace(/## (.*?)(?:\n|$)/g, '<h2>$1</h2>');
      response = response.replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>');
      response = response.replace(/\* (.*?)(?:\n|$)/g, '<li>$1</li>');
      response = response.replace(/(?:^|\n)(<li>.*?<\/li>)(?:\n|$)/g, '\n<ul>$1</ul>\n');
        
      return response;
  }


  private getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
















      const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'marked.min.js'));
        
      return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.0.3/marked.min.js"></script>
    </head>
    <body>
        <div class="chat-container">
            <div class="header">
                <h2>CodeMate Assistant</h2>
            </div>
            <div class="chat-messages" id="chat"></div>
            <div class="input-area">
                <div class="input-container">
                    <input 
                        type="text" 
                        id="userInput" 
                        placeholder="Ask me about coding..."
                        autocomplete="off"
                    />
                    <button id="sendButton" class="send-button">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M1 8l14-7-7 14v-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            const chatDiv = document.getElementById('chat');
            const userInput = document.getElementById('userInput');
            const sendButton = document.getElementById('sendButton');

            function addMessage(text, isUser) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
                messageDiv.innerHTML = marked.parse(text);
                chatDiv.appendChild(messageDiv);
                chatDiv.scrollTop = chatDiv.scrollHeight;
            }

            sendButton.addEventListener('click', () => {
                const message = userInput.value.trim();
                if (message) {
                    addMessage(message, true);
                    userInput.value = '';
                    vscode.postMessage({ type: 'message', text: message });
                }
            });

            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendButton.click();
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.type === 'response') {
                    addMessage(message.text, false);
                }
            });
        </script>
    </body>
    </html>
`;
  }


  private async getAIResponse(query: string): Promise<string> {
      return `
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
  }






















}