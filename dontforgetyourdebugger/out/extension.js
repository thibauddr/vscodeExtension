"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const js_1 = require("./debug-message/js");
const js_2 = require("./line-code-processing/js");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const jsLineCodeProcessing = new js_2.JSLineCodeProcessing();
    const jsDebugMessage = new js_1.JSDebugMessage(jsLineCodeProcessing);
    /**
     * Add new line with debugger
     */
    let createDebugger = vscode.commands.registerCommand("dontforgetyourdebugger.createDebugger", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const tabSize = getTabSize(editor.options.tabSize);
        const document = editor.document;
        const config = vscode.workspace.getConfiguration("dontforgetyourdebugger");
        const properties = getExtensionProperties(config);
        for (const element of editor.selections) {
            const selection = element;
            let wordUnderCursor = "";
            const rangeUnderCursor = document.getWordRangeAtPosition(selection.active);
            if (rangeUnderCursor) {
                wordUnderCursor = document.getText(rangeUnderCursor);
            }
            const selectedVar = document.getText(selection) || wordUnderCursor;
            const lineOfSelectedVar = selection.active.line;
            const { wrapLogMessage, logMessagePrefix, quote, addSemicolonInTheEnd, insertEnclosingClass, insertEnclosingFunction, insertEmptyLineBeforeLogMessage, insertEmptyLineAfterLogMessage, delimiterInsideMessage, includeFileNameAndLineNum, logType, logFunction, } = properties;
            await editor.edit((editBuilder) => {
                jsDebugMessage.msg(editBuilder, document, selectedVar, lineOfSelectedVar, wrapLogMessage, logMessagePrefix, quote, addSemicolonInTheEnd, insertEnclosingClass, insertEnclosingFunction, insertEmptyLineBeforeLogMessage, insertEmptyLineAfterLogMessage, delimiterInsideMessage, includeFileNameAndLineNum, tabSize, logType, logFunction);
            });
        }
    });
    context.subscriptions.push(createDebugger);
    /**
     * Remove all debugger on your project
     */
    let removeDebugger = vscode.commands.registerCommand("dontforgetyourdebugger.removeDebugger", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const tabSize = getTabSize(editor.options.tabSize);
        const document = editor.document;
        const config = vscode.workspace.getConfiguration("dontforgetyourdebugger");
        const properties = getExtensionProperties(config);
        jsDebugMessage.replaceInFile('*.ts', '*debugger;*', '');
    });
    context.subscriptions.push(removeDebugger);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
function getExtensionProperties(workspaceConfig) {
    const wrapLogMessage = workspaceConfig.wrapLogMessage || false;
    const logMessagePrefix = workspaceConfig.logMessagePrefix
        ? workspaceConfig.logMessagePrefix
        : "";
    const addSemicolonInTheEnd = workspaceConfig.addSemicolonInTheEnd || false;
    const insertEnclosingClass = workspaceConfig.insertEnclosingClass;
    const insertEnclosingFunction = workspaceConfig.insertEnclosingFunction;
    const insertEmptyLineBeforeLogMessage = workspaceConfig.insertEmptyLineBeforeLogMessage;
    const insertEmptyLineAfterLogMessage = workspaceConfig.insertEmptyLineAfterLogMessage;
    const quote = workspaceConfig.quote || '"';
    const delimiterInsideMessage = workspaceConfig.delimiterInsideMessage || "~";
    const includeFileNameAndLineNum = workspaceConfig.includeFileNameAndLineNum || false;
    const logType = workspaceConfig.logType || "log";
    const logFunction = workspaceConfig.logFunction || "log";
    const extensionProperties = {
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
function getTabSize(tabSize) {
    if (tabSize && typeof tabSize === "number") {
        return tabSize;
    }
    else if (tabSize && typeof tabSize === "string") {
        return parseInt(tabSize);
    }
    else {
        return 4;
    }
}
//# sourceMappingURL=extension.js.map