import React, { useRef, useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import CodeEditor from '@components/CodeEditor';
import CodeIcon from '@icon/FileTextIcon';
import PlayIcon from '@icon/PlayIcon';
import {
  previewPromptEngineeringScript,
  PromptEngineeringPreviewOutput,
} from '@utils/promptEngineering';
import { getMessages } from '@utils/chat';
import { limitMessageTokens } from '@utils/messageUtils';
import { simpleMustache } from '@utils/chat';
import { ChatInterface } from '@type/chat';

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

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewOutput, setPreviewOutput] =
    useState<PromptEngineeringPreviewOutput | null>(null);

  const handleSave = () => {
    setPromptEngineeringScript(_script);
    setIsModalOpen(false);
  };

  const insertTemplate = (template: string) => {
    _setScript(template);
  };

  const handlePreview = () => {

    const state = useStore.getState();
    const currentChatIndex = state.currentChatIndex;
    const chats = state.chats;
    const prompts = state.prompts;
    const dummyChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));

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

    const dummyChat = dummyChats[currentChatIndex];
    let messages = getMessages(dummyChat);

    // Token-limit (same as useSubmit)
    messages = limitMessageTokens(
      messages,
      dummyChat.config.max_tokens,
      dummyChat.config.model
    );

    // Mustache substitution (same as useSubmit)
    messages = messages.map((m) => ({
      ...m,
      content: m.content ? simpleMustache(m.content, prompts) : m.content,
    }));

    if (messages[messages.length - 1].content === '') messages.pop();
    if (messages.length === 0) throw new Error('No messages submitted!');
    // filter messages so that only role, content, and identifier are passed to the prompt engineering script
    const filteredMessages = messages.map((message) => {
      return {
        role: message.role,
        content: message.content,
        identifier: message.identifier,
        alt: message.alt,
      };
    });

    const output = previewPromptEngineeringScript(_script, {
      // @ts-ignore
      messages: filteredMessages,
      config: dummyChat.config,
      apiEndpoint: state.apiEndpoint,
      apiKey: state.apiKey,
      chatTitle: dummyChat.title,
      currentIndex: currentChatIndex,
    });

    console.log('Prompt Engineering Preview Output:', output);

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
        fullWidth={true}
      >
        <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-5xl text-sm text-gray-900 dark:text-gray-300'>
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

          <div className='h-96 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden mb-3'>
            <CodeEditor
              value={_script}
              onChange={_setScript}
              language='javascript'
              className='h-full'
              placeholder='// Your prompt engineering script...'
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

  // Pretty-print the output data as JSON
  const jsonString = JSON.stringify(output.data, null, 2);
  const displayLanguage = output.type === 'body' ? 'json' : 'json';

  return (
    <PopupModal
      title={t('preview') as string}
      setIsModalOpen={setIsPreviewOpen}
      cancelButton={true}
      fullWidth={true}
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-5xl text-sm text-gray-900 dark:text-gray-300'>
        {output.error && (
          <div className='mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs whitespace-pre-wrap'>
            <strong>Error:</strong>
            {'\n'}
            {output.error}
          </div>
        )}

        <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center justify-between'>
          <span>
            {output.type === 'body'
              ? t('bodyOverride') || 'Body Override'
              : t('messages') || 'Messages'}
            {' '}
            ({output.type})
          </span>
        </div>

        <div className='h-80 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden mb-4'>
          <CodeEditor
            value={jsonString}
            onChange={() => {}}
            language={displayLanguage}
            className='h-full'
            readOnly
          />
        </div>

        {output.logs.length > 0 && (
          <>
            <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              Console Output
            </div>
            <div className='h-40 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden'>
              <CodeEditor
                value={output.logs.join('\n')}
                onChange={() => {}}
                language='json'
                className='h-full'
                readOnly
              />
            </div>
          </>
        )}
      </div>
    </PopupModal>
  );
};

export default PromptEngineeringMenu;
