import React, { useEffect, useRef, useState, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

const INDENT = '  ';
const MAX_HISTORY = 200;
const HISTORY_DEBOUNCE_MS = 400;

// Minimal dark/light theme styles
const prismStyles = `
/* PrismJS theme overrides */
code[class*="language-"],
pre[class*="language-"] {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  tab-size: 2;
  hyphens: none;
}

/* Dark mode tokens */
.dark .token.comment,
.dark .token.prolog,
.dark .token.doctype,
.dark .token.cdata { color: #6a9955; }
.dark .token.punctuation { color: #d4d4d4; }
.dark .token.property,
.dark .token.tag,
.dark .token.boolean,
.dark .token.number,
.dark .token.constant,
.dark .token.symbol,
.dark .token.deleted { color: #569cd6; }
.dark .token.selector,
.dark .token.attr-name,
.dark .token.string,
.dark .token.char,
.dark .token.builtin,
.dark .token.inserted { color: #ce9178; }
.dark .token.operator,
.dark .token.entity,
.dark .token.url,
.dark .language-css .token.string,
.dark .style .token.string { color: #d4d4d4; }
.dark .token.atrule,
.dark .token.attr-value,
.dark .token.keyword { color: #c586c0; }
.dark .token.function,
.dark .token.class-name { color: #dcdcaa; }
.dark .token.regex,
.dark .token.important,
.dark .token.variable { color: #9cdcfe; }

/* Light mode tokens */
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata { color: #008000; }
.token.punctuation { color: #393a34; }
.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted { color: #36acaa; }
.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted { color: #a31515; }
.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string { color: #393a34; }
.token.atrule,
.token.attr-value,
.token.keyword { color: #0000ff; }
.token.function,
.token.class-name { color: #795e26; }
.token.regex,
.token.important,
.token.variable { color: #001080; }
`;

interface HistoryEntry {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'javascript' | 'json';
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  className = '',
  placeholder,
  readOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlighted, setHighlighted] = useState<string>('');

  // History for undo/redo
  const historyRef = useRef<HistoryEntry[]>([
    { value, selectionStart: 0, selectionEnd: 0 },
  ]);
  const historyIndexRef = useRef<number>(0);
  const lastPushRef = useRef<number>(Date.now());
  const isApplyingHistoryRef = useRef<boolean>(false);

  // Sync external value changes into history (e.g. template inserts)
  useEffect(() => {
    if (isApplyingHistoryRef.current) return;
    const top = historyRef.current[historyIndexRef.current];
    if (top && top.value === value) return;
    // External change — push as new history entry
    pushHistory(value, 0, 0);
  }, [value]);

  const pushHistory = useCallback(
    (newValue: string, selStart: number, selEnd: number, force = false) => {
      const now = Date.now();
      const top = historyRef.current[historyIndexRef.current];

      // Debounce: if last push was recent and values are similar, replace the top entry
      if (
        !force &&
        top &&
        now - lastPushRef.current < HISTORY_DEBOUNCE_MS &&
        historyIndexRef.current > 0
      ) {
        top.value = newValue;
        top.selectionStart = selStart;
        top.selectionEnd = selEnd;
      } else {
        // Truncate any redo entries before pushing
        historyRef.current = historyRef.current.slice(
          0,
          historyIndexRef.current + 1
        );
        historyRef.current.push({
          value: newValue,
          selectionStart: selStart,
          selectionEnd: selEnd,
        });
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift();
        } else {
          historyIndexRef.current++;
        }
      }
      lastPushRef.current = now;
    },
    []
  );

  const applyHistory = useCallback(
    (delta: number) => {
      const nextIndex = historyIndexRef.current + delta;
      if (nextIndex < 0 || nextIndex >= historyRef.current.length) return;
      historyIndexRef.current = nextIndex;
      const entry = historyRef.current[nextIndex];
      isApplyingHistoryRef.current = true;
      onChange(entry.value);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.selectionStart = entry.selectionStart;
          ta.selectionEnd = entry.selectionEnd;
          ta.focus();
        }
        isApplyingHistoryRef.current = false;
      });
    },
    [onChange]
  );

  useEffect(() => {
    const grammar = Prism.languages[language] || Prism.languages.javascript;
    const html = Prism.highlight(value, grammar, language);
    setHighlighted(html + '\n');
  }, [value, language]);

  const handleScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const insertText = (
    ta: HTMLTextAreaElement,
    before: string,
    after: string,
    newStart: number,
    newEnd: number
  ) => {
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue =
      value.substring(0, start) + before + value.substring(start, end) + after + value.substring(end);
    onChange(newValue);
    pushHistory(newValue, newStart, newEnd);
    requestAnimationFrame(() => {
      ta.selectionStart = newStart;
      ta.selectionEnd = newEnd;
      ta.focus();
    });
  };

  const replaceText = (
    ta: HTMLTextAreaElement,
    newValue: string,
    newStart: number,
    newEnd: number
  ) => {
    onChange(newValue);
    pushHistory(newValue, newStart, newEnd);
    requestAnimationFrame(() => {
      ta.selectionStart = newStart;
      ta.selectionEnd = newEnd;
      ta.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    // --- Undo: Ctrl/Cmd + Z ---
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      applyHistory(-1);
      return;
    }

    // --- Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y ---
    if (
      ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
      ((e.ctrlKey || e.metaKey) && e.key === 'y' && !e.shiftKey)
    ) {
      e.preventDefault();
      applyHistory(+1);
      return;
    }

    // --- Tab / Shift+Tab ---
    if (e.key === 'Tab') {
      e.preventDefault();

      const before = value.substring(0, start);
      const after = value.substring(end);
      const sel = value.substring(start, end);

      if (start === end) {
        // No selection: insert or remove indent at cursor line
        const lineStart = before.lastIndexOf('\n') + 1;
        const linePrefix = before.substring(lineStart);

        if (e.shiftKey) {
          // Outdent current line
          if (linePrefix.startsWith(INDENT)) {
            const newBefore = before.substring(0, lineStart) + linePrefix.substring(INDENT.length);
            const newValue = newBefore + after;
            replaceText(ta, newValue, start - INDENT.length, end - INDENT.length);
          }
        } else {
          // Indent at cursor
          insertText(ta, INDENT, '', start + INDENT.length, end + INDENT.length);
        }
        return;
      }

      // Multi-line selection
      const selStartLine = before.lastIndexOf('\n') + 1;
      const fullStart = Math.min(selStartLine, start);
      const selectedBlock = value.substring(fullStart, end);
      const lines = selectedBlock.split('\n');

      if (e.shiftKey) {
        // Outdent all selected lines
        const outdented = lines
          .map((line) =>
            line.startsWith(INDENT) ? line.substring(INDENT.length) : line
          )
          .join('\n');
        const removedCount = lines.reduce(
          (acc, line) => acc + (line.startsWith(INDENT) ? INDENT.length : 0),
          0
        );
        const newValue = value.substring(0, fullStart) + outdented + after;
        replaceText(ta, newValue, start - Math.min(removedCount, start - fullStart), end - removedCount);
      } else {
        // Indent all selected lines
        const indented = lines.map((line) => INDENT + line).join('\n');
        const addedCount = lines.length * INDENT.length;
        const newValue = value.substring(0, fullStart) + indented + after;
        replaceText(ta, newValue, start + INDENT.length, end + addedCount);
      }
      return;
    }

    // --- Enter: auto-indent (carry over current line's leading whitespace) ---
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const leadingWs = currentLine.match(/^\s*/)?.[0] || '';
      // If line ends with { [ ( , add extra indent
      const extraIndent = /[\{\[\(,(]\s*$/.test(currentLine) ? INDENT : '';
      const insert = '\n' + leadingWs + extraIndent;
      const newValue = value.substring(0, start) + insert + value.substring(end);
      const newCursor = start + insert.length;
      replaceText(ta, newValue, newCursor, newCursor);
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const ta = e.target;
    onChange(newValue);
    pushHistory(newValue, ta.selectionStart, ta.selectionEnd);
  };

  return (
    <>
      <style>{prismStyles}</style>
      <div className={`relative font-mono text-xs leading-[1.5] ${className}`}>
        <pre
          ref={preRef}
          className="absolute inset-0 m-0 p-3 overflow-auto pointer-events-none whitespace-pre-wrap break-words"
          aria-hidden="true"
        >
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
        <textarea
          ref={textareaRef}
          className="relative w-full h-full p-3 m-0 bg-transparent text-transparent caret-gray-900 dark:caret-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words focus:outline-none z-10"
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    </>
  );
};

export default CodeEditor;
