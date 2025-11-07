import { Modal, Progress } from "antd";
import { useObservable } from "../utils/UseObservable";
import { indexProgress } from "../logic/Indexer";

const IndexProgressModal = () => {
    const progress = useObservable(indexProgress);
    const percent = Math.round(progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0);

    return (
        <Modal
            title="Indexing Minecraft Jar"
            open={progress && progress.total > 0}
            footer={null}
            closable={false}
            width={750}
        >
            {progress?.name.replace('.class', '')}
            <Progress percent={percent} />
        </Modal>
    );
}

export default IndexProgressModal;