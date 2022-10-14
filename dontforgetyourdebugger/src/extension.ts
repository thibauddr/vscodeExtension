// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { DebugMessage } from "./debug-message";
import { JSDebugMessage } from "./debug-message/js";
import { JSLineCodeProcessing } from "./line-code-processing/js";
import { ExtensionProperties, Message } from "./entities";
import { LineCodeProcessing } from "./line-code-processing";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const jsLineCodeProcessing: LineCodeProcessing = new JSLineCodeProcessing();
  const jsDebugMessage: DebugMessage = new JSDebugMessage(jsLineCodeProcessing);

  /**
   * Add new line with debugger
   */
  let createDebugger = vscode.commands.registerCommand(
    "dontforgetyourdebugger.createDebugger",
    async () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const tabSize: number | string = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("dontforgetyourdebugger");
      const properties: ExtensionProperties = getExtensionProperties(config);
      for (const element of editor.selections) {
        const selection: vscode.Selection = element;

        let wordUnderCursor = "";
        const rangeUnderCursor: vscode.Range | undefined =
          document.getWordRangeAtPosition(selection.active);
        if (rangeUnderCursor) {
          wordUnderCursor = document.getText(rangeUnderCursor);
        }
        const selectedVar: string =
          document.getText(selection) || wordUnderCursor;
        const lineOfSelectedVar: number = selection.active.line;
        const {
          wrapLogMessage,
          logMessagePrefix,
          quote,
          addSemicolonInTheEnd,
          insertEnclosingClass,
          insertEnclosingFunction,
          insertEmptyLineBeforeLogMessage,
          insertEmptyLineAfterLogMessage,
          delimiterInsideMessage,
          includeFileNameAndLineNum,
          logType,
          logFunction,
        } = properties;
        await editor.edit((editBuilder) => {
          jsDebugMessage.msg(
            editBuilder,
            document,
            selectedVar,
            lineOfSelectedVar,
            wrapLogMessage,
            logMessagePrefix,
            quote,
            addSemicolonInTheEnd,
            insertEnclosingClass,
            insertEnclosingFunction,
            insertEmptyLineBeforeLogMessage,
            insertEmptyLineAfterLogMessage,
            delimiterInsideMessage,
            includeFileNameAndLineNum,
            tabSize,
            logType,
            logFunction
          );
        });
      }
    }
  );

  context.subscriptions.push(createDebugger);

  /**
   * Remove all debugger on your project
   */
  let removeDebugger = vscode.commands.registerCommand(
    "dontforgetyourdebugger.removeDebugger",
    () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const tabSize: number = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("dontforgetyourdebugger");
      const properties: ExtensionProperties = getExtensionProperties(config);
      jsDebugMessage.replaceInFile(
        '*.ts',
        '*debugger;*',
        ''
      );
    }
  );

  context.subscriptions.push(removeDebugger);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getExtensionProperties(
  workspaceConfig: vscode.WorkspaceConfiguration
) {
  const wrapLogMessage = workspaceConfig.wrapLogMessage || false;
  const logMessagePrefix = workspaceConfig.logMessagePrefix
    ? workspaceConfig.logMessagePrefix
    : "";
  const addSemicolonInTheEnd = workspaceConfig.addSemicolonInTheEnd || false;
  const insertEnclosingClass = workspaceConfig.insertEnclosingClass;
  const insertEnclosingFunction = workspaceConfig.insertEnclosingFunction;
  const insertEmptyLineBeforeLogMessage =
    workspaceConfig.insertEmptyLineBeforeLogMessage;
  const insertEmptyLineAfterLogMessage =
    workspaceConfig.insertEmptyLineAfterLogMessage;
  const quote = workspaceConfig.quote || '"';
  const delimiterInsideMessage = workspaceConfig.delimiterInsideMessage || "~";
  const includeFileNameAndLineNum =
    workspaceConfig.includeFileNameAndLineNum || false;
  const logType = workspaceConfig.logType || "log";
  const logFunction = workspaceConfig.logFunction || "log";
  const extensionProperties: ExtensionProperties = {
    wrapLogMessage,
    logMessagePrefix,
    addSemicolonInTheEnd,
    insertEnclosingClass,
    insertEnclosingFunction,
    insertEmptyLineBeforeLogMessage,
    insertEmptyLineAfterLogMessage,
    quote,
    delimiterInsideMessage,
    includeFileNameAndLineNum,
    logType,
    logFunction,
  };
  return extensionProperties;
}

function getTabSize(tabSize: string | number | undefined): number {
  if (tabSize && typeof tabSize === "number") {
    return tabSize;
  } else if (tabSize && typeof tabSize === "string") {
    return parseInt(tabSize);
  } else {
    return 4;
  }
}
