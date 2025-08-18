import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import { getMessages } from '@utils/chat';

import { useTranslation } from 'react-i18next';
import { matchSorter } from 'match-sorter';
import { Prompt } from '@type/prompt';

import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';
import { generateDefaultChat } from '@constants/chat';

import { MessageInterface } from '@type/chat';
import { v4 as uuidv4 } from 'uuid';
import { use } from 'i18next';

const CommandPrompt = ({
  _setContent,
  messageIndex,
}: {
  _setContent: React.Dispatch<React.SetStateAction<string>>;
  messageIndex: number;
}) => {

  // Do a search on chat (a tree) to collect all leaves which is of targetDepth
  const bfsCollectLeaves = (root: MessageInterface, targetDepth: number) => {
    const leaves: Prompt[] = [];
    const queue: { node: MessageInterface; depth: number }[] = [{ node: root, depth: 0 }];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      if (depth === targetDepth) {
        // Create a new prompt for each leaf node, the name is just the first 20 characters of the content
        // skip anything that has no content
        if (node.content.trim() === '') continue;
        // skip anything if the content is already in the prompt library
        if (leaves.some((p) => p.prompt === node.content)) continue;
        const prompt: Prompt = {
          id: uuidv4(),
          prompt: node.content,
          name: node.content.slice(0, 20) + (node.content.length > 20 ? '...' : ''),
        };
        leaves.push(prompt);
      } else if (depth < targetDepth) {
        for (const child of node.children) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }

    return leaves;
  }

  const { t } = useTranslation();

  const chat = useStore(
    (state) =>
      state.chats ? state.chats[state.currentChatIndex] : generateDefaultChat()
  );
  // const messages = getMessages(chat);
  const targetDepth = messageIndex;
  const prompts = bfsCollectLeaves(chat.messages, targetDepth);

  
  // const prompts = useStore((state) => state.prompts);
  // const [_prompts, _setPrompts] = useState<Prompt[]>([prompts]);
  const [_prompts, _setPrompts] = useState<Prompt[]>(prompts);
  const [input, setInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [dropDown, setDropDown, dropDownRef] = useHideOnOutsideClick();

  useEffect(() => {
    if (dropDown && inputRef.current) {
      // When dropdown is visible, focus the input
      inputRef.current.focus();
    }
  }, [dropDown]);

  useEffect(() => {
    const filteredPrompts = matchSorter(prompts, input, {
      keys: ['prompt'],
    });
    _setPrompts(filteredPrompts);
  }, [input]);

  useEffect(() => {
    _setPrompts(prompts);
    setInput('');
  }, [chat]);

  return (
    <div className='relative max-wd-sm' ref={dropDownRef}>
      <button
        className='btn btn-neutral btn-small'
        aria-label='prompt library'
        onClick={() => setDropDown(!dropDown)}
      >
        /
      </button>
      <div
        className={`${
          dropDown ? '' : 'hidden'
        } absolute top-100 bottom-100 right-0 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800 opacity-90`}
      >
        <div className='text-sm px-4 py-2 w-max'>{t('promptLibrary')}</div>
        <input
          ref={inputRef}
          type='text'
          className='text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 m-0 w-full mr-0 h-8 focus:outline-none'
          value={input}
          placeholder={t('search') as string}
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
        <ul className='text-sm text-gray-700 dark:text-gray-200 p-0 m-0 w-max max-w-sm max-md:max-w-[90vw] max-h-32 overflow-auto'>
          {_prompts.map((cp) => (
            <li
              className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer text-start w-full'
              onClick={() => {
                _setContent((prev) => cp.prompt);
                setDropDown(false);
              }}
              key={cp.id}
            >
              {cp.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommandPrompt;
