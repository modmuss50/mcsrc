import { Editor, useMonaco } from "@monaco-editor/react";
import type { Token } from "../logic/Tokens";
import { useObservable } from "../utils/UseObservable";
import { observeJavadocForToken, setTokenJavadoc } from "./Javadoc";
import { currentResult } from "../logic/Decompiler";
import { useEffect, useRef } from "react";
import type { CancellationToken, editor, languages, Position } from "monaco-editor";
import { JavdocCompletionProvider } from "./JavadocCmpletionProvider";

const JavadocMarkdownEditor = ({ token }: { token: Token; }) => {
    const value = useObservable(observeJavadocForToken(token)) || "";

    const monaco = useMonaco();
    const decompileResult = useObservable(currentResult);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!monaco || !decompileResult) return;

        const completionItemProvider = monaco.languages.registerCompletionItemProvider('markdown', new JavdocCompletionProvider(decompileResult));

        return () => {
            completionItemProvider.dispose();
        };
    }, [monaco, decompileResult]);

    return (
        <Editor
            height="100%"
            defaultLanguage="markdown"
            value={value}
            onChange={(newValue) => {
                setTokenJavadoc(token, newValue);
            }}
            theme="vs-dark"
            options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineHeight: 21,
                wordWrap: "off",
            }}
            onMount={(codeEditor) => {
                editorRef.current = codeEditor;
            }}
        />
    );
};

export default JavadocMarkdownEditor;