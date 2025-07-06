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

import useSubmit from '@hooks/useSubmit';

import { ChatInterface } from '@type/chat';

import { codeLanguageSubset } from '@constants/chat';

import RefreshButton from './Button/RefreshButton';
import UpButton from './Button/UpButton';
import DownButton from './Button/DownButton';
import CopyButton from './Button/CopyButton';
import EditButton from './Button/EditButton';
import DeleteButton from './Button/DeleteButton';
import MarkdownModeButton from './Button/MarkdownModeButton';

import CodeBlock from '../CodeBlock';
import { getMessages, simpleMustache } from '@utils/chat';
import LeftButton from './Button/LeftButton';
import RightButton from './Button/RightButton';
import { Role } from '@type/chat';

const ContentView = memo(
  ({
    role,
    content,
    setIsEdit,
    messageIndex,
  }: {
    role: Role;
    content: string;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    messageIndex: number;
  }) => {
    const { handleSubmit } = useSubmit();

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
    const prompts = useStore((state) => state.prompts);

    const renderedContent = simpleMustache(content, prompts);

    const handleDelete = () => {
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
      parentMessage.children.splice(parentMessage.childId, 1);
      parentMessage.childId = Math.min(parentMessage.children.length - 1, parentMessage.childId);
      // updatedChats[currentChatIndex].messages.splice(messageIndex, 1);
      setChats(updatedChats);
      setIsDelete(false);
    };

    const handleStartDelete = () => {
      if (generating) return;
      setIsDelete(true);
    }

    const handleStartEdit = () => {
      if (generating) return;
      setIsEdit(true);
    }

    // const handleMove = (direction: 'up' | 'down') => {
    //   const updatedChats: ChatInterface[] = JSON.parse(
    //     JSON.stringify(useStore.getState().chats)
    //   );
    //   const updatedMessages = updatedChats[currentChatIndex].messages;
    //   const temp = updatedMessages[messageIndex];
    //   if (direction === 'up') {
    //     updatedMessages[messageIndex] = updatedMessages[messageIndex - 1];
    //     updatedMessages[messageIndex - 1] = temp;
    //   } else {
    //     updatedMessages[messageIndex] = updatedMessages[messageIndex + 1];
    //     updatedMessages[messageIndex + 1] = temp;
    //   }
    //   setChats(updatedChats);
    // };

    // const handleMoveLeft = () => {
    //   if (generating) return;
    //   const updatedChats: ChatInterface[] = JSON.parse(
    //     JSON.stringify(useStore.getState().chats)
    //   );
    //   const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
    //   parentMessage.childId = Math.max(0, parentMessage.childId - 1);
    //   // const 
    //   // handleMove('up');
    //   setChats(updatedChats);
    // };

    // const handleMoveRightandRefresh = () => {
    //   if (generating) return;
    //   const updatedChats: ChatInterface[] = JSON.parse(
    //     JSON.stringify(useStore.getState().chats)
    //   );
    //   const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
    //   if (parentMessage.childId === parentMessage.children.length - 1 && role === 'assistant') {
    //     parentMessage.childId++;
    //     parentMessage.children.push({
    //       role, content: '', childId: -1, children: []})
    //     setChats(updatedChats);
    //     handleSubmit();
    //     // handleRefresh();
    //     // parentMessage.children.push({ role: parentMessage.role, content: '', childId: -1, children: []});
    //     // setChats(updatedChats);
    //   } else {
    //     parentMessage.childId = Math.min(parentMessage.children.length - 1, parentMessage.childId + 1);
    //     setChats(updatedChats);
    //   }
    //   // parentMessage.childId = Math.min(parentMessage.children.length - 1, parentMessage.childId + 1);
    //   // const 
    //   // handleMove('up');
    // };

    // const handleRefresh = () => {
    //   const updatedChats: ChatInterface[] = JSON.parse(
    //     JSON.stringify(useStore.getState().chats)
    //   );
    //   const updatedMessages = updatedChats[currentChatIndex].messages;
    //   updatedMessages.splice(updatedMessages.length - 1, 1);
    //   setChats(updatedChats);
    //   handleSubmit();
    // };

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
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
              {renderedContent}
            </ReactMarkdown>
          ) : (
            <span className='whitespace-pre-wrap'>{renderedContent}</span>
          )}
        </div>
        <div className='flex justify-end gap-2 w-full mt-2'>
          {isDelete || (
            <>
              {/* {!useStore.getState().generating &&
                role === 'assistant' && (
                  <RefreshButton onClick={handleRefresh} />
                )} */}
              {/* {messageIndex !== 0 && <UpButton onClick={handleMoveUp} />}
              {messageIndex !== lastMessageIndex && (
                <DownButton onClick={handleMoveDown} />
              )} */}

              {/* {messageIndex !== 0 && <>
                <LeftButton onClick={handleMoveLeft}/>
                <div className = 'center dark:text-gray-400 md:invisible md:group-hover:visible visible'>
                  {messages[messageIndex-1].childId + 1} / {messages[messageIndex-1].children.length}
                </div>
                <RightButton onClick={handleMoveRightandRefresh}/>
              </>} */}

              {/* <MarkdownModeButton /> */}
              <CopyButton onClick={handleCopy} />
              <EditButton onClick={handleStartEdit} />
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

export default ContentView;
