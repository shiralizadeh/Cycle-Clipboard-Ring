import * as vscode from "vscode";
import { TextEditorEdit } from "vscode";

const KEY = "cycle-clipboard-ring";

export function activate(context: vscode.ExtensionContext) {
  const copyDisposable = vscode.commands.registerCommand(`${KEY}.copy`, (e) => {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
      const text = activeEditor.document.getText(activeEditor.selection);

      vscode.env.clipboard.writeText(text);
    }
  });

  const pasteDisposable = vscode.commands.registerCommand(
    `${KEY}.paste`,
    async (e) => {
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        let text = await vscode.env.clipboard.readText();

        activeEditor.edit(function (editBuilder: TextEditorEdit) {
          editBuilder.replace(activeEditor.selection, text); // Replace currently selected
          activeEditor.selection = new vscode.Selection(
            activeEditor.selection.end,
            activeEditor.selection.end
          ); // Move cursor to end of pasted text
        });
      }
    }
  );

  const cyclePasteDisposable = vscode.commands.registerCommand(
    `${KEY}.cyclePaste`,
    async (e) => {
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        let text = "CYCLE_PASTE";

        activeEditor
          .edit(function (editBuilder: TextEditorEdit) {
            editBuilder.delete(activeEditor.selection); // Delete anything currently selected
          })
          .then(function () {
            activeEditor.edit(function (editBuilder: TextEditorEdit) {
              editBuilder.insert(activeEditor.selection.start, text); // Insert the text
            });
          });
      }
    }
  );

  context.subscriptions.push(
    copyDisposable,
    pasteDisposable,
    cyclePasteDisposable
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
