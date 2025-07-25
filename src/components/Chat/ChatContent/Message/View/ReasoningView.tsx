import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  memo,
  useState,
} from 'react';

import ReactMarkdown from 'react-markdown';
import { CodeProps, ReactMarkdownProps } from 'react-markdown/lib/ast-to-react';

import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import useStore from '@store/store';

import TickIcon from '@icon/TickIcon';
import CrossIcon from '@icon/CrossIcon';

import { ChatInterface } from '@type/chat';
import { codeLanguageSubset } from '@constants/chat';
import CopyButton from './Button/CopyButton';
import DeleteButton from './Button/DeleteButton';
import CodeBlock from '../CodeBlock';
import { getMessages, simpleMustache } from '@utils/chat';

const ReasoningView = memo(
  ({
    alt,
    setIsEdit,
    messageIndex,
  }: {
    alt: string;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    messageIndex: number;
  }) => {

    const [isDelete, setIsDelete] = useState<boolean>(false);

    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const setChats = useStore((state) => state.setChats);
    // const lastMessageIndex = useStore((state) =>
    //   state.chats ? state.chats[state.currentChatIndex].messages.length - 1 : 0
    // );
    const inlineLatex = useStore((state) => state.inlineLatex);
    const markdownMode = useStore((state) => state.markdownMode);
    const messages = useStore(
      (state) =>
        // state.chats ? state.chats[state.currentChatIndex].messages : [],
        state.chats ? getMessages(state.chats[state.currentChatIndex]) : []
    );
    const generating = useStore((state) => state.generating);

    const handleDelete = () => {
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const currentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex];
      currentMessage.alt = undefined;
      // updatedChats[currentChatIndex].messages.splice(messageIndex, 1);
      setChats(updatedChats);
      setIsDelete(false);
    };

    const handleStartDelete = () => {
      if (generating) return;
      setIsDelete(true);
    }

    const handleCopy = () => {
      navigator.clipboard.writeText(alt);
    };

    return (
      <>
        <div className='markdown prose w-full md:max-w-full break-words dark:prose-invert dark share-gpt-message'>
          {markdownMode ? (
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
                [remarkMath, { singleDollarTextMath: inlineLatex }],
              ]}
              rehypePlugins={[
                rehypeKatex,
                [
                  rehypeHighlight,
                  {
                    detect: true,
                    ignoreMissing: true,
                    subset: codeLanguageSubset,
                  },
                ],
              ]}
              linkTarget='_new'
              components={{
                code,
                p,
              }}
            >
              {alt}
            </ReactMarkdown>
          ) : (
            <span className='whitespace-pre-wrap'>{alt}</span>
          )}
        </div>
        <div className='flex justify-end gap-2 w-full mt-2'>
          {isDelete || (
            <>

              <CopyButton onClick={handleCopy} />
              {messageIndex !== 0 && (<DeleteButton onClick={handleStartDelete} />)}
            </>
          )}
          {isDelete && (
            <>
              <button
                className='p-1 hover:text-white'
                aria-label='cancel'
                onClick={() => setIsDelete(false)}
              >
                <CrossIcon />
              </button>
              <button
                className='p-1 hover:text-white'
                aria-label='confirm'
                onClick={handleDelete}
              >
                <TickIcon />
              </button>
            </>
          )}
        </div>
      </>
    );
  }
);

const code = memo((props: CodeProps) => {
  const { inline, className, children } = props;
  const match = /language-(\w+)/.exec(className || '');
  const lang = match && match[1];

  if (inline) {
    return <code className={className}>{children}</code>;
  } else {
    return <CodeBlock lang={lang || 'text'} codeChildren={children} />;
  }
});

const p = memo(
  (
    props?: Omit<
      DetailedHTMLProps<
        HTMLAttributes<HTMLParagraphElement>,
        HTMLParagraphElement
      >,
      'ref'
    > &
      ReactMarkdownProps
  ) => {
    return <p className='whitespace-pre-wrap'>{props?.children}</p>;
  }
);

export default ReasoningView;
