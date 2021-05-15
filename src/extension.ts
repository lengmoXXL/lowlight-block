// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let cachedType: vscode.TextEditorDecorationType | undefined;
	function setOpacity(opacity: string): vscode.TextEditorDecorationType | undefined {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			let ranges: vscode.Range[] = [];
			let text = editor.document.getText();
			let matchpoints: string[] | undefined = vscode.workspace.getConfiguration('lowlight-block').get('rules');
			if (matchpoints) {
				for (let point of matchpoints) {
					let regex = new RegExp(point, 'g');
					let match;
					while (match = regex.exec(text)) {
						let range = getRange(match, editor.document);
						if (range) {
							ranges.push(range);
						}
					}
				}
			}

			let options: vscode.DecorationRenderOptions = {
				opacity: opacity,
				isWholeLine: true
			};

			if (cachedType) {
				cachedType.dispose();
			}

			cachedType = vscode.window.createTextEditorDecorationType(options);
			editor.setDecorations(cachedType, ranges);
			return cachedType;
		}
	}

	var timeout: NodeJS.Timer;
	function trigger() {
		if (timeout) { clearTimeout(timeout); }
		timeout = setTimeout(() => setOpacity('0.1'), 200);
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	let disposable = vscode.commands.registerCommand('lowlight-block.lowlight', () => {
		// The code you place here will be executed every time your command is executed
		trigger();
	});

	context.subscriptions.push(disposable);

	vscode.window.onDidChangeActiveTextEditor(
		editor => {
			if (editor) {
				trigger();
			}
		},
		null,
		context.subscriptions
	);

	vscode.workspace.onDidChangeTextDocument(
		event => {
			var activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && event.document === activeEditor.document) {
				trigger();
			}
		},
		null,
		context.subscriptions
	);

	trigger();
}


function getRange(match: RegExpExecArray, document: vscode.TextDocument): vscode.Range | undefined {
	const openChars = new Map([['{', '}'], ['(', ')'], ['[', ']']]);
	const closeChars = new Map([['}', '{'], [')', '('], [']', '[']]);

	let text = document.getText();
	let state: string[] = [];
	for (let cursor = match.index + match[0].length; cursor < text.length; ++ cursor) {
		let c = text.charAt(cursor)
		if (openChars.has(c)) {
			state.push(c)
		} else if (closeChars.has(c)) {
			if (state.length > 0) {
				let mc = state.pop();
				if (mc == undefined || openChars.get(mc) != c) {
					return;
				}
			} 
			if (state.length == 0) {
				let start = document.positionAt(match.index);
				let end = document.positionAt(cursor);
				return new vscode.Range(start, end);
			}
		}
		// console.log(c, state)
	}
	return;
}


// this method is called when your extension is deactivated
export function deactivate() {}
