import { Tree, Dropdown, message } from 'antd';
import type { TreeDataNode, TreeProps, MenuProps } from 'antd';
import { CaretDownFilled } from '@ant-design/icons';
import { firstValueFrom, map, shareReplay, type Observable } from 'rxjs';
import { classesList } from '../logic/JarFile';
import { useObservable } from '../utils/UseObservable';
import { selectedFile } from '../logic/State';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'antd/es/table/interface';
import { openTab } from '../logic/Tabs';
import { minecraftJar } from '../logic/MinecraftApi';
import { decompile } from '../logic/vf';
import { usageQuery } from '../logic/FindUsages';

// Sorts nodes with children first (directories before files), then alphabetically
const sortTreeNodes = (nodes: TreeDataNode[] = []) => {
    nodes.sort((a, b) => {
        const aHas = !!(a.children && a.children.length);
        const bHas = !!(b.children && b.children.length);
        if (aHas !== bHas) return aHas ? -1 : 1;
        const aTitle = String(a.title).toLowerCase();
        const bTitle = String(b.title).toLowerCase();
        return aTitle.localeCompare(bTitle);
    });
    nodes.forEach(n => {
        if (n.children && n.children.length) sortTreeNodes(n.children);
    });
};

// Given a list of class files, create a tree structure
const data: Observable<TreeDataNode[]> = classesList.pipe(
    map(classFiles => {
        console.log('Building file tree');
        const root: TreeDataNode[] = [];

        classFiles.forEach(filePath => {
            const parts = filePath.split('/');
            let currentLevel = root;

            parts.forEach((part, index) => {
                let existingNode = currentLevel.find(node => node.title === part);
                if (!existingNode) {
                    existingNode = {
                        title: part.replace('.class', ''),
                        key: parts.slice(0, index + 1).join('/'),
                        children: [],
                        isLeaf: index === parts.length - 1
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
        sortTreeNodes(root);
        return root;
    }),
    shareReplay(1)
);

const selectedFileKeys = selectedFile.pipe(
    map(file => [file])
);

function getPathKeys(filePath: string): Key[] {
    const parts = filePath.split('/').slice(0, -1);
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        result.push(parts.slice(0, i + 1).join('/'));
    }
    return result;
}

const handleCopyContent = async (path: string) => {
    try {
        const jar = await firstValueFrom(minecraftJar);
        if (!jar) return;

        if (path.endsWith(".class")) {
            message.loading({ content: 'Decompiling...', key: 'copy-content' });
            const classes = await firstValueFrom(classesList);
            const source = await decompile(path.replace(".class", ""), {
                source: async (name: string) => {
                    const file = jar.jar.entries[name + ".class"];
                    if (file) {
                        const arrayBuffer = await file.bytes();
                        return new Uint8Array(arrayBuffer);
                    }
                    return null;
                },
                resources: classes.map(c => c.replace(".class", ""))
            });
            await navigator.clipboard.writeText(source);
            message.success({ content: 'Content copied to clipboard', key: 'copy-content' });
        } else {
            const entry = jar.jar.entries[path];
            if (entry) {
                const text = await entry.text();
                await navigator.clipboard.writeText(text);
                message.success('Content copied to clipboard');
            } else {
                message.error('File not found in jar');
            }
        }
    } catch (e) {
        console.error(e);
        message.error({ content: 'Failed to copy content', key: 'copy-content' });
    }
};

const FileList = () => {
    const [expandedKeys, setExpandedKeys] = useState<Key[]>();
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, key: string, isLeaf: boolean; } | null>(null);

    const selectedKeys = useObservable(selectedFileKeys);
    const classes = useObservable(classesList);
    const onSelect: TreeProps['onSelect'] = useCallback((selectedKeys) => {
        if (selectedKeys.length === 0) return;
        if (!classes || !classes.includes(selectedKeys[0] as string)) return;
        openTab(selectedKeys.join("/"));
    }, [classes]);

    const treeData = useObservable(data);

    if (!expandedKeys && selectedKeys) {
        setExpandedKeys(getPathKeys(selectedKeys[0]));
    }

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    const onRightClick: TreeProps['onRightClick'] = useCallback(({ event, node }) => {
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            key: node.key as string,
            isLeaf: !!node.isLeaf
        });
    }, []);

    const menuItems: MenuProps['items'] = useMemo(() => contextMenu ? [
        {
            key: 'copy-package-path',
            label: 'Copy Package Path',
            onClick: () => {
                const path = contextMenu.key;
                const formattedPath = path.replace(/\//g, '.').replace('.class', '');
                navigator.clipboard.writeText(formattedPath);
                message.success('Path copied');
            }
        },
        {
            key: 'copy-path',
            label: 'Copy Path',
            onClick: () => {
                navigator.clipboard.writeText(contextMenu.key);
                message.success('Relative path copied');
            }
        },
        {
            key: 'copy-content',
            label: 'Copy File Content',
            onClick: () => handleCopyContent(contextMenu.key),
            disabled: !contextMenu.isLeaf
        },
        {
            key: 'find-usages',
            label: 'Find Usages',
            onClick: () => {
                const path = contextMenu.key;
                if (path.endsWith('.class')) {
                    const cleanPath = path.replace('.class', '');
                    usageQuery.next(cleanPath);
                }
            },
            disabled: !contextMenu.isLeaf || !contextMenu.key.endsWith('.class')
        },
    ] : [], [contextMenu]);

    return (
        <>
            <Tree.DirectoryTree
                showLine
                switcherIcon={<CaretDownFilled />}
                selectedKeys={selectedKeys}
                onSelect={onSelect}
                treeData={treeData}
                expandedKeys={[...expandedKeys || []]}
                onExpand={setExpandedKeys}
                onRightClick={onRightClick}
                titleRender={(nodeData) => (
                    <span style={{ userSelect: "none" }}>{nodeData.title?.toString()}</span>
                )}
            />
            {contextMenu && (
                <div key={contextMenu.key + contextMenu.x + contextMenu.y} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}>
                    <Dropdown
                        menu={{ items: menuItems }}
                        open={true}
                        trigger={['click']}
                    >
                        <span />
                    </Dropdown>
                </div>
            )}
        </>
    );
};

export default FileList;
