const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('codemate.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'codemateChat',
            'CodeMate Assistant',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'images')]
            }
        );

        // Get absolute path to logo
        const logoPath = vscode.Uri.joinPath(context.extensionUri, 'images', 'logo.png');
        // Convert to webview URI
        const logoUri = panel.webview.asWebviewUri(logoPath);

        panel.webview.html = getWebviewContent(logoUri);
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(logoUri) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeMate</title>
        <style>
            .logo-container {
                text-align: center;
                margin: 20px 0;
            }
            .logo {
                width: 128px;
                height: auto;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="logo-container">
            <img src="${logoUri}" alt="CodeMate Logo" class="logo">
        </div>
        <h1>Welcome to CodeMate</h1>
        <p>Start chatting with your coding assistant here.</p>
    </body>
    </html>`;
}



function deactivate() {
    // Add cleanup code here
}

module.exports = {
    activate,
    deactivate
};
