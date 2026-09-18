import React, { useMemo, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import Icon from '../general/Icon';
import { IconName } from '../../assets/icons';
import { FsNode, listPath } from '../../lib/vfs';

export interface FilesProps extends WindowAppProps {}

const ICON_FOR: { [kind: string]: IconName } = {
    folder: 'filesIcon',
    image: 'galleryIcon',
    text: 'notepadIcon',
    pdf: 'windowExplorerIcon',
};

const Files: React.FC<FilesProps> = (props) => {
    const [path, setPath] = useState<string[]>([]);
    const [selected, setSelected] = useState<FsNode | null>(null);

    const items = useMemo(() => listPath(path), [path]);

    const preview =
        selected && (selected.kind === 'image' || selected.kind === 'text')
            ? selected
            : null;

    const open = (node: FsNode) => {
        if (node.kind === 'folder') {
            setPath((prev) => [...prev, node.name]);
            setSelected(null);
            return;
        }
        if (node.kind === 'pdf' && node.src) {
            window.open(node.src, '_blank');
            return;
        }
        setSelected(node);
    };

    const goUp = () => {
        setPath((prev) => prev.slice(0, -1));
        setSelected(null);
    };

    const goTo = (depth: number) => {
        setPath((prev) => prev.slice(0, depth));
        setSelected(null);
    };

    return (
        <Window
            top={36}
            left={56}
            width={880}
            height={580}
            windowTitle="Files"
            windowBarIcon="filesIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${items.length} item${
                items.length === 1 ? '' : 's'
            }`}
        >
            <div style={styles.page}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolButton}
                        onClick={goUp}
                    >
                        Up
                    </button>
                    <button
                        className="site-button"
                        style={styles.toolButton}
                        onClick={() => goTo(0)}
                    >
                        Home
                    </button>
                    <div style={styles.crumbs}>
                        <p
                            style={styles.crumb}
                            onMouseDown={() => goTo(0)}
                        >
                            Home
                        </p>
                        {path.map((part, index) => (
                            <p
                                key={part}
                                style={styles.crumb}
                                onMouseDown={() => goTo(index + 1)}
                            >
                                {' / '}
                                {part}
                            </p>
                        ))}
                    </div>
                </div>
<div style={styles.body}>
                    <div style={styles.list}>
                        {items.length === 0 && (
                            <p style={styles.empty}>This folder is empty.</p>
                        )}
                        {items.map((node) => {
                            const isSelected = selected?.name === node.name;
                            return (
                                <div
                                    key={node.name}
                                    style={Object.assign(
                                        {},
                                        styles.row,
                                        isSelected && styles.rowSelected
                                    )}
                                    onMouseDown={() => setSelected(node)}
                                    onDoubleClick={() => open(node)}
                                >
                                    <Icon
                                        icon={ICON_FOR[node.kind]}
                                        style={styles.rowIcon}
                                        size={18}
                                    />
                                    <p
                                        style={Object.assign(
                                            {},
                                            styles.rowName,
                                            isSelected && styles.rowTextOn
                                        )}
                                    >
                                        {node.name}
                                    </p>
                                    <p
                                        style={Object.assign(
                                            {},
                                            styles.rowType,
                                            isSelected && styles.rowTextOn
                                        )}
                                    >
                                        {node.kind}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div style={styles.preview}>
                        {preview ? (
                            <>
                                <p style={styles.previewTitle}>
                                    {preview.name}
                                </p>
                                {preview.kind === 'image' && preview.src && (
                                    <div style={styles.previewImageWrap}>
                                        <img
                                            src={preview.src}
                                            alt={preview.name}
                                            style={styles.previewImage}
                                        />
                                    </div>
                                )}
                                {preview.kind === 'text' && (
                                    <pre style={styles.previewText}>
                                        {preview.text}
                                    </pre>
                                )}
                            </>
                        ) : (
                            <p style={styles.previewHint}>
                                Click a file to preview it, or double-click a
                                folder to open it. PDFs open in a new tab.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    page: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        backgroundColor: Colors.lightGray,
    },
    toolbar: {
        flexShrink: 0,
        padding: 4,
        alignItems: 'center',
    },
    toolButton: {
        fontSize: 13,
        marginRight: 4,
    },
    crumbs: {
        flex: 1,
        alignItems: 'center',
        marginLeft: 4,
        overflow: 'hidden',
    },
    crumb: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'MSSerif',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    body: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: Colors.white,
    },
    list: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: Colors.white,
    },
    empty: {
        margin: 8,
        fontSize: 13,
        fontFamily: 'MSSerif',
    },
    row: {
        alignItems: 'center',
        padding: 3,
        paddingLeft: 6,
        cursor: 'pointer',
        borderBottom: `1px solid ${Colors.lightGray}`,
    },
    rowSelected: {
        backgroundColor: Colors.blue,
    },
    rowIcon: {
        marginRight: 6,
    },
    rowName: {
        margin: 0,
        flex: 1,
        fontSize: 13,
        fontFamily: 'MSSerif',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    rowType: {
        margin: 0,
        marginLeft: 8,
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    rowTextOn: {
        color: Colors.white,
    },
    preview: {
        width: 300,
        flexShrink: 0,
        flexDirection: 'column',
        padding: 8,
        boxSizing: 'border-box',
        borderLeft: `1px solid ${Colors.darkGray}`,
        overflow: 'hidden',
    },
    previewTitle: {
        margin: 0,
        marginBottom: 6,
        fontSize: 12,
        fontFamily: 'MSSerif',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    previewImageWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.darkGray}`,
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: '100%',
    },
    previewText: {
        flex: 1,
        margin: 0,
        padding: 6,
        fontSize: 10,
        lineHeight: 1.35,
        fontFamily: 'Terminal, monospace',
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        border: `1px solid ${Colors.darkGray}`,
    },
    previewHint: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
};

export default Files;
