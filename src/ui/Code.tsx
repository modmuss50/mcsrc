import Editor, { useMonaco } from '@monaco-editor/react';
import { useObservable } from '../utils/UseObservable';
import { currentResult, isDecompiling } from '../logic/Decompiler';
import { useEffect, useRef } from 'react';
import { editor } from "monaco-editor";
import { isThin } from '../logic/Browser';
import { classesList } from '../logic/JarFile';
import { openTab } from '../logic/Tabs';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Code = () => {
    const monaco = useMonaco();

    const decompileResult = useObservable(currentResult);
    const classList = useObservable(classesList);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const hideMinimap = useObservable(isThin);
    const decompiling = useObservable(isDecompiling);

    useEffect(() => {
        if (!monaco) return;
        const definitionProvider = monaco.languages.registerDefinitionProvider("java", {
            provideDefinition(model, position, token) {
                const { lineNumber, column } = position;

                if (!decompileResult) {
                    console.error("No decompile result available for definition provider.");
                    return null;
                }

                const lines = model.getLinesContent();
                let charCount = 0;
                let targetOffset = 0;

                for (let i = 0; i < lineNumber - 1; i++) {
                    charCount += lines[i].length + 1; // +1 for \n
                }
                targetOffset = charCount + (column - 1);

                for (const token of decompileResult.classTokens) {
                    if (targetOffset >= token.start && targetOffset <= token.start + token.length) {
                        const className = token.className + ".class";
                        console.log(`Found token for definition: ${className} at offset ${token.start}`);

                        if (classList && classList.includes(className)) {
                            openTab(className);
                            return null;
                        }

                        // Library or java classes.
                        return null;
                    }

                    // Tokens are sorted, we know we can stop searching
                    if (token.start > targetOffset) {
                        break;
                    }
                }

                return null;
            },
        });

        return () => {
            definitionProvider.dispose();
        };
    }, [monaco, decompileResult, classList]);

    // Scroll to top when source changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
            editorRef.current.setPosition({ lineNumber: 1, column: 1 });
        }
    }, [decompileResult]);

    return (
        <Spin
            indicator={<LoadingOutlined spin />}
            size={"large"}
            spinning={!!decompiling}
            tip="Decompiling..."
            style={{
                height: '100%',
                color: 'white'
            }}
        >
            <Editor
                height="100vh"
                defaultLanguage="java"
                theme="vs-dark"
                value={decompileResult?.source}
                options={{
                    readOnly: true,
                    domReadOnly: true,
                    tabSize: 3,
                    minimap: { enabled: !hideMinimap }
                }}
                onMount={(editor) => { editorRef.current = editor; }} />
        </Spin>
    );
};

export default Code;