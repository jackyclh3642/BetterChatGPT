import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface } from '@type/chat';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';
import { getMessages } from '@utils/chat';
import { get } from 'lodash';

const useSubmit = () => {
  const { t, i18n } = useTranslation('api');
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);
  const apiEndpoint = useStore((state) => state.apiEndpoint);
  const apiKey = useStore((state) => state.apiKey);
  const setGenerating = useStore((state) => state.setGenerating);
  const generating = useStore((state) => state.generating);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const setChats = useStore((state) => state.setChats);
  const additionalBodyParameters = useStore((state) => state.additionalBodyParameters);
  const systemJailbreak = useStore((state) => state.systemJailbreak);

  const generateTitle = async (
    message: MessageInterface[]
  ): Promise<string> => {
    let data;
    try {
      if (!apiKey || apiKey.length === 0) {
        // official endpoint
        if (apiEndpoint === officialAPIEndpoint) {
          throw new Error(t('noApiKeyWarning') as string);
        }

        // other endpoints
        data = await getChatCompletion(
          useStore.getState().apiEndpoint,
          message,
          _defaultChatConfig
        );
      } else if (apiKey) {
        // own apikey
        data = await getChatCompletion(
          useStore.getState().apiEndpoint,
          message,
          _defaultChatConfig,
          apiKey
        );
      }
    } catch (error: unknown) {
      throw new Error(`Error generating title!\n${(error as Error).message}`);
    }
    return data.choices[0].message.content;
  };

  const handleSubmit = async () => {
    // const chats = useStore.getState().chats;
    const dummyChats: ChatInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));
    if (generating || !dummyChats) return;

    // const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));

    // updatedChats[currentChatIndex].messages.push({
    //   role: 'assistant',
    //   content: '',
    // });

    // setChats(updatedChats);
    setGenerating(true);

    try {
      let stream;
      // if (chats[currentChatIndex].messages.length === 0)
      if (getMessages(dummyChats[currentChatIndex]).length === 0)
        throw new Error('No messages submitted!');

      const messages = limitMessageTokens(
        getMessages(dummyChats[currentChatIndex]),
        // chats[currentChatIndex].messages,
        dummyChats[currentChatIndex].config.max_tokens,
        dummyChats[currentChatIndex].config.model
      );
      if (messages.length === 0) throw new Error('Message exceed max token!');

      // pop the last message if it's empty
      if (messages[messages.length - 1].content === '') messages.pop();
      if (messages.length === 0) throw new Error('No messages submitted!');

      // sort the messages such that the jailbreak message is always last
      messages.sort((a, b) => {
        if (a.role === 'jailbreak') return 1;
        if (b.role === 'jailbreak') return -1;
        return 0;
      });

      if (!systemJailbreak) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'jailbreak' && messages.length > 1 && messages[messages.length - 2].role === 'user') {
          messages.pop()!;
          // Join the jailbreak message with the last user message
          // Format to ensure that there is only two newlines between the user message and the jailbreak message

          messages[messages.length - 1].content = messages[messages.length - 1].content.trimEnd() + '\n\n' + lastMessage.content.trimStart();
        }
      }

      // Set the jailbreak role to system for chat completion
      messages.forEach((message) => {
        if (message.role === 'jailbreak') message.role = 'system';
      });
      // console.log('messages', messages)

      // no api key (free)
      if (!apiKey || apiKey.length === 0) {
        // official endpoint
        if (apiEndpoint === officialAPIEndpoint) {
          throw new Error(t('noApiKeyWarning') as string);
        }

        // other endpoints
        stream = await getChatCompletionStream(
          useStore.getState().apiEndpoint,
          messages,
          dummyChats[currentChatIndex].config,
          undefined,
          additionalBodyParameters
        );
      } else if (apiKey) {
        // own apikey
        stream = await getChatCompletionStream(
          useStore.getState().apiEndpoint,
          messages,
          dummyChats[currentChatIndex].config,
          apiKey,
          additionalBodyParameters
        );
      }

      if (stream) {
        if (stream.locked)
          throw new Error(
            'Oops, the stream is locked right now. Please try again'
          );
        const reader = stream.getReader();
        let reading = true;
        let partial = '';
        while (reading && useStore.getState().generating) {
          const { done, value } = await reader.read();
          const result = parseEventSource(
            partial + new TextDecoder().decode(value)
          );
          partial = '';

          if (result === '[DONE]' || done) {
            reading = false;
          } else {
            const resultString = result.reduce((output: string, curr) => {
              if (typeof curr === 'string') {
                partial += curr;
              } else {
                const content = curr.choices[0]?.delta?.content ?? null;
                if (content) output += content;
              }
              return output;
            }, '');

            const updatedChats: ChatInterface[] = JSON.parse(
              JSON.stringify(useStore.getState().chats)
            );
            // const updatedMessages = updatedChats[currentChatIndex].messages;
            const updatedMessages = getMessages(
              updatedChats[currentChatIndex]
            );
            updatedMessages[updatedMessages.length - 1].content += resultString;
            setChats(updatedChats);
          }
        }
        if (useStore.getState().generating) {
          reader.cancel('Cancelled by user');
        } else {
          reader.cancel('Generation completed');
        }
        reader.releaseLock();
        stream.cancel();
      }

      // update tokens used in chatting
      const currChats = useStore.getState().chats;
      const countTotalTokens = useStore.getState().countTotalTokens;

      if (currChats && countTotalTokens) {
        const model = currChats[currentChatIndex].config.model;
        const messages = getMessages(currChats[currentChatIndex]);
        updateTotalTokenUsed(
          model,
          messages.slice(0, -1),
          messages[messages.length - 1]
        );
      }

      // generate title for new chats
      if (
        useStore.getState().autoTitle &&
        currChats &&
        !currChats[currentChatIndex]?.titleSet
      ) {
        // const messages_length = currChats[currentChatIndex].messages.length;
        const messages_length = getMessages(currChats[currentChatIndex]).length;
        const assistant_message =
          getMessages(currChats[currentChatIndex])[messages_length - 1].content;
        const user_message =
          getMessages(currChats[currentChatIndex])[messages_length - 2].content;

        const message: MessageInterface = {
          role: 'user',
          content: `Generate a title in less than 6 words for the following message (language: ${i18n.language}):\n"""\nUser: ${user_message}\nAssistant: ${assistant_message}\n"""`,
          childId: -1, // Dummy childId
          children: [],
          favorite: false,
        };

        let title = (await generateTitle([message])).trim();
        if (title.startsWith('"') && title.endsWith('"')) {
          title = title.slice(1, -1);
        }
        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(useStore.getState().chats)
        );
        updatedChats[currentChatIndex].title = title;
        updatedChats[currentChatIndex].titleSet = true;
        setChats(updatedChats);

        // update tokens used for generating title
        if (countTotalTokens) {
          const model = _defaultChatConfig.model;
          updateTotalTokenUsed(model, [message], {
            role: 'assistant',
            content: title,
            childId: -1,
            children: [],
            favorite: false
          });
        }
      }
    } catch (e: unknown) {
      const err = (e as Error).message;
      console.log(err);
      setError(err);
    }
    setGenerating(false);
  };

  return { handleSubmit, error };
};

export default useSubmit;
