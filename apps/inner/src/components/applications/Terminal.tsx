import React, { useEffect, useRef, useState } from 'react';
import Window from '../os/Window';
import { listPath, pathToString } from '../../lib/vfs';
import { requestAppOpen } from '../../lib/store';

export interface TerminalProps extends WindowAppProps {}

interface Line {
    kind: 'in' | 'out' | 'err';
    text: string;
}

const PROMPT = 'ibesh@portfolio';

const APP_KEYS = [
    'showcase',
    'gallery',
    'notepad',
    'calc',
    'files',
    'terminal',
    'settings',
    'trash',
    'about',
    'credits',
];

const HELP_LINES = [
    'Available commands:',
    '',
    '  help            show this list',
    '  ls              list the files in this folder',
    '  cd <folder>     move into a folder   (cd .. to go up, cd ~ for home)',
    '  pwd             print the current folder',
    '  cat <file>      print a text file',
    '  open <app>      launch an app, e.g. open gallery',
    '  whoami          who you are talking to',
    '  date            current date and time',
    '  echo <text>     repeat something back',
    '  neofetch        system information',
    '  clear           clear the screen',
    '',
    `Apps: ${APP_KEYS.join(', ')}`,
];

const NEOFETCH = [
    '        ,---.        ibesh@portfolio',
    '       /  _  \\       ----------------',
    '      |  ( )  |      OS:     IbeshOS 1.0',
    '       \\  -  /       Shell:  portfoliologin',
    '        `---`        Apps:   13 (see "open")',
    '                     Browser: yes, you are in one',
    '                     Weather: the coffee is still warm',
].join('\n');

