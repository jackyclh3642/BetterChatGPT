import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import useSubmit from '@hooks/useSubmit';

import { ChatInterface } from '@type/chat';

import PopupModal from '@components/PopupModal';
import TokenCount from '@components/TokenCount';
import CommandPrompt from '../CommandPrompt';
import { getMessages } from '@utils/chat';
import { set } from 'lodash';
import { use } from 'i18next';

const EditView = ({
  content,
  setIsEdit,
  messageIndex,
  sticky,
}: {
  content: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const inputRole = useStore((state) => state.inputRole);
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);

  const [_content, _setContent] = useState<string>(content);
  // const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const textareaRef = React.createRef<HTMLTextAreaElement>();

  const { t } = useTranslation();

  const resetTextAreaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
        navigator.userAgent
      );

    if (e.key === 'Enter' && !isMobile && !e.nativeEvent.isComposing) {
      const enterToSubmit = useStore.getState().enterToSubmit;

      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        handleGenerate();
        resetTextAreaHeight();
      } else if (
        (enterToSubmit && !e.shiftKey) ||
        (!enterToSubmit && (e.ctrlKey || e.shiftKey))
      ) {
        if (sticky) {
          e.preventDefault();
          handleGenerate();
          resetTextAreaHeight();
        } else {
          handleSave();
        }
      }
    }
  };

  // save new would only be called for non-sticky messages
  const handleSaveNew = () => {
    if (useStore.getState().generating) return;
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedMessages = getMessages(updatedChats[currentChatIndex]);
    const parentMessage = updatedMessages[messageIndex-1];
    // check if the same message is already saved in parent
    // for (let i = 0; i < parentMessage.children.length; i++) {
    //   if (parentMessage.children[i].content === _content) {
    //     setIsEdit(false);
    //     parentMessage.childId = i;
    //     setChats(updatedChats);
    //     return;
    //   }
    // }
    parentMessage.children.push({
      role: updatedMessages[messageIndex].role,
      content: _content,
      childId: -1,
      children: [],
      favorite: false,
    })
    parentMessage.childId = parentMessage.children.length - 1;
    setIsEdit(false);
    setChats(updatedChats);
  }

  const handleSave = (format: boolean = false) => {
    if (sticky && (_content === '' || useStore.getState().generating)) return;
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );

    let formatted = _content;
    if (format) {
      let input = _content.replace(/\*/g, '').trim()
      // also remove all "*" from the input

      let output = '';
      let pointer = 0;
      let insideQuotes = false;

      while (true) {
        if (insideQuotes) {
          const nextQuote = input.indexOf('"', pointer);
          if (nextQuote === -1) {
            // This one should not happen, but just in case
            output += input.slice(pointer).trim();
            break;
          } else {
            // The pointer must point behind the starting quote, otherwise it will match the same quote again
            output += input.slice(pointer, nextQuote).trim() + '"';
            pointer = nextQuote+1;
            insideQuotes = false;
          }

        } else {
          const nextQuote = input.indexOf('"', pointer);
          const nextNewline = input.indexOf('\n', pointer);

          let message: string;
          let prefix: string;
          let completed = false;

          if (nextQuote === -1 && nextNewline === -1) {
            message = input.slice(pointer).trim();
            prefix = '';
            completed = true;
          } else if (nextQuote === -1 || (nextNewline !== -1 && nextNewline < nextQuote)) {
            message = input.slice(pointer, nextNewline).trim();
            prefix = '\n';
            pointer = nextNewline+1;
          } else {
            message = input.slice(pointer, nextQuote).trim();
            prefix = ' "';
            pointer = nextQuote+1;
            insideQuotes = true;
          }

          if (message !== '') {
            if (!(output.endsWith('\n'))) output += ' ';
            if (!message.startsWith('*')) output += '*';
            output += message;
            if (!message.endsWith('*')) output += '*';
          }
          output += prefix;
          if (completed) break;

          // if (nextQuote === -1 && nextNewline === -1) {
          //   let message_end = input.slice(pointer).trim();
          //   // console.log('message_end:', message_end)
          //   if (message_end !== ''){
          //     if (!(output.endsWith('\n'))) output += ' ';
          //     output += '*' + message_end + '*';
          //   }
          //   break;
          // } else if (nextQuote === -1 || (nextNewline !== -1 && nextNewline < nextQuote)) {
          //   let paragraph_end = input.slice(pointer, nextNewline).trim();
          //   // console.log('paragraph_end:', paragraph_end)
          //   if (paragraph_end !== ''){
          //     if (!(output.endsWith('\n'))) output += ' ';
          //     output += '*' + paragraph_end + '*';
          //   }
          //   output += '\n';
          //   pointer = nextNewline+1;
          // } else {
          //   let intermediate = input.slice(pointer, nextQuote).trim();
          //   // console.log('intermediate:', intermediate)
          //   if (intermediate !== ''){
          //     if (!(output.endsWith('\n'))) output += ' ';
          //     if (!intermediate.startsWith('*')) output += '*';
          //     output += intermediate
          //     if (!intermediate.endsWith('*')) output += '*';
          //   }
          //   if (!(output.endsWith('\n'))) output += ' ';
          //   output += '"';
          //   pointer = nextQuote+1;
          //   insideQuotes = true
          // }
        }
      }
      // also standardize the newlines
      formatted = output.replace(/\n{1,}/g, '\n\n').trim();
    }

    // const updatedMessages = updatedChats[currentChatIndex].messages;
    const updatedMessages = getMessages(updatedChats[currentChatIndex]);
    if (sticky) {
      const parentMessage = updatedMessages[updatedMessages.length - 1];
      parentMessage.children.push({
        role: inputRole,
        content: formatted,
        childId: -1,
        children: [],
        favorite: false,
      });
      parentMessage.childId = parentMessage.children.length - 1;
      // updatedMessages.at(-1)?.children.push({ role: inputRole, content: _content, childId: -1, children: []});
      _setContent('');
      resetTextAreaHeight();
    } else {
      // const editedMessage = updatedMessages[messageIndex];
      // if (messageIndex === 0 || editedMessage.role === 'assistant' || editedMessage.children.length === 0) {
      updatedMessages[messageIndex].content = formatted;
      // } else {
      //   const parentMessage = updatedMessages[messageIndex-1];
      //   parentMessage.children.push({
      //     role: editedMessage.role,
      //     content: _content,
      //     childId: -1,
      //     children: [],
      //     favorite: false,
      //   })
      //   parentMessage.childId = parentMessage.children.length - 1;
      // }
      setIsEdit(false);
    }
    setChats(updatedChats);
  };

  const { handleSubmit } = useSubmit();
  const handleGenerate = () => {
    handleSave();
    // if (useStore.getState().generating) return;
    // const updatedChats: ChatInterface[] = JSON.parse(
    //   JSON.stringify(useStore.getState().chats)
    // );
    // const updatedMessages = getMessages(updatedChats[currentChatIndex]);
    // if (sticky) {
    //   if (_content !== '') {
    //     updatedMessages.at(-1)?.children.push({
    //       role: inputRole,
    //       content: _content,
    //       childId: 0,
    //       children: [{ role: 'assistant', content: '', childId: -1, children: []}]});
    //   }
    //   _setContent('');
    //   resetTextAreaHeight();
    // } else {
    //   const parentMessage = updatedMessages[messageIndex-1];
    //   let currentMessage = updatedMessages[messageIndex];
    //   if (currentMessage.role === 'assistant') {
    //     currentMessage.content = _content;
    //   } else {
    //     parentMessage.children.push({
    //       role: currentMessage.role,
    //       content: _content,
    //       childId: -1,
    //       children: []
    //     })
    //   }
      
    //   updatedMessages[messageIndex].children.push(
    //     { role: 'assistant', content: '', childId: -1, children: []}
    //   )
    //   updatedMessages[messageIndex].childId = updatedMessages[messageIndex].children.length - 1;
    //   // updatedChats[currentChatIndex].messages = updatedMessages.slice(
    //   //   0,
    //   //   messageIndex + 1
    //   // );
    //   setIsEdit(false);
    // }
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedMessages = getMessages(updatedChats[currentChatIndex]);
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    lastMessage.children.push({
      role: 'assistant',
      content: '',
      childId: -1,
      children: [],
      favorite: false,
    });
    lastMessage.childId = lastMessage.children.length - 1;
    setChats(updatedChats);
    handleSubmit();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [_content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  return (
    <>
      <div
        className={`w-full ${
          sticky
            ? 'py-2 md:py-3 px-2 md:px-4 border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]'
            : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          className='m-0 resize-none rounded-lg bg-transparent overflow-y-hidden focus:ring-0 focus-visible:ring-0 leading-7 w-full placeholder:text-gray-500/40'
          onChange={(e) => {
            _setContent(e.target.value);
          }}
          value={_content}
          placeholder={t('submitPlaceholder') as string}
          onKeyDown={handleKeyDown}
          rows={1}
        ></textarea>
      </div>
      <EditViewButtons
        sticky={sticky}
        handleSaveNew={handleSaveNew}
        handleGenerate={handleGenerate}
        handleSave={handleSave}
        // setIsModalOpen={setIsModalOpen}
        setIsEdit={setIsEdit}
        _setContent={_setContent}
      />
      {/* {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('warning') as string}
          message={t('clearMessageWarning') as string}
          handleConfirm={handleGenerate}
        />
      )} */}
    </>
  );
};

const EditViewButtons = memo(
  ({
    sticky = false,
    handleGenerate,
    handleSaveNew,
    handleSave,
    // setIsModalOpen,
    setIsEdit,
    _setContent,
  }: {
    sticky?: boolean;
    handleGenerate: () => void;
    handleSaveNew: () => void;
    handleSave: (format: boolean) => void;
    // setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    _setContent: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const { t } = useTranslation();
    const generating = useStore.getState().generating;
    const advancedMode = useStore((state) => state.advancedMode);

    return (
      <div className='flex'>
        <div className='flex-1 text-center mt-2 flex justify-center'>
          {sticky && (
            <button
              className={`btn relative mr-2 btn-primary ${
                generating ? 'cursor-not-allowed opacity-40' : ''
              }`}
              onClick={handleGenerate}
              aria-label={t('generate') as string}
            >
              <div className='flex items-center justify-center gap-2'>
                {t('generate')}
              </div>
            </button>
          )}

          {sticky || (
            <button
              className='btn relative mr-2 btn-primary'
              onClick={handleSaveNew}
            >
              <div className='flex items-center justify-center gap-2'>
                {"Save As"}
              </div>
            </button>
          )}

          <button
            className={`btn relative mr-2 ${
              sticky
                ? `btn-neutral ${
                    generating ? 'cursor-not-allowed opacity-40' : ''
                  }`
                : 'btn-neutral'
            }`}
            onClick={()=>{handleSave(false)}}
          >
            <div className='flex items-center justify-center gap-2'>
              {t('save')}
            </div>
          </button>

          
          <button
            className={`btn relative mr-2 ${
              sticky
                ? `btn-neutral ${
                    generating ? 'cursor-not-allowed opacity-40' : ''
                  }`
                : 'btn-neutral'
            }`}
            onClick={()=>{handleSave(true)}}
          >
            <div className='flex items-center justify-center gap-2'>
              {"Format & Save"}
            </div>
          </button>

          {sticky || (
            <button
              className='btn relative btn-neutral'
              onClick={() => setIsEdit(false)}
              aria-label={t('cancel') as string}
            >
              <div className='flex items-center justify-center gap-2'>
                {t('cancel')}
              </div>
            </button>
          )}
        </div>
        {sticky && advancedMode && <TokenCount />}
        <CommandPrompt _setContent={_setContent} />
      </div>
    );
  }
);

export default EditView;
