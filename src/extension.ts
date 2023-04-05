import { type } from "os";
import * as vscode from "vscode";
import { TextEditorEdit } from "vscode";

const KEY = "cycle-clipboard-ring";
const MAX_HISTORY_SIZE = 10;

type ClipboardItem = {
  text: string;
  isSingleLine: boolean;
  isEmpty: boolean;
  isSingleLineCopy: boolean;
  length: number;
  lines: number;
};

export function activate(context: vscode.ExtensionContext) {
  const clipboardRingItems: ClipboardItem[] = [];
  let clipboardRingIndex: number = -1;

  const addToClipboardRing = (text: string, selection: vscode.Selection) => {
    if (clipboardRingItems[clipboardRingItems.length - 1]?.text !== text) {
      if (clipboardRingItems.length === MAX_HISTORY_SIZE) {
        clipboardRingItems.shift(); // remove first element
      }

      clipboardRingItems.push({
        text,
        isSingleLine: selection.isSingleLine,
        isEmpty: selection.isEmpty,
        isSingleLineCopy: selection.isSingleLine && selection.isEmpty,
        length: selection.isSingleLine
          ? Math.abs(selection.end.character - selection.start.character)
          : selection.end.character,
        lines: selection.isSingleLine
          ? 0
          : Math.abs(selection.end.line - selection.start.line),
      });
      clipboardRingIndex = clipboardRingItems.length;
    }
  };

  const nextClipboardRing = async (): Promise<ClipboardItem | undefined> => {
    if (!clipboardRingItems.length) {
      return;
    }

    clipboardRingIndex--;

    if (clipboardRingIndex === -1) {
      clipboardRingIndex = clipboardRingItems.length - 1;
    }

    return clipboardRingItems[clipboardRingIndex];
  };

  const copyDisposable = vscode.commands.registerCommand(
    `${KEY}.copy`,
    async (e) => {
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        vscode.commands.executeCommand("execCopy");

        let text = await vscode.env.clipboard.readText();

        addToClipboardRing(text, activeEditor.selection);
      }
    }
  );

  const cyclePasteDisposable = vscode.commands.registerCommand(
    `${KEY}.cyclePaste`,
    async (e) => {
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        const clipboardItem = await nextClipboardRing();
        let selection: vscode.Selection | undefined = undefined;

        if (!clipboardItem) {
          return;
        }

        activeEditor
          .edit(function (editBuilder: TextEditorEdit) {
            let endCharacter = 0,
              endLine = 0;

            if (activeEditor.selection.isEmpty) {
              if (clipboardItem.isSingleLine) {
                endLine = activeEditor.selection.start.line;
                endCharacter =
                  activeEditor.selection.start.character + clipboardItem.length;
              } else if (clipboardItem.isSingleLineCopy) {
                endLine = activeEditor.selection.start.line + 1;
                endCharacter = clipboardItem.length;
              } else {
                endCharacter = clipboardItem.length;
              }

              selection = new vscode.Selection(
                new vscode.Position(
                  activeEditor.selection.start.line,
                  activeEditor.selection.start.character
                ),
                new vscode.Position(endLine, endCharacter)
              );
            }

            editBuilder.replace(activeEditor.selection, clipboardItem.text); // Replace currently selected
          })
          .then(() => {
            if (selection) {
              console.log(selection);

              activeEditor.selection = selection;
            }
          });
      }
    }
  );

  context.subscriptions.push(copyDisposable, cyclePasteDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