const Terminal: React.FC<TerminalProps> = (props) => {
    const [lines, setLines] = useState<Line[]>([
        {
            kind: 'out',
            text: 'Ibesh OS shell. Type "help" for a list of commands.',
        },
        { kind: 'out', text: '' },
    ]);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const box = scrollRef.current;
        if (box) box.scrollTop = box.scrollHeight;
    }, [lines]);

    const print = (next: Line[]) => setLines((prev) => [...prev, ...next]);
    const out = (text: string) => print([{ kind: 'out', text }]);
    const err = (text: string) => print([{ kind: 'err', text }]);

    const recall = (delta: number) => {
        if (history.length === 0) return;
        const base = historyIndex < 0 ? history.length : historyIndex;
        const next = Math.min(Math.max(base + delta, 0), history.length);
        if (next >= history.length) {
            setHistoryIndex(-1);
            setInput('');
            return;
        }
        setHistoryIndex(next);
        setInput(history[next] || '');
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            runCommand(input);
            setInput('');
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            recall(-1);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            recall(1);
        }
    };

    const runCommand = (raw: string) => {
        const trimmed = raw.trim();
        print([{ kind: 'in', text: `${PROMPT}:${pathToString(cwd)}$ ${raw}` }]);
        if (trimmed === '') {
            inputRef.current?.focus();
            return;
        }
        setHistory((prev) => [...prev, trimmed]);
        setHistoryIndex(-1);

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');
switch (cmd) {
            case 'help':
                print(
                    HELP_LINES.map((text) => ({
                        kind: 'out' as const,
                        text,
                    }))
                );
                return;

            case 'ls': {
                const items = listPath(cwd);
                if (items.length === 0) {
                    out('(empty folder)');
                    return;
                }
                print(
                    items.map((node) => ({
                        kind: 'out' as const,
                        text: `${node.kind === 'folder' ? 'd' : '-'}  ${
                            node.name
                        }${node.kind === 'folder' ? '/' : ''}`,
                    }))
                );
                return;
            }

            case 'cd': {
                const target = arg.trim();
                if (target === '' || target === '~' || target === '/') {
                    setCwd([]);
                    return;
                }
                if (target === '..') {
                    setCwd((prev) => prev.slice(0, -1));
                    return;
                }
                const clean = target.replace(/\/+$/, '');
                const folder = listPath(cwd).find(
                    (node) =>
                        node.kind === 'folder' &&
                        node.name.toLowerCase() === clean.toLowerCase()
                );
                if (!folder) {
                    err(`cd: no such folder: ${target}`);
                    return;
                }
                setCwd((prev) => [...prev, folder.name]);
                return;
            }

            case 'pwd':
                out(pathToString(cwd));
                return;

            case 'cat': {
                const wanted = arg.trim().toLowerCase();
                const file = listPath(cwd).find(
                    (node) => node.name.toLowerCase() === wanted
                );
                if (!file) {
                    err(`cat: no such file: ${arg}`);
                    return;
                }
                if (file.text) {
                    print(
                        file.text
                            .split('\n')
                            .map((text) => ({ kind: 'out' as const, text }))
                    );
                    return;
                }
                if (file.kind === 'pdf') {
                    out(
                        `cat: ${file.name} is a PDF — open it from Files instead.`
                    );
                    return;
                }
                out(`cat: ${file.name} is an image — preview it in Files.`);
                return;
            }

            case 'open': {
                const key = arg.trim().toLowerCase();
                if (!key) {
                    err('usage: open <app>');
                    return;
                }
                if (!APP_KEYS.includes(key)) {
                    err(`open: unknown app "${key}"`);
                    out(`try one of: ${APP_KEYS.join(', ')}`);
                    return;
                }
                requestAppOpen(key);
                out(`launching ${key}...`);
                return;
            }

            case 'clear':
                setLines([]);
                return;

            case 'whoami':
                out('ibesh');
                return;

            case 'date':
                out(new Date().toString());
                return;

            case 'echo':
                out(arg);
                return;

            case 'neofetch':
                print(
                    NEOFETCH.split('\n').map((text) => ({
                        kind: 'out' as const,
                        text,
                    }))
                );
                return;

            case 'sudo':
                err(
                    'ibesh is not in the sudoers file. This incident has been logged. (It has not.)'
                );
                return;

            case 'exit':
                out('Use the X button in the title bar to close this window.');
                return;

            default:
                err(`command not found: ${cmd} — type "help"`);
                return;
        }
    };

    return (
        <Window
            top={24}
            left={48}
            width={860}
            height={520}
            windowTitle="Terminal"
            windowBarIcon="terminalIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${PROMPT}:${pathToString(cwd)}`}
        >
            <div style={styles.page}>
                <div style={styles.output} ref={scrollRef}>
                    {lines.map((line, index) => (
                        <pre
                            key={`line-${index}`}
                            style={Object.assign(
                                {},
                                styles.line,
                                line.kind === 'in' && styles.lineIn,
                                line.kind === 'err' && styles.lineErr
                            )}
                        >
                            {line.text === '' ? ' ' : line.text}
                        </pre>
                    ))}
                </div>
                <div style={styles.promptRow}>
                    <p style={styles.promptText}>
                        {`${PROMPT}:${pathToString(cwd)}$`}
                    </p>
                    <input
                        ref={inputRef}
                        autoFocus
                        style={styles.input}
                        value={input}
                        spellCheck={false}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={onKeyDown}
                    />
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
        backgroundColor: '#000000',
    },
    output: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 6,
    },
    line: {
        margin: 0,
        fontSize: 13,
        lineHeight: 1.35,
        fontFamily: 'Terminal, monospace',
        color: '#c8c8c8',
        whiteSpace: 'pre-wrap',
    },
    lineIn: {
        color: '#7ee28e',
    },
    lineErr: {
        color: '#ff8a8a',
    },
    promptRow: {
        flexShrink: 0,
        alignItems: 'center',
        padding: 6,
        borderTop: '1px solid #333333',
    },
    promptText: {
        margin: 0,
        marginRight: 6,
        fontSize: 13,
        fontFamily: 'Terminal, monospace',
        color: '#7ee28e',
        whiteSpace: 'nowrap',
    },
    input: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#ffffff',
        fontSize: 13,
        fontFamily: 'Terminal, monospace',
        padding: 0,
    },
};

export default Terminal;
