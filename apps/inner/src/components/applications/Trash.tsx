import React from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import {
    readValue,
    STORAGE_KEYS,
    TrashItem,
    useSharedValue,
    writeValue,
} from '../../lib/store';

export interface TrashProps extends WindowAppProps {}

interface Note {
    id: string;
    title: string;
    body: string;
    updatedAt: number;
}

const Trash: React.FC<TrashProps> = (props) => {
    const [items, setItems] = useSharedValue<TrashItem[]>(
        STORAGE_KEYS.trash,
        []
    );

    /** Put a note back into Notepad and drop it from the bin. */
    const restore = (item: TrashItem) => {
        const notes = readValue<Note[]>(STORAGE_KEYS.notes, []);
        const restored: Note = {
            id: item.id,
            title: item.title,
            body: item.body,
            updatedAt: Date.now(),
        };
        writeValue(STORAGE_KEYS.notes, [
            restored,
            ...notes.filter((note) => note.id !== item.id),
        ]);
        setItems(items.filter((entry) => entry.id !== item.id));
    };

    const removeForever = (id: string) =>
        setItems(items.filter((entry) => entry.id !== id));

    return (
        <Window
            top={44}
            left={88}
            width={720}
            height={480}
            windowTitle="Trash"
            windowBarIcon="trashIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${items.length} item${
                items.length === 1 ? '' : 's'
            } in the bin`}
        >
            <div style={styles.page}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolButton}
                        onMouseDown={() => setItems([])}
                    >
                        Empty trash
                    </button>
                    <p style={styles.toolHint}>
                        Deleting a note in Notepad moves it here
                    </p>
                </div>
                {items.length === 0 ? (
                    <div style={styles.empty}>
                        <h3>Trash is empty</h3>
                        <br />
                        <p>
                            Notes you delete in Notepad land here, so you can
                            get them back if you change your mind.
                        </p>
                    </div>
                ) : (
                    <div style={styles.list}>
                        {items.map((item) => (
                            <div key={item.id} style={styles.row}>
                                <div style={styles.rowMain}>
                                    <p style={styles.rowTitle}>
                                        {item.title || 'Untitled note'}
                                    </p>
                                    <p style={styles.rowPreview}>
                                        {item.body.replace(/\s+/g, ' ').trim() ||
                                            '(empty)'}
                                    </p>
                                    <p style={styles.rowMeta}>
                                        deleted{' '}
                                        {new Date(
                                            item.deletedAt
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    className="site-button"
                                    style={styles.rowButton}
                                    onMouseDown={() => restore(item)}
                                >
                                    Restore
                                </button>
                                <button
                                    className="site-button"
                                    style={styles.rowButton}
                                    onMouseDown={() => removeForever(item.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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
        padding: 6,
        alignItems: 'center',
    },
    toolButton: {
        fontSize: 13,
    },
    toolHint: {
        margin: 0,
        marginLeft: 12,
        fontSize: 12,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    empty: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 32,
        backgroundColor: Colors.white,
    },
    list: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: Colors.white,
    },
    row: {
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.lightGray}`,
    },
    rowMain: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    rowTitle: {
        margin: 0,
        fontSize: 13,
        fontFamily: 'MSSerif',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    rowPreview: {
        margin: 0,
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    rowMeta: {
        margin: 0,
        fontSize: 10,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    rowButton: {
        flexShrink: 0,
        marginLeft: 6,
        fontSize: 12,
    },
};

export default Trash;