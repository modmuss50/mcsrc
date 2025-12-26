import { Modal } from "antd";
import { activeJavadocToken } from "./Javadoc";
import { useObservable } from "../utils/UseObservable";
import { IS_JAVADOC_EDITOR } from "../site";
import type { Token } from "../logic/Tokens";
import JavadocMarkdownEditor from "./JavadocMarkdownEditor";

const ModalBody = ({ token }: { token: Token; }) => {
    return (
        <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div style={{
                padding: "10px",
                background: "#1e1e1e",
                color: "#d4d4d4",
                fontFamily: "monospace",
                fontSize: "12px",
                borderBottom: "1px solid #333"
            }}>
                <div><strong>Type:</strong> {token.type}</div>
                <div><strong>Class:</strong> {token.className}</div>
                {token.type === 'field' || token.type === 'method' ? (
                    <>
                        <div><strong>Name:</strong> {token.name}</div>
                        <div><strong>Descriptor:</strong> {token.descriptor}</div>
                    </>
                ) : null}
            </div>
            <div style={{ height: "440px", width: "100%", boxSizing: "border-box" }}>
                <JavadocMarkdownEditor token={token} />
            </div>
        </div>
    );
};

const JavadocModal = () => {
    if (!IS_JAVADOC_EDITOR) {
        return (<></>);
    }

    const token = useObservable(activeJavadocToken);

    return (
        <Modal
            title="Javadoc"
            open={token !== null}
            onCancel={() => activeJavadocToken.next(null)}
            footer={null}
            width={750}
        >
            {token && <ModalBody token={token} />}
        </Modal>
    );
};

export default JavadocModal;