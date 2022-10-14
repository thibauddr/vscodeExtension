"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSDebugMessage = void 0;
const vscode = require("vscode");
const __1 = require("..");
const entities_1 = require("../../entities");
class JSDebugMessage extends __1.DebugMessage {
    constructor(lineCodeProcessing) {
        super(lineCodeProcessing);
    }
    msg(textEditor, document, selectedVar, lineOfSelectedVar, wrapLogMessage, logMessagePrefix, quote, addSemicolonInTheEnd, insertEnclosingClass, insertEnclosingFunction, insertEmptyLineBeforeLogMessage, insertEmptyLineAfterLogMessage, delemiterInsideMessage, includeFileNameAndLineNum, tabSize, logType, logFunction) {
        const lineOfLogMsg = this.line(document, lineOfSelectedVar, selectedVar);
        const spacesBeforeMsg = this.spacesBeforeLogMsg(document, lineOfSelectedVar, lineOfLogMsg);
        const semicolon = addSemicolonInTheEnd ? ";" : "";
        const debuggingMsg = `${logFunction !== "log" ? logFunction : `debugger;`}${semicolon}`;
        const selectedVarLine = document.lineAt(lineOfSelectedVar);
        const selectedVarLineLoc = selectedVarLine.text;
        if (this.lineCodeProcessing.isAnonymousFunction(selectedVarLineLoc) &&
            this.lineCodeProcessing.isArgumentOfAnonymousFunction(selectedVarLineLoc, selectedVar) &&
            this.lineCodeProcessing.shouldTransformAnonymousFunction(selectedVarLineLoc)) {
            this.anonymousPropMsg(document, textEditor, tabSize, addSemicolonInTheEnd, selectedVarLine, debuggingMsg);
            return;
        }
        textEditor.insert(new vscode.Position(lineOfLogMsg >= document.lineCount ? document.lineCount : lineOfLogMsg, 0), `${spacesBeforeMsg}${debuggingMsg}\n`);
    }
    anonymousPropMsg(document, textEditor, tabSize, addSemicolonInTheEnd, selectedPropLine, debuggingMsg) {
        const selectedVarPropLoc = selectedPropLine.text;
        const anonymousFunctionLeftPart = selectedVarPropLoc.split("=>")[0].trim();
        const anonymousFunctionRightPart = selectedVarPropLoc
            .split("=>")[1]
            .replace(";", "")
            .trim()
            .replace(/\)\s*;?$/, "");
        const spacesBeforeSelectedVarLine = this.spacesBeforeLine(document, selectedPropLine.lineNumber);
        const spacesBeforeLinesToInsert = `${spacesBeforeSelectedVarLine}${" ".repeat(tabSize)}`;
        const isCalledInsideFunction = /\)\s*;?$/.test(selectedVarPropLoc);
        const isNextLineCallToOtherFunction = document
            .lineAt(selectedPropLine.lineNumber + 1)
            .text.trim()
            .startsWith(".");
        const anonymousFunctionClosedParenthesisLine = this.functionClosedLine(document, selectedPropLine.lineNumber, entities_1.LocElement.Parenthesis);
        const isReturnBlockMultiLine = anonymousFunctionClosedParenthesisLine - selectedPropLine.lineNumber !==
            0;
        textEditor.delete(selectedPropLine.rangeIncludingLineBreak);
        textEditor.insert(new vscode.Position(selectedPropLine.lineNumber, 0), `${spacesBeforeSelectedVarLine}${anonymousFunctionLeftPart} => {\n`);
        if (isReturnBlockMultiLine) {
            textEditor.insert(new vscode.Position(selectedPropLine.lineNumber, 0), `${spacesBeforeLinesToInsert}${debuggingMsg}\n`);
            let currentLine = document.lineAt(selectedPropLine.lineNumber + 1);
            do {
                textEditor.delete(currentLine.rangeIncludingLineBreak);
                const addReturnKeyword = currentLine.lineNumber === selectedPropLine.lineNumber + 1;
                const spacesBeforeCurrentLine = this.spacesBeforeLine(document, currentLine.lineNumber);
                if (currentLine.text.trim() === ")") {
                    currentLine = document.lineAt(currentLine.lineNumber + 1);
                    continue;
                }
                if (currentLine.lineNumber === anonymousFunctionClosedParenthesisLine) {
                    textEditor.insert(new vscode.Position(currentLine.lineNumber, 0), `${spacesBeforeCurrentLine}${addReturnKeyword ? "return " : "\t"}${currentLine.text.trim().replace(/\)\s*$/, "")}\n`);
                }
                else {
                    textEditor.insert(new vscode.Position(currentLine.lineNumber, 0), `${spacesBeforeCurrentLine}${addReturnKeyword ? "return " : "\t"}${currentLine.text.trim()}\n`);
                }
                currentLine = document.lineAt(currentLine.lineNumber + 1);
            } while (currentLine.lineNumber <
                anonymousFunctionClosedParenthesisLine + 1);
            textEditor.insert(new vscode.Position(anonymousFunctionClosedParenthesisLine + 1, 0), `${spacesBeforeSelectedVarLine}}${addSemicolonInTheEnd && !isReturnBlockMultiLine ? ";" : ""})\n`);
        }
        else {
            const nextLineText = document.lineAt(selectedPropLine.lineNumber + 1).text;
            const nextLineIsEndWithinTheMainFunction = /^\)/.test(nextLineText.trim());
            textEditor.insert(new vscode.Position(selectedPropLine.lineNumber, 0), `${spacesBeforeLinesToInsert}${debuggingMsg}\n`);
            textEditor.insert(new vscode.Position(selectedPropLine.lineNumber, 0), `${spacesBeforeLinesToInsert}return ${anonymousFunctionRightPart}${addSemicolonInTheEnd ? ";" : ""}\n`);
            textEditor.insert(new vscode.Position(selectedPropLine.lineNumber, 0), `${spacesBeforeSelectedVarLine}}${isCalledInsideFunction ? ")" : ""}${addSemicolonInTheEnd &&
                !isNextLineCallToOtherFunction &&
                !nextLineIsEndWithinTheMainFunction
                ? ";"
                : ""}${nextLineText === "" ? "" : "\n"}`);
        }
    }
    emptyBlockMsg(document, textEditor, emptyBlockLine, logMsgLine, debuggingMsg, spacesBeforeMsg) {
        if (/\){.*}/.test(emptyBlockLine.text.replace(/\s/g, ""))) {
            const textBeforeClosedFunctionParenthesis = emptyBlockLine.text.split(")")[0];
            textEditor.delete(emptyBlockLine.rangeIncludingLineBreak);
            textEditor.insert(new vscode.Position(logMsgLine >= document.lineCount ? document.lineCount : logMsgLine, 0), `${textBeforeClosedFunctionParenthesis}) {\n${logMsgLine === document.lineCount ? "\n" : ""}${spacesBeforeMsg}${debuggingMsg}\n${spacesBeforeMsg}}\n`);
            return;
        }
    }
    line(document, selectionLine, selectedVar) {
        if (selectionLine === document.lineCount - 1) {
            return selectionLine;
        }
        const multilineParenthesisVariableLine = this.getMultiLineVariableLine(document, selectionLine, entities_1.LocElement.Parenthesis);
        const multilineBracesVariableLine = this.getMultiLineVariableLine(document, selectionLine, entities_1.LocElement.Braces);
        const currentLineText = document.lineAt(selectionLine).text;
        const nextLineText = document
            .lineAt(selectionLine + 1)
            .text.replace(/\s/g, "");
        if (this.lineCodeProcessing.isObjectLiteralAssignedToVariable(`${currentLineText}\n${nextLineText}`)) {
            return this.objectLiteralLine(document, selectionLine);
        }
        else if (this.lineCodeProcessing.isFunctionAssignedToVariable(`${currentLineText}`)) {
            if (currentLineText.split("=")[0].includes(selectedVar)) {
                return this.functionAssignmentLine(document, selectionLine);
            }
            else if (this.lineCodeProcessing.isAnonymousFunction(currentLineText) &&
                !this.lineCodeProcessing.shouldTransformAnonymousFunction(currentLineText)) {
                selectionLine + 1;
            }
            else {
                return (this.functionClosedLine(document, selectionLine, entities_1.LocElement.Braces) +
                    1);
            }
        }
        else if (this.lineCodeProcessing.isObjectFunctionCall(`${currentLineText}\n${nextLineText}`)) {
            return this.objectFunctionCallLine(document, selectionLine, selectedVar);
        }
        else if (this.lineCodeProcessing.isArrayAssignedToVariable(`${currentLineText}\n${currentLineText}`)) {
            return this.arrayLine(document, selectionLine);
        }
        else if (this.lineCodeProcessing.isValueAssignedToVariable(`${currentLineText}\n${currentLineText}`)) {
            return multilineParenthesisVariableLine !== null &&
                this.lineText(document, multilineParenthesisVariableLine - 1).includes("{")
                ? multilineParenthesisVariableLine
                : selectionLine + 1;
        }
        else if (this.lineCodeProcessing.isFunctionDeclaration(currentLineText)) {
            const { openedElementOccurrences, closedElementOccurrences } = this.locOpenedClosedElementOccurrences(document.lineAt(selectionLine).text, entities_1.LocElement.Parenthesis);
            if (openedElementOccurrences === closedElementOccurrences) {
                return selectionLine + 1;
            }
            return multilineParenthesisVariableLine || selectionLine + 1;
        }
        else if (/`/.test(currentLineText)) {
            return this.templateStringLine(document, selectionLine);
        }
        else if (multilineParenthesisVariableLine !== null &&
            this.lineText(document, multilineParenthesisVariableLine - 1).includes("{")) {
            return multilineParenthesisVariableLine;
        }
        else if (multilineBracesVariableLine !== null) {
            return multilineBracesVariableLine;
        }
        else if (currentLineText.trim().startsWith("return")) {
            return selectionLine;
        }
        return selectionLine + 1;
    }
    objectLiteralLine(document, selectionLine) {
        const currentLineText = document.lineAt(selectionLine).text;
        let nbrOfOpenedBrackets = (currentLineText.match(/{/g) || [])
            .length;
        let nbrOfClosedBrackets = (currentLineText.match(/}/g) || [])
            .length;
        let currentLineNum = selectionLine + 1;
        while (currentLineNum < document.lineCount) {
            const currentLineText = document.lineAt(currentLineNum).text;
            nbrOfOpenedBrackets += (currentLineText.match(/{/g) || []).length;
            nbrOfClosedBrackets += (currentLineText.match(/}/g) || []).length;
            currentLineNum++;
            if (nbrOfOpenedBrackets === nbrOfClosedBrackets) {
                break;
            }
        }
        return nbrOfClosedBrackets === nbrOfOpenedBrackets
            ? currentLineNum
            : selectionLine + 1;
    }
    objectFunctionCallLine(document, selectionLine, selectedVar) {
        let currentLineText = document.lineAt(selectionLine).text;
        let nextLineText = document
            .lineAt(selectionLine + 1)
            .text.replace(/\s/g, "");
        if (/\((\s*)$/.test(currentLineText.split(selectedVar)[0]) ||
            /,(\s*)$/.test(currentLineText.split(selectedVar)[0])) {
            return selectionLine + 1;
        }
        let totalOpenedParenthesis = 0;
        let totalClosedParenthesis = 0;
        const { openedElementOccurrences, closedElementOccurrences } = this.locOpenedClosedElementOccurrences(currentLineText, entities_1.LocElement.Parenthesis);
        totalOpenedParenthesis += openedElementOccurrences;
        totalClosedParenthesis += closedElementOccurrences;
        let currentLineNum = selectionLine + 1;
        if (totalOpenedParenthesis !== totalClosedParenthesis ||
            currentLineText.endsWith(".") ||
            nextLineText.trim().startsWith(".")) {
            while (currentLineNum < document.lineCount) {
                currentLineText = document.lineAt(currentLineNum).text;
                const { openedElementOccurrences, closedElementOccurrences } = this.locOpenedClosedElementOccurrences(currentLineText, entities_1.LocElement.Parenthesis);
                totalOpenedParenthesis += openedElementOccurrences;
                totalClosedParenthesis += closedElementOccurrences;
                if (currentLineNum === document.lineCount - 1) {
                    break;
                }
                nextLineText = document.lineAt(currentLineNum + 1).text;
                currentLineNum++;
                if (totalOpenedParenthesis === totalClosedParenthesis &&
                    !currentLineText.endsWith(".") &&
                    !nextLineText.trim().startsWith(".")) {
                    break;
                }
            }
        }
        return totalOpenedParenthesis === totalClosedParenthesis
            ? currentLineNum
            : selectionLine + 1;
    }
    functionAssignmentLine(document, selectionLine) {
        const currentLineText = document.lineAt(selectionLine).text;
        if (/{/.test(currentLineText)) {
            return (this.closingElementLine(document, selectionLine, entities_1.LocElement.Braces) + 1);
        }
        else {
            const closedParenthesisLine = this.closingElementLine(document, selectionLine, entities_1.LocElement.Parenthesis);
            return (this.closingElementLine(document, closedParenthesisLine, entities_1.LocElement.Braces) + 1);
        }
    }
    templateStringLine(document, selectionLine) {
        const currentLineText = document.lineAt(selectionLine).text;
        let currentLineNum = selectionLine + 1;
        let nbrOfBackticks = (currentLineText.match(/`/g) || []).length;
        while (currentLineNum < document.lineCount) {
            const currentLineText = document.lineAt(currentLineNum).text;
            nbrOfBackticks += (currentLineText.match(/`/g) || []).length;
            if (nbrOfBackticks % 2 === 0) {
                break;
            }
            currentLineNum++;
        }
        return nbrOfBackticks % 2 === 0 ? currentLineNum + 1 : selectionLine + 1;
    }
    arrayLine(document, selectionLine) {
        const currentLineText = document.lineAt(selectionLine).text;
        let nbrOfOpenedBrackets = (currentLineText.match(/\[/g) || [])
            .length;
        let nbrOfClosedBrackets = (currentLineText.match(/\]/g) || [])
            .length;
        let currentLineNum = selectionLine + 1;
        if (nbrOfOpenedBrackets !== nbrOfClosedBrackets) {
            while (currentLineNum < document.lineCount) {
                const currentLineText = document.lineAt(currentLineNum).text;
                nbrOfOpenedBrackets += (currentLineText.match(/\[/g) || []).length;
                nbrOfClosedBrackets += (currentLineText.match(/\]/g) || []).length;
                currentLineNum++;
                if (nbrOfOpenedBrackets === nbrOfClosedBrackets) {
                    break;
                }
            }
        }
        return nbrOfOpenedBrackets === nbrOfClosedBrackets
            ? currentLineNum
            : selectionLine + 1;
    }
    // Line for a variable which is in multiline context (function paramter, or deconstructred object)
    getMultiLineVariableLine(document, lineNum, blockType) {
        let currentLineNum = lineNum - 1;
        let nbrOfOpenedBlockType = 0;
        let nbrOfClosedBlockType = 1; // Closing parenthesis
        while (currentLineNum >= 0) {
            const currentLineText = document.lineAt(currentLineNum).text;
            const currentLineParenthesis = this.locOpenedClosedElementOccurrences(currentLineText, blockType);
            nbrOfOpenedBlockType += currentLineParenthesis.openedElementOccurrences;
            nbrOfClosedBlockType += currentLineParenthesis.closedElementOccurrences;
            if (nbrOfOpenedBlockType === nbrOfClosedBlockType) {
                return this.closingElementLine(document, currentLineNum, blockType) + 1;
            }
            currentLineNum--;
        }
        return null;
    }
    functionClosedLine(docuemt, declarationLine, locElementType) {
        let nbrOfOpenedBraces = 0;
        let nbrOfClosedBraces = 0;
        while (declarationLine < docuemt.lineCount) {
            const { openedElementOccurrences, closedElementOccurrences } = this.locOpenedClosedElementOccurrences(this.lineText(docuemt, declarationLine), locElementType);
            nbrOfOpenedBraces += openedElementOccurrences;
            nbrOfClosedBraces += closedElementOccurrences;
            if (nbrOfOpenedBraces - nbrOfClosedBraces === 0) {
                return declarationLine;
            }
            declarationLine++;
        }
        return -1;
    }
    enclosingBlockName(document, lineOfSelectedVar, blockType) {
        let currentLineNum = lineOfSelectedVar;
        while (currentLineNum >= 0) {
            const currentLineText = document.lineAt(currentLineNum).text;
            switch (blockType) {
                case "class":
                    if (this.lineCodeProcessing.doesContainClassDeclaration(currentLineText)) {
                        if (lineOfSelectedVar > currentLineNum &&
                            lineOfSelectedVar <
                                this.closingElementLine(document, currentLineNum, entities_1.LocElement.Braces)) {
                            return `${this.lineCodeProcessing.getClassName(currentLineText)}`;
                        }
                    }
                    break;
                case "function":
                    if (this.lineCodeProcessing.doesContainsNamedFunctionDeclaration(currentLineText) &&
                        !this.lineCodeProcessing.doesContainsBuiltInFunction(currentLineText)) {
                        if (lineOfSelectedVar >= currentLineNum &&
                            lineOfSelectedVar <
                                this.closingElementLine(document, currentLineNum, entities_1.LocElement.Braces)) {
                            if (this.lineCodeProcessing.getFunctionName(currentLineText)
                                .length !== 0) {
                                return `${this.lineCodeProcessing.getFunctionName(currentLineText)}`;
                            }
                            return "";
                        }
                    }
                    break;
            }
            currentLineNum--;
        }
        return "";
    }
    detectAll(document, delemiterInsideMessage, quote) {
        const documentNbrOfLines = document.lineCount;
        const logMessages = [];
        for (let i = 0; i < documentNbrOfLines; i++) {
            const turboConsoleLogMessage = /debugger\(/;
            if (turboConsoleLogMessage.test(document.lineAt(i).text)) {
                const logMessage = {
                    spaces: "",
                    lines: [],
                };
                logMessage.spaces = this.spacesBeforeLogMsg(document, i, i);
                const closedParenthesisLine = this.closingElementLine(document, i, entities_1.LocElement.Parenthesis);
                let msg = "";
                for (let j = i; j <= closedParenthesisLine; j++) {
                    msg += document.lineAt(j).text;
                    logMessage.lines.push(document.lineAt(j).rangeIncludingLineBreak);
                }
                if (new RegExp(`${delemiterInsideMessage}[a-zA-Z0-9]+${quote},(//)?[a-zA-Z0-9]+`).test(msg.replace(/\s/g, ""))) {
                    logMessages.push(logMessage);
                }
            }
        }
        return logMessages;
    }
    replaceInFile(files, from, to) {
        const replaceInFiles = require("../../../node_modules/replace-in-file");
        const options = {
            files: '*.ts',
            // Replacement
            from: /debugger;/g,
            to: 'test',
            saveOldFile: false,
            encoding: "utf8",
            shouldSkipBinaryFiles: true,
            onlyFindPathsWithoutReplace: false,
            returnPaths: true,
            returnCountOfMatchesByPaths: true, // default
        };
        replaceInFiles(options)
            .then((changedFiles) => {
            console.log("Modified files:", changedFiles.join(", "));
        })
            .catch((error) => {
            console.error("Error occurred:", error);
        });
    }
}
exports.JSDebugMessage = JSDebugMessage;
//# sourceMappingURL=index.js.map