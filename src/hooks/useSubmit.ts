import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface } from '@type/chat';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';
import { getMessages, simpleMustache } from '@utils/chat';
import { runPromptEngineeringScript } from '@utils/promptEngineering';
import { get, last, update } from 'lodash';

type ReadingThinkingState = "reading" | "not_reading" | "finished";

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
  const squashSystemMessages = useStore((state) => state.squashSystemMessages);
  const simulateThinking = useStore((state) => state.simulateThinking);
  const prompts = useStore((state) => state.prompts);
  const promptEngineeringEnabled = useStore((state) => state.promptEngineeringEnabled);
  const promptEngineeringScript = useStore((state) => state.promptEngineeringScript);

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

      // Do a simple mustache replacement for the messages
      messages.forEach((message) => {
        if (message.content) {
          message.content = simpleMustache(message.content, prompts);
        }
      })

      // --- PROMPT ENGINEERING SCRIPT INTERJECTION ---
      let peBodyOverride: Record<string, unknown> | undefined = undefined;
      if (promptEngineeringEnabled && promptEngineeringScript.trim()) {
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
        const peResult = runPromptEngineeringScript(promptEngineeringScript, {
          // @ts-ignore
          messages: filteredMessages,
          config: dummyChats[currentChatIndex].config,
          apiEndpoint,
          apiKey,
          chatTitle: dummyChats[currentChatIndex].title,
          currentIndex: currentChatIndex,
        });
        if ('body' in peResult) {
          peBodyOverride = peResult.body;
          // raise error if the body does not contain messages key
          if (!peBodyOverride.hasOwnProperty('messages')) {
            throw new Error('Prompt engineering script must return messages in the body!');
          }
        } else {
          // Replace messages with script output
          messages.length = 0;
          messages.push(...peResult.messages);
        }
      }

      // If promptEngineering is active, skip the rest of the pipeline
      if (!promptEngineeringEnabled) {
      // search and pop the message if it's prefill, assume there is only one prefill message
      // let prefillMessageIndex = -1;
      // messages.forEach((message, index) => {
      //   if (message.role === 'prefill') prefillMessageIndex = index;
      // });
      // save the prefill message
      // let prefillMessage;
      // if (prefillMessageIndex !== -1) {
      //   prefillMessage = messages[prefillMessageIndex];
      //   messages.splice(prefillMessageIndex, 1);
      // }

      // scrap all the above code, now assume there're more than one prefill message
      // save all the prefill messages
      let prefillMessagesIndex: number[] = [];
      messages.forEach((message, index) => {
        if (message.role === 'prefill') prefillMessagesIndex.push(index);
      });
      // will concat all the prefill messages with '\n\n' separator
      // console.log('prefillMessagesIndex', prefillMessagesIndex);
      let prefillMessage = "";
      for (let i = prefillMessagesIndex.length - 1; i >= 0; i--) {
        if (prefillMessage) prefillMessage = '\n\n' + prefillMessage;
        prefillMessage = messages[prefillMessagesIndex[i]].content + prefillMessage;
        messages.splice(prefillMessagesIndex[i], 1);
      }

      // console.log(prefillMessage)

      // add the prefill message to the last message (if it's assistant message)
      if (prefillMessage) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant') {
          // lastMessage.content = prefillMessage.content + '\n\n';
          lastMessage.content = prefillMessage;
        }
      }

      // save the jailbreak message if present, warn if there are multiple jailbreak messages
      let jailbreakMessageIndex = -1;
      let jailbreakMessageCount = 0;
      messages.forEach((message, index) => {
        if (message.role === 'jailbreak') {
          jailbreakMessageIndex = index;
          jailbreakMessageCount++;
        }
      });
      if (jailbreakMessageCount > 1)
        throw new Error('Multiple jailbreak messages detected!');

      // pop the jailbreak message if it's present
      let jailbreakMessage;
      if (jailbreakMessageIndex !== -1) {
        jailbreakMessage = messages[jailbreakMessageIndex];
        messages.splice(jailbreakMessageIndex, 1);
      }

      // pop the last message if it's empty
      if (messages[messages.length - 1].content === '') messages.pop();
      if (messages.length === 0) throw new Error('No messages submitted!');

      // loop through the messages and combine the consecutive system messages if squashSystemMessages is true
      if (squashSystemMessages) {
        let i = 0;
        while (i < messages.length - 1) {
          if (messages[i].role === 'system' && messages[i + 1].role === 'system') {
            messages[i].content += '\n\n' + messages[i + 1].content;
            messages.splice(i + 1, 1);
          } else {
            i++;
          }
        }
      }

      // loop through the messages and combine the consecutive user messages if squashUserMessages is true
      if (true) {
        let i = 0;
        while (i < messages.length - 1) {
          if (messages[i].role === 'user' && messages[i + 1].role === 'user') {
            messages[i].content += '\n\n' + messages[i + 1].content;
            messages.splice(i + 1, 1);
          } else {
            i++;
          }
        }
      }

      if (jailbreakMessage) {
        if (systemJailbreak) {
          jailbreakMessage.role = 'system';
          if (messages[messages.length - 1].role === 'assistant') {
            // insert it before the prefilled assistant message
            messages.splice(messages.length - 1, 0, jailbreakMessage);
          } else {
            messages.push(jailbreakMessage);
          }
        } else {
          // add the jailbreak message to the last user message
          let added = false;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
              messages[i].content = messages[i].content.trimEnd() + '\n\n' + jailbreakMessage.content.trimStart();
              added = true;
              break;
            }
          }
          if (!added) {
            throw new Error('Non-system Jailbreak message must be preceded by a user message!');
          }
        }
      }
      } // end of !promptEngineering block

      // // Set the jailbreak role to system for chat completion
      // messages.forEach((message) => {
      //   if (message.role === 'jailbreak') message.role = 'system';
      // });
      // // console.log('messages', messages)

      // no api key (free)
      if (!apiKey || apiKey.length === 0) {
        // official endpoint
        if (apiEndpoint === officialAPIEndpoint) {
          throw new Error(t('noApiKeyWarning') as string);
        }

        // other endpoints
        stream = await getChatCompletionStream(
          useStore.getState().apiEndpoint,
          peBodyOverride ? [] : messages,
          dummyChats[currentChatIndex].config,
          undefined,
          additionalBodyParameters,
          peBodyOverride
        );
      } else if (apiKey) {
        // own apikey
        stream = await getChatCompletionStream(
          useStore.getState().apiEndpoint,
          peBodyOverride ? [] : messages,
          dummyChats[currentChatIndex].config,
          apiKey,
          additionalBodyParameters,
          peBodyOverride
        );
      }

      if (stream) {
        if (stream.locked)
          throw new Error(
            'Oops, the stream is locked right now. Please try again'
          );
          
        const reader = stream.getReader();
        if (promptEngineeringEnabled) {
          
          const reader = stream.getReader();
          let reading = true;
          let partial = '';
          let partial_alt = '';
          let partial_tool_calls = '';
          while (reading && useStore.getState().generating) {
            const { done, value } = await reader.read();
            const result = parseEventSource(
              partial + new TextDecoder().decode(value)
            );
            partial = '';

            if (result === '[DONE]' || done) {
              reading = false;
            } else {

              let resultString = '';
              let resultAltString = '';
              let resultToolCalls = []

              for (const curr of result) {
                if (typeof curr === 'string') {
                  partial += curr;
                } else {
                  const delta = curr.choices[0]?.delta;
                  if (delta?.content) resultString += delta.content;
                  if (delta?.reasoning) resultAltString += delta.reasoning;
                  if (delta?.tool_calls) resultToolCalls.push(...delta.tool_calls);
                }
              }

              const updatedChats: ChatInterface[] = JSON.parse(
                JSON.stringify(useStore.getState().chats)
              );
              // const updatedMessages = updatedChats[currentChatIndex].messages;
              const updatedMessages = getMessages(
                updatedChats[currentChatIndex]
              );

              let dummyUpdateMessage = JSON.parse(JSON.stringify(updatedMessages[updatedMessages.length - 1]));
              const curr = {
                resultString,
                resultAltString,
                resultToolCalls
              }

              // The resultAlt is null by default, so only set or update it if it's not null
              if (resultAltString) {
                if (updatedMessages[updatedMessages.length - 1].alt) {
                  updatedMessages[updatedMessages.length - 1].alt += resultAltString;
                } else {
                  updatedMessages[updatedMessages.length - 1].alt = resultAltString;
                }
              }

              // Placeholder, get the updated message by consulting the prompt engineering post processing script, then update the last message in the chat with the updated message
              // End placeholder


              setChats(updatedChats);
            }
          }
          
        } else {

          const reader = stream.getReader();
          let reading = true;
          let partial = '';
          let partial_alt = '';
          let partial_tool_calls = '';
          while (reading && useStore.getState().generating) {
            const { done, value } = await reader.read();
            const result = parseEventSource(
              partial + new TextDecoder().decode(value)
            );
            partial = '';
            partial_alt = '';
            partial_tool_calls = '';

            if (result === '[DONE]' || done) {
              reading = false;
            } else {
              // console.log('result', result);
              let resultString = result.reduce((output: string, curr) => {
                if (typeof curr === 'string') {
                  partial += curr;
                } else {
                  const content = curr.choices[0]?.delta?.content ?? null;
                  if (content) output += content;
                }
                return output;
              }, '');

              let resultAltString = result.reduce((output: string, curr) => {
                if (typeof curr === 'string') {
                  partial_alt += curr;
                } else {
                  const content = curr.choices[0]?.delta?.reasoning ?? null;
                  if (content) output += content;
                }
                return output;
              }, '');

              let resultToolCallsString = result.reduce((output: string, curr) => {
                if (typeof curr === 'string') {
                  partial_tool_calls += curr;
                } else {
                  const content = curr.choices[0]?.delta?.tool_calls?.[0] ?? null;
                  if (content) output += JSON.stringify(content);
                }
                return output;
              }, '');

              // console.log('resultToolCallsString', resultToolCallsString);

              // use resultToolCallsString as resultString if the latter is empty and the former is not
              if (!resultString && resultToolCallsString) {
                // let resultToolCallsJson = JSON.parse(resultToolCallsString);
                // resultString = resultToolCallsJson?.display_stream ?? '';
                resultString = resultToolCallsString;
              }

              if (!resultString && !resultAltString && !resultToolCallsString) {
                continue;
              }

              const updatedChats: ChatInterface[] = JSON.parse(
                JSON.stringify(useStore.getState().chats)
              );
              // const updatedMessages = updatedChats[currentChatIndex].messages;
              const updatedMessages = getMessages(
                updatedChats[currentChatIndex]
              );
              updatedMessages[updatedMessages.length - 1].content += resultString;

              // The resultAlt is null by default, so only set or update it if it's not null
              if (resultAltString) {
                if (updatedMessages[updatedMessages.length - 1].alt) {
                  updatedMessages[updatedMessages.length - 1].alt += resultAltString;
                } else {
                  updatedMessages[updatedMessages.length - 1].alt = resultAltString;
                }
              }

              // strip left white space for good measure
              updatedMessages[updatedMessages.length - 1].content = updatedMessages[
                updatedMessages.length - 1
              ].content.trimStart();
              setChats(updatedChats);
            }
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
