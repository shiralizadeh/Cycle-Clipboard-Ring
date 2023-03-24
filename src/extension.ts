import * as vscode from "vscode";
import { TextEditorEdit } from "vscode";

const KEY = "cycle-clipboard-ring";

export function activate(context: vscode.ExtensionContext) {
  const clipboardRing: string[] = [];
  let clipboardRingIndex: number = -1;

  const addToClipboardRing = (text: string) => {
    if (clipboardRing[clipboardRing.length - 1] !== text) {
      clipboardRing.push(text);
      clipboardRingIndex = clipboardRing.length;
    }
  };

  const nextClipboardRing = async () => {
    if (!clipboardRing.length) {
      return await vscode.env.clipboard.readText();
    }

    clipboardRingIndex--;

    if (clipboardRingIndex === -1) {
      clipboardRingIndex = clipboardRing.length - 1;
    }

    return clipboardRing[clipboardRingIndex];
  };

  const copyDisposable = vscode.commands.registerCommand(`${KEY}.copy`, (e) => {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
      const text = activeEditor.document.getText(activeEditor.selection);

      vscode.env.clipboard.writeText(text);
      addToClipboardRing(text);
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
        const text = await nextClipboardRing();

        activeEditor.edit(function (editBuilder: TextEditorEdit) {
          editBuilder.replace(activeEditor.selection, text); // Replace currently selected
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
