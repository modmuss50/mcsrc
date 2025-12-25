import {
    editor,
    languages,
    type CancellationToken,
    type IDisposable,
} from "monaco-editor";
import type { DecompileResult } from "../logic/Decompiler";
import { getTokenLocation, type Token } from "../logic/Tokens";
import type { JavadocData, JavadocString } from "./Javadoc";

type monaco = typeof import("monaco-editor");

const EDIT_JAVADOC_COMMAND_ID = 'editor.action.editJavadoc';

export function applyJavadocCodeExtensions(monaco: monaco, editor: editor.IStandaloneCodeEditor, decompile: DecompileResult, javadoc: JavadocData): IDisposable {
    const viewZoneIds: string[] = [];
    editor.changeViewZones((accessor) => {
        decompile.tokens
            .filter(token => token.declaration && token.type === "class")
            .forEach(token => {
                const mdValue = getJavadocForToken(token, javadoc);
                if (!mdValue) {
                    return;
                }

                const location = getTokenLocation(decompile, token);

                const domNode = document.createElement('div');
                domNode.className = 'javadoc-zone';
                domNode.innerHTML = `<span style="color: #6A9955;">${formatMarkdownAsHtml(mdValue)}</span>`;

                const zoneId = accessor.addZone({
                    afterLineNumber: location.line - 1,
                    heightInLines: 2,
                    domNode: domNode
                });

                viewZoneIds.push(zoneId);
            });
    });

    const codeLense = monaco.languages.registerCodeLensProvider("java", {
        provideCodeLenses: function (model: editor.ITextModel, token: CancellationToken): languages.ProviderResult<languages.CodeLensList> {
            const lenses: languages.CodeLens[] = [];

            for (const token of decompile.tokens) {
                if (!token.declaration || token.type == 'parameter') {
                    continue;
                }

                const location = getTokenLocation(decompile, token);
                lenses.push({
                    range: {
                        startLineNumber: location.line,
                        startColumn: 0,
                        endLineNumber: location.line,
                        endColumn: 0,
                    },
                    command: {
                        id: EDIT_JAVADOC_COMMAND_ID,
                        title: "Edit Javadoc",
                        arguments: [token]
                    }
                });
            }

            return {
                lenses,
                dispose: () => { }
            };
        }
    });


    const editJavadocCommand = monaco.editor.addEditorAction({
        id: EDIT_JAVADOC_COMMAND_ID,
        label: 'Edit Javadoc',
        run: function (editor, ...args) {
            const token: Token = args[0];
            console.log("Edit Javadoc for token:", token);
        }
    });

    return {
        dispose() {
            editJavadocCommand.dispose();
            codeLense.dispose();
            editor.changeViewZones((accessor) => {
                viewZoneIds.forEach(id => accessor.removeZone(id));
            });
        }
    };
}

function getJavadocForToken(token: Token, javadoc: JavadocData): JavadocString | null {
    switch (token.type) {
        case 'class':
            return javadoc.classes[token.className]?.javadoc || null;
        case 'method':
            return javadoc.classes[token.className]?.methods[token.name] || null;
        case 'field':
            return javadoc.classes[token.className]?.fields[token.name] || null;
    }

    return null;
}

function formatMarkdownAsHtml(md: string): string {
    // TODO maybe use a proper markdown parser/renderer here
    return md.replace("\n", "<br>");
}