import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import {
    readValue,
    STORAGE_KEYS,
    TrashItem,
    useSharedValue,
    writeValue,
} from '../../lib/store';

export interface NotepadProps extends WindowAppProps {}

interface Note {
    id: string;
    title: string;
    body: string;
    updatedAt: number;
}

/** Notes live in the browser, so they survive closing the window. */
const newNote = (): Note => ({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Untitled note',
    body: '',
    updatedAt: Date.now(),
});

/**
 * A permanent note that always ships in Notepad. It has a fixed id so we can
 * ensure it stays present (re-adding it if the user deletes it).
 */
const SPIDERMAN_NOTE: Note = {
    id: 'spiderman-note',
    title: "I'm Spider-Man.",
    body: `Whatever life holds in store for me,

I will never forget these words: 'With great power comes great responsibility.'

This is my gift, my curse.

Who am I?

I'm Spider-Man.`,
    updatedAt: 0,
};

/** Stable fallback, used when nothing has been saved yet. */
const INITIAL_NOTES: Note[] = [SPIDERMAN_NOTE, newNote()];

const previewOf = (note: Note): string => {
    const flat = note.body.replace(/\s+/g, ' ').trim();
    return flat.length > 0 ? flat : '(empty)';
};

const Notepad: React.FC<NotepadProps> = (props) => {
    const [notes, setNotes] = useSharedValue<Note[]>(
        STORAGE_KEYS.notes,
        INITIAL_NOTES
    );
    // Default to the permanent Spider-Man note when Notepad opens.
    const [activeId, setActiveId] = useState<string>(
        () =>
            notes.find((note) => note.id === SPIDERMAN_NOTE.id)?.id ||
            notes[0].id
    );

    const active = useMemo(
        () => notes.find((note) => note.id === activeId) || notes[0],
        [notes, activeId]
    );

    // On open, make sure the Spider-Man note is the one being shown once it's
    // present in the list.
    useEffect(() => {
        if (notes.some((note) => note.id === SPIDERMAN_NOTE.id)) {
            setActiveId(SPIDERMAN_NOTE.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Seed storage on first run so the Trash app sees the same notes.
    useEffect(() => {
        if (readValue<Note[] | null>(STORAGE_KEYS.notes, null) === null) {
            writeValue(STORAGE_KEYS.notes, notes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the permanent Spider-Man note pinned: re-add it to the top whenever
    // it's missing (covers existing saved notes, or if it ever gets deleted).
    useEffect(() => {
        if (!notes.some((note) => note.id === SPIDERMAN_NOTE.id)) {
            setNotes((prev) => [
                { ...SPIDERMAN_NOTE, updatedAt: Date.now() },
                ...prev,
            ]);
        }
    }, [notes, setNotes]);

    const updateActive = useCallback(
        (patch: Partial<Pick<Note, 'title' | 'body'>>) => {
            setNotes((prev) =>
                prev.map((note) =>
                    note.id === activeId
                        ? { ...note, ...patch, updatedAt: Date.now() }
                        : note
                )
            );
        },
        [activeId, setNotes]
    );

    const addNote = useCallback(() => {
        const note = newNote();
        setNotes((prev) => [note, ...prev]);
        setActiveId(note.id);
    }, [setNotes]);

    /** Deleting a note moves it to the Trash app, so it can be restored. */
    const deleteNote = useCallback(
        (id: string) => {
            // The Spider-Man note is permanent — it can't be deleted.
            if (id === SPIDERMAN_NOTE.id) return;
            const note = notes.find((entry) => entry.id === id);
            if (note) {
                const trash = readValue<TrashItem[]>(
                    STORAGE_KEYS.trash,
                    []
                );
                writeValue(STORAGE_KEYS.trash, [
                    {
                        id: note.id,
                        title: note.title,
                        body: note.body,
                        deletedAt: Date.now(),
                    },
                    ...trash.filter((entry) => entry.id !== note.id),
                ]);
            }
            const remaining = notes.filter((entry) => entry.id !== id);
            const next = remaining.length > 0 ? remaining : [newNote()];
            setNotes(next);
            if (id === activeId) setActiveId(next[0].id);
        },
        [notes, activeId, setNotes]
    );

    const wordCount = active.body.trim()
        ? active.body.trim().split(/\s+/).length
        : 0;

    return (
        <Window
            top={48}
            left={96}
            width={820}
            height={560}
            windowTitle="Notepad"
            windowBarIcon="notepadIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${wordCount} word${
                wordCount === 1 ? '' : 's'
            }, ${active.body.length} character${
                active.body.length === 1 ? '' : 's'
            }`}
        >
<div style={styles.page}>
                <div style={styles.strip}>
                    <p style={styles.stripText}>
                        Saved automatically in this browser
                    </p>
                    <p style={styles.stripText}>
                        {notes.length} note{notes.length === 1 ? '' : 's'}
                    </p>
                </div>
                <div style={styles.body}>
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarTop}>
                            <button
                                className="site-button"
                                style={styles.sidebarButton}
                                onClick={addNote}
                            >
                                New note
                            </button>
                        </div>
                        <div style={styles.list}>
                            {notes.map((note) => {
                                const isActive = note.id === active.id;
                                return (
                                    <div
                                        key={note.id}
                                        style={Object.assign(
                                            {},
                                            styles.listItem,
                                            isActive && styles.listItemActive
                                        )}
                                        onMouseDown={() =>
                                            setActiveId(note.id)
                                        }
                                    >
                                        <p
                                            style={Object.assign(
                                                {},
                                                styles.listTitle,
                                                isActive && styles.activeText
                                            )}
                                        >
                                            {note.title || 'Untitled note'}
                                        </p>
                                        <p
                                            style={Object.assign(
                                                {},
                                                styles.listPreview,
                                                isActive && styles.activeSubText
                                            )}
                                        >
                                            {previewOf(note)}
                                        </p>
                                        <p
                                            style={Object.assign(
                                                {},
                                                styles.listMeta,
                                                isActive && styles.activeSubText
                                            )}
                                        >
                                            {new Date(
                                                note.updatedAt
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={styles.editor}>
                        <input
                            style={styles.titleInput}
                            type="text"
                            value={active.title}
                            placeholder="Note title"
                            onChange={(e) =>
                                updateActive({ title: e.target.value })
                            }
                        />
                        <textarea
                            style={styles.textArea}
                            value={active.body}
                            placeholder="Start typing..."
                            spellCheck={false}
                            onChange={(e) =>
                                updateActive({ body: e.target.value })
                            }
                        />
                        <div style={styles.buttonRow}>
                            <button
                                className="site-button"
                                onClick={() => deleteNote(active.id)}
                            >
                                Move to Trash
                            </button>
                            <p style={styles.updatedText}>
                                Last edited{' '}
                                {new Date(active.updatedAt).toLocaleString()}
                            </p>
                        </div>
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
    strip: {
        flexShrink: 0,
        padding: 6,
        paddingLeft: 8,
        paddingRight: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stripText: {
        fontSize: 12,
        fontFamily: 'MSSerif',
    },
    body: {
        flex: 1,
        overflow: 'hidden',
    },
    sidebar: {
        width: 200,
        flexShrink: 0,
        flexDirection: 'column',
        backgroundColor: Colors.white,
        borderRight: `1px solid ${Colors.darkGray}`,
    },
    sidebarTop: {
        flexShrink: 0,
        padding: 4,
        borderBottom: `1px solid ${Colors.lightGray}`,
    },
    sidebarButton: {
        width: '100%',
        fontSize: 14,
    },
    list: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    listItem: {
        flexDirection: 'column',
        padding: 6,
        cursor: 'pointer',
        borderBottom: `1px solid ${Colors.lightGray}`,
    },
    listItemActive: {
        backgroundColor: Colors.blue,
    },
    listTitle: {
        fontSize: 12,
        fontFamily: 'MSSerif',
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    listPreview: {
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    listMeta: {
        fontSize: 10,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    activeText: {
        color: Colors.white,
    },
    activeSubText: {
        color: Colors.lightGray,
    },
    editor: {
        flex: 1,
        flexDirection: 'column',
        padding: 6,
        boxSizing: 'border-box',
        overflow: 'hidden',
    },
    titleInput: {
        flexShrink: 0,
        width: '100%',
        fontSize: 16,
        fontFamily: 'Millennium, serif',
        padding: 4,
        outline: 'none',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    textArea: {
        flex: 1,
        width: '100%',
        marginTop: 6,
        padding: 6,
        fontSize: 15,
        lineHeight: 1.45,
        fontFamily: 'Terminal, monospace',
        outline: 'none',
        resize: 'none',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    buttonRow: {
        flexShrink: 0,
        paddingTop: 6,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    updatedText: {
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
};

export default Notepad;
