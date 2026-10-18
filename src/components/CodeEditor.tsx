import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      onChange(value.substring(0, start) + '  ' + value.substring(end));
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
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
          onChange={(e) => onChange(e.target.value)}
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
