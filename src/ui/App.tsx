
import { ConfigProvider, Splitter, Button, theme } from 'antd';
import FileList from "./FileList.tsx";
import Code from "./Code.tsx";


const App = () => (
    <ConfigProvider
        theme={{
            algorithm: theme.darkAlgorithm,
            components: {
                Card: {
                    bodyPadding: 4,
                },
            },
        }}
    >
        <Splitter>
            <Splitter.Panel collapsible defaultSize="20%" min="5%">
                <FileList />
            </Splitter.Panel>
            <Splitter.Panel>
                <Code />
            </Splitter.Panel>
        </Splitter>
    </ConfigProvider>
);


export default App