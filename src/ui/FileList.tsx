import { Card, Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { map, type Observable } from 'rxjs';
import { classesList } from '../logic/JarFile';
import { useObservable } from '../utils/UseObservable';
import Header from './Header';
import { selectedFile } from '../logic/Decompiler';

// Given a list of class files, create a tree structure
const data: Observable<TreeDataNode[]> = classesList.pipe(
    map(classFiles => {
        const root: TreeDataNode[] = [];

        [...classFiles].sort().forEach(filePath => {
            const parts = filePath.split('/');
            let currentLevel = root;

            parts.forEach((part, index) => {
                let existingNode = currentLevel.find(node => node.title === part);
                if (!existingNode) {
                    existingNode = {
                        title: part.replace('.class', ''),
                        key: parts.slice(0, index + 1).join('/'),
                        children: [],
                    };
                    currentLevel.push(existingNode);
                }
                if (index < parts.length - 1) {
                    if (!existingNode.children) {
                        existingNode.children = [];
                    }
                    currentLevel = existingNode.children;
                }
            });
        });
        return root;
    })
);

const FileList = () => {
    const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
        console.log(selectedKeys.join('/'));
        selectedFile.next(selectedKeys.join('/'));
    };

    const treeData = useObservable(data);

    return (
        <div>
            <Card cover={<Header />} variant="borderless" style={{ height: '90vh' }}>
                <Tree
                    showLine
                    switcherIcon={<DownOutlined />}
                    defaultExpandedKeys={['0-0-0']}
                    onSelect={onSelect}
                    treeData={treeData}
                />
            </Card>

        </div>
    );
};

export default FileList