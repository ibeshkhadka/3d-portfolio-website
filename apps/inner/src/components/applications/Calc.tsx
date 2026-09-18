import React, { useMemo, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { STORAGE_KEYS, useSharedValue } from '../../lib/store';

export interface CalcProps extends WindowAppProps {}

type CellValues = { [ref: string]: string };

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = 22;
const COL_WIDTH = 88;
const ROW_HEIGHT = 24;

const refOf = (col: number, row: number): string => `${COLS[col]}${row + 1}`;

const ALL_REFS: string[] = (() => {
    const refs: string[] = [];
    for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS.length; col += 1) {
            refs.push(refOf(col, row));
        }
    }
    return refs;
})();

/** Turn a range like A1:B3 into the list of cell references it covers. */
function expandRange(range: string): string[] {
    const match = range
        .toUpperCase()
        .match(/^([A-H])([0-9]{1,2}):([A-H])([0-9]{1,2})$/);
    if (!match) return [];
    const c1 = COLS.indexOf(match[1]);
    const c2 = COLS.indexOf(match[3]);
    const r1 = Number(match[2]) - 1;
    const r2 = Number(match[4]) - 1;
    const refs: string[] = [];
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c += 1) {
        for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
            refs.push(refOf(c, r));
        }
    }
    return refs;
}

/** Split + - * / ( ) and cell references into tokens. */
const tokenize = (src: string): string[] =>
    src.match(/[A-H][0-9]{1,2}|[0-9]*\.?[0-9]+|[+\-*/()]/gi) || [];

/** Small recursive-descent parser — no eval() anywhere. */
function parseExpression(src: string, get: (ref: string) => number): number {
    const tokens = tokenize(src);
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseTerms(): number {
        let value = parseFactors();
        while (peek() === '+' || peek() === '-') {
            const op = next();
            const rhs = parseFactors();
            value = op === '+' ? value + rhs : value - rhs;
        }
        return value;
    }

    function parseFactors(): number {
        let value = parseUnary();
        while (peek() === '*' || peek() === '/') {
            const op = next();
            const rhs = parseUnary();
            if (op === '*') value *= rhs;
            else value = rhs === 0 ? NaN : value / rhs;
        }
        return value;
    }

    function parseUnary(): number {
        if (peek() === '-') {
            next();
            return -parseUnary();
        }
        if (peek() === '+') {
            next();
            return parseUnary();
        }
        const token = next();
        if (token === '(') {
            const inner = parseTerms();
            if (peek() === ')') next();
            return inner;
        }
        if (token === undefined) return NaN;
        const asNumber = Number(token);
        if (!isNaN(asNumber)) return asNumber;
        return get(token.toUpperCase());
    }

    const result = parseTerms();
    return isFinite(result) ? result : NaN;
}

const formatNumber = (value: number): string =>
    String(Math.round(value * 1e6) / 1e6);

/** Evaluate one cell. Non-formula input is returned as typed. */
function evalCell(raw: string, get: (ref: string) => number): string {
    if (!raw.startsWith('=')) return raw;

    const body = raw.slice(1).trim();
    const call = body.match(/^([A-Z]+)\(([^)]*)\)$/i);

    if (call) {
        const name = call[1].toUpperCase();
        const args = call[2]
            .split(',')
            .map((arg) => arg.trim())
            .filter((arg) => arg.length > 0);

        const numbers: number[] = [];
        args.forEach((arg) => {
            if (arg.includes(':')) {
                expandRange(arg).forEach((ref) => numbers.push(get(ref)));
                return;
            }
            const asNumber = Number(arg);
            if (!isNaN(asNumber) && arg !== '') numbers.push(asNumber);
            else numbers.push(get(arg.toUpperCase()));
        });

        const usable = numbers.filter((n) => !isNaN(n));
        const total = usable.reduce((a, b) => a + b, 0);

        switch (name) {
            case 'SUM':
                return formatNumber(total);
            case 'AVG':
            case 'AVERAGE':
                return usable.length ? formatNumber(total / usable.length) : '#DIV/0';
            case 'MIN':
                return usable.length ? formatNumber(Math.min(...usable)) : '0';
            case 'MAX':
                return usable.length ? formatNumber(Math.max(...usable)) : '0';
            case 'COUNT':
                return String(usable.length);
            default:
                return '#NAME?';
        }
    }

    const value = parseExpression(body, get);
    return isNaN(value) ? '#ERROR' : formatNumber(value);
}

const Calc: React.FC<CalcProps> = (props) => {
const [cells, setCells] = useSharedValue<CellValues>(STORAGE_KEYS.sheet, {});
    const [selected, setSelected] = useState<string>('A1');
    const [editing, setEditing] = useState(false);

    /** Compute every cell, memoising lookups so chains resolve once. */
    const display = useMemo(() => {
        const numeric: { [ref: string]: number } = {};
        const busy: { [ref: string]: boolean } = {};

        const getNumber = (ref: string): number => {
            if (ref in numeric) return numeric[ref];
            if (busy[ref]) return NaN; // circular reference
            const raw = cells[ref];
            if (raw === undefined || raw === '') return 0;
            if (!raw.startsWith('=')) {
                const plain = Number(raw);
                const result = isNaN(plain) ? NaN : plain;
                numeric[ref] = result;
                return result;
            }
            busy[ref] = true;
            const computed = Number(evalCell(raw, getNumber));
            busy[ref] = false;
            const result = isNaN(computed) ? NaN : computed;
            numeric[ref] = result;
            return result;
        };

        const out: { [ref: string]: string } = {};
        ALL_REFS.forEach((ref) => {
            const raw = cells[ref];
            if (raw === undefined || raw === '') return;
            out[ref] = evalCell(raw, getNumber);
        });
        return out;
    }, [cells]);

    const selectedRaw = cells[selected] || '';
    const selectedShown = display[selected] || '';
    const filledCount = Object.keys(cells).length;

    const commit = (ref: string, value: string) => {
        setCells((prev) => {
            const next = { ...prev };
            if (value === '') delete next[ref];
            else next[ref] = value;
            return next;
        });
    };

    const moveSelection = (deltaCol: number, deltaRow: number) => {
        const col = COLS.indexOf(selected.replace(/[0-9]/g, ''));
        const row = Number(selected.replace(/[A-H]/g, '')) - 1;
        const nextCol = Math.min(Math.max(col + deltaCol, 0), COLS.length - 1);
        const nextRow = Math.min(Math.max(row + deltaRow, 0), ROWS - 1);
        setSelected(refOf(nextCol, nextRow));
        setEditing(false);
    };

    const onCellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            moveSelection(0, 1);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            moveSelection(event.shiftKey ? -1 : 1, 0);
        } else if (event.key === 'Escape') {
            setEditing(false);
        }
    };

    return (
        <Window
            top={32}
            left={64}
            width={920}
            height={620}
            windowTitle="Calc"
            windowBarIcon="calcIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${filledCount} cell${
                filledCount === 1 ? '' : 's'
            } in use`}
        >
            <div style={styles.page}>
                <div style={styles.formulaBar}>
                    <div style={styles.refBox}>
                        <p style={styles.refText}>{selected}</p>
                    </div>
                    <input
                        style={styles.formulaInput}
                        value={selectedRaw}
                        placeholder="Type a value or a formula, e.g. =SUM(A1:A5)"
                        spellCheck={false}
                        onChange={(event) =>
                            commit(selected, event.target.value)
                        }
                    />
                    <button
                        className="site-button"
                        style={styles.clearButton}
                        onClick={() => setCells({})}
                    >
                        Clear
                    </button>
                </div>
                <div style={styles.hintBar}>
                    <p style={styles.hintText}>
                        =A1+B2*2 &middot; =SUM(A1:A5) &middot; =AVG &middot;
                        =MIN &middot; =MAX &middot; =COUNT
                    </p>
                    <p style={styles.hintResult}>
                        {selectedShown ? `= ${selectedShown}` : ''}
                    </p>
                </div>
                <div style={styles.gridWrap}>
                    <div style={styles.headerRow}>
                        <div
                            style={Object.assign(
                                {},
                                styles.cellBase,
                                styles.corner
                            )}
                        />
                        {COLS.map((col) => (
                            <div
                                key={col}
                                style={Object.assign(
                                    {},
                                    styles.cellBase,
                                    styles.colHead
                                )}
                            >
                                <p style={styles.headText}>{col}</p>
                            </div>
                        ))}
                    </div>
{Array.from(Array(ROWS)).map((_, row) => (
                        <div key={row} style={styles.bodyRow}>
                            <div
                                style={Object.assign(
                                    {},
                                    styles.cellBase,
                                    styles.rowHead
                                )}
                            >
                                <p style={styles.headText}>{row + 1}</p>
                            </div>
                            {COLS.map((col, colIndex) => {
                                const ref = refOf(colIndex, row);
                                const isSelected = ref === selected;
                                const shown = display[ref] || '';
                                const numeric =
                                    shown !== '' && !isNaN(Number(shown));
                                return (
                                    <div
                                        key={ref}
                                        style={Object.assign(
                                            {},
                                            styles.cellBase,
                                            styles.cell,
                                            isSelected && styles.cellSelected
                                        )}
                                        onMouseDown={() => {
                                            setSelected(ref);
                                            setEditing(true);
                                        }}
                                    >
                                        {isSelected && editing ? (
                                            <input
                                                autoFocus
                                                style={styles.cellInput}
                                                value={cells[ref] || ''}
                                                spellCheck={false}
                                                onChange={(event) =>
                                                    commit(
                                                        ref,
                                                        event.target.value
                                                    )
                                                }
                                                onKeyDown={onCellKeyDown}
                                                onBlur={() =>
                                                    setEditing(false)
                                                }
                                            />
                                        ) : (
                                            <p
                                                style={Object.assign(
                                                    {},
                                                    styles.cellText,
                                                    numeric &&
                                                        styles.cellNumber,
                                                    isSelected &&
                                                        styles.cellTextOn
                                                )}
                                            >
                                                {shown}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
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
    formulaBar: {
        flexShrink: 0,
        padding: 4,
        alignItems: 'center',
    },
    refBox: {
        width: 52,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        flexShrink: 0,
    },
    refText: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'MSSerif',
    },
    formulaInput: {
        flex: 1,
        height: 22,
        marginLeft: 4,
        marginRight: 4,
        paddingLeft: 4,
        paddingRight: 4,
        fontSize: 13,
        fontFamily: 'Terminal, monospace',
        outline: 'none',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    clearButton: {
        flexShrink: 0,
        fontSize: 13,
    },
    hintBar: {
        flexShrink: 0,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 4,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hintText: {
        margin: 0,
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    hintResult: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'Terminal, monospace',
    },
    gridWrap: {
        flex: 1,
        overflow: 'auto',
        backgroundColor: Colors.white,
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    headerRow: {
        flexShrink: 0,
    },
    bodyRow: {
        flexShrink: 0,
    },
    cellBase: {
        boxSizing: 'border-box',
        borderRight: `1px solid ${Colors.lightGray}`,
        borderBottom: `1px solid ${Colors.lightGray}`,
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    },
    corner: {
        width: 34,
        height: ROW_HEIGHT,
        backgroundColor: Colors.lightGray,
    },
    colHead: {
        width: COL_WIDTH,
        height: ROW_HEIGHT,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
    },
    rowHead: {
        width: 34,
        height: ROW_HEIGHT,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
    },
    headText: {
        margin: 0,
        fontSize: 11,
        fontFamily: 'MSSerif',
    },
    cell: {
        width: COL_WIDTH,
        height: ROW_HEIGHT,
        paddingLeft: 3,
        backgroundColor: Colors.white,
    },
    cellSelected: {
        backgroundColor: Colors.lightGray,
    },
    cellText: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'MSSerif',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    cellNumber: {
        textAlign: 'right',
        paddingRight: 4,
        fontFamily: 'Terminal, monospace',
    },
    cellTextOn: {
        fontWeight: 'bold',
    },
    cellInput: {
        width: COL_WIDTH - 6,
        height: ROW_HEIGHT - 4,
        padding: 0,
        margin: 0,
        fontSize: 12,
        fontFamily: 'Terminal, monospace',
        outline: 'none',
        border: 'none',
        backgroundColor: Colors.white,
    },
};

export default Calc;