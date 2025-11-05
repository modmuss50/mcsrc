import Editor from '@monaco-editor/react';
import { useObservable } from '../utils/UseObservable';
import { currentSource } from '../logic/Decompiler';

const Code = () => {
    const src = useObservable(currentSource);

    return (
        <Editor height="95vh" defaultLanguage="java" theme="vs-dark" value={src} />
    );
}

export default Code;