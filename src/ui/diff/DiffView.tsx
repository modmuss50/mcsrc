import { Splitter } from "antd";
import { useState } from "react";
import DiffFileList from "./DiffFileList";
import DiffCode from "./DiffCode";

const DiffView = () => {
    const [sizes, setSizes] = useState<(number | string)[]>(['70%', '30%']);
    return (
        <Splitter layout="vertical" onResize={setSizes}>
            <Splitter.Panel min="5%" size={sizes[0]} style={{ overflow: 'hidden' }}>
                <DiffCode />
            </Splitter.Panel>
            <Splitter.Panel size={sizes[1]} style={{ overflow: 'auto' }}>
                <DiffFileList />
            </Splitter.Panel>
        </Splitter>
    )
};

export default DiffView;