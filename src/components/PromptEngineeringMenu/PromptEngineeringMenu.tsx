import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import CodeIcon from '@icon/FileTextIcon';
import PlayIcon from '@icon/PlayIcon';
import { previewPromptEngineeringScript } from '@utils/promptEngineering';
import { PromptEngineeringPreviewOutput } from '@utils/promptEngineering';
import { getMessages } from '@utils/chat';
import { limitMessageTokens } from '@utils/messageUtils';
import { simpleMustache } from '@utils/chat';

const PromptEngineeringMenu = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  return (
    <div className='mt-2'>
      <button
        className='btn btn-neutral w-full'
        onClick={() => setIsModalOpen(true)}
        aria-label={t('promptEngineering') as string}
      >
        <CodeIcon className='w-4 h-4 mr-2' />
        {t('promptEngineering')}
      </button>
      {isModalOpen && (
        <PromptEngineeringMenuPopUp setIsModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

const PromptEngineeringMenuPopUp = ({
  setIsModalOpen,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();

  const promptEngineeringScript = useStore(
    (state) => state.promptEngineeringScript
  );
  const setPromptEngineeringScript = useStore(
    (state) => state.setPromptEngineeringScript
  );

  const [_script, _setScript] = useState<string>(promptEngineeringScript);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewOutput, setPreviewOutput] = useState<PromptEngineeringPreviewOutput | null>(null);

  const handleSave = () => {
    setPromptEngineeringScript(_script);
    setIsModalOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    _setScript(e.target.value);
  };

  const insertTemplate = (template: string) => {
    _setScript(template);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePreview = () => {
    const state = useStore.getState();
    const currentChatIndex = state.currentChatIndex;
    const chats = state.chats;
    const prompts = state.prompts;

    if (!chats || currentChatIndex < 0 || currentChatIndex >= chats.length) {
      setPreviewOutput({
        type: 'messages',
        data: [],
        logs: [],
        error: 'No chat is currently open.',
      });
      setIsPreviewOpen(true);
      return;
    }

    const chat = chats[currentChatIndex];
    let messages = getMessages(chat);

    // Token-limit (same as useSubmit)
    messages = limitMessageTokens(
      messages,
      chat.config.max_tokens,
      chat.config.model
    );

    // Mustache substitution (same as useSubmit)
    messages = messages.map((m) => ({
      ...m,
      content: m.content ? simpleMustache(m.content, prompts) : m.content,
    }));

    const output = previewPromptEngineeringScript(_script, {
      messages,
      config: chat.config,
      apiEndpoint: state.apiEndpoint,
      apiKey: state.apiKey,
      chatTitle: chat.title,
      currentIndex: currentChatIndex,
    });

    setPreviewOutput(output);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <PopupModal
        title={t('promptEngineering') as string}
        setIsModalOpen={setIsModalOpen}
        handleConfirm={handleSave}
        cancelButton={true}
      >
        <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[90vw] max-w-full text-sm text-gray-900 dark:text-gray-300'>
          <p className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
            {t('promptEngineeringDescription') as string}
          </p>

          <div className='flex gap-2 mb-3 flex-wrap'>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Reorder: system first, then alternating user/assistant
const ordered = [];
const systemMsgs = messages.filter(m => m.role === 'system');
const otherMsgs = messages.filter(m => m.role !== 'system');
if (systemMsgs.length) {
  ordered.push({ role: 'system', content: systemMsgs.map(m => m.content).join('\\n\\n') });
}
ordered.push(...otherMsgs);
return { messages: ordered };`)
              }
            >
              System-first
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Inject a tool call into the request body
return {
  body: {
    model: config.model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get current weather',
          parameters: { type: 'object', properties: {} }
        }
      }
    ],
    stream: true
  }
};`)
              }
            >
              Tools example
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Rename roles: map 'jailbreak' to 'system'
return {
  messages: messages.map(m => ({
    ...m,
    role: m.role === 'jailbreak' ? 'system' : m.role
  }))
};`)
              }
            >
              Role remap
            </button>
          </div>

          <div className='flex gap-2 mb-2'>
            <textarea
              ref={textareaRef}
              className='w-full h-64 p-3 font-mono text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={_script}
              onChange={handleInput}
              spellCheck={false}
            />
          </div>

          <button
            className='flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
            onClick={handlePreview}
          >
            <PlayIcon className='w-3 h-3' />
            {t('preview') as string}
          </button>
        </div>
      </PopupModal>

      {isPreviewOpen && previewOutput && (
        <PreviewModal
          output={previewOutput}
          setIsPreviewOpen={setIsPreviewOpen}
        />
      )}
    </>
  );
};

const PreviewModal = ({
  output,
  setIsPreviewOpen,
}: {
  output: PromptEngineeringPreviewOutput;
  setIsPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();

  const jsonString = JSON.stringify(output.data, null, 2);

  return (
    <PopupModal
      title={t('preview') as string}
      setIsModalOpen={setIsPreviewOpen}
      cancelButton={true}
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[90vw] max-w-full text-sm text-gray-900 dark:text-gray-300'>
        {output.error && (
          <div className='mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs whitespace-pre-wrap'>
            <strong>Error:</strong>
            {'\n'}
            {output.error}
          </div>
        )}

        <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
          {output.type === 'body' ? t('bodyOverride') || 'Body Override' : t('messages') || 'Messages'}
        </div>

        <pre className='mb-4 p-3 rounded bg-gray-100 dark:bg-gray-900 font-mono text-xs overflow-auto max-h-80 border border-gray-200 dark:border-gray-700'>
          {jsonString}
        </pre>

        {output.logs.length > 0 && (
          <>
            <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              Console Output
            </div>
            <pre className='p-3 rounded bg-gray-100 dark:bg-gray-900 font-mono text-xs overflow-auto max-h-48 border border-gray-200 dark:border-gray-700'>
              {output.logs.map((log, i) => (
                <div key={i} className='border-b border-gray-200 dark:border-gray-800 last:border-0 py-1'>
                  {log}
                </div>
              ))}
            </pre>
          </>
        )}
      </div>
    </PopupModal>
  );
};

export default PromptEngineeringMenu;
