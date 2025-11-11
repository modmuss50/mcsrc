import { DiffEditor } from '@monaco-editor/react';
import { useObservable } from '../../utils/UseObservable';
import { getLeftDiff, getRightDiff } from '../../logic/Diff';
import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';

const DiffCode = () => {
    const leftResult = useObservable(getLeftDiff().result);
    const rightResult = useObservable(getRightDiff().result);
    const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

    /* Disabled as it jumps to the line of the previous change when switching files
    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        const lineChanges = editorRef.current.getLineChanges();
        if (lineChanges && lineChanges.length > 0) {
            const firstChange = lineChanges[0];
            console.log('Navigating to first change at line:', firstChange.modifiedStartLineNumber);
            editorRef.current.revealLineInCenter(firstChange.modifiedStartLineNumber);
        }
    }, [leftResult, rightResult]);
    */

    return (
        <DiffEditor
            height="100vh"
            language="java"
            theme="vs-dark"
            original={leftResult?.source}
            modified={rightResult?.source}
            onMount={(editor) => {
                editorRef.current = editor;
            }}
            options={{
                readOnly: true,
                domReadOnly: true,
                //tabSize: 3,
            }} />
    );
}

export default DiffCode;