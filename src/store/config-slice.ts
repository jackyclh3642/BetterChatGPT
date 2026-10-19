import { StoreSlice } from './store';
import { Theme } from '@type/theme';
import { ConfigInterface, TotalTokenUsed } from '@type/chat';
import { _defaultChatConfig, _defaultSystemMessage } from '@constants/chat';

export interface ConfigSlice {
  openConfig: boolean;
  theme: Theme;
  autoTitle: boolean;
  hideMenuOptions: boolean;
  advancedMode: boolean;
  defaultChatConfig: ConfigInterface;
  defaultSystemMessage: string;
  hideSideMenu: boolean;
  enterToSubmit: boolean;
  inlineLatex: boolean;
  markdownMode: boolean;
  countTotalTokens: boolean;
  totalTokenUsed: TotalTokenUsed;
  additionalBodyParameters: string;
  systemJailbreak: boolean;
  squashSystemMessages: boolean;
  simulateThinking: boolean;
  promptEngineeringEnabled: boolean;
  promptEngineeringScript: string;
  postProcessingEnabled: boolean;
  postProcessingScript: string;
  setOpenConfig: (openConfig: boolean) => void;
  setTheme: (theme: Theme) => void;
  setAutoTitle: (autoTitle: boolean) => void;
  setAdvancedMode: (advancedMode: boolean) => void;
  setDefaultChatConfig: (defaultChatConfig: ConfigInterface) => void;
  setDefaultSystemMessage: (defaultSystemMessage: string) => void;
  setHideMenuOptions: (hideMenuOptions: boolean) => void;
  setHideSideMenu: (hideSideMenu: boolean) => void;
  setEnterToSubmit: (enterToSubmit: boolean) => void;
  setInlineLatex: (inlineLatex: boolean) => void;
  setMarkdownMode: (markdownMode: boolean) => void;
  setCountTotalTokens: (countTotalTokens: boolean) => void;
  setTotalTokenUsed: (totalTokenUsed: TotalTokenUsed) => void;
  setAdditionalBodyParameters: (additionalBodyParameters: string) => void;
  setSystemJailbreak: (systemJailbreak: boolean) => void;
  setSquashSystemMessages: (squashSystemMessages: boolean) => void;
  setSimulateThinking: (simulateThinking: boolean) => void;
  setPromptEngineeringEnabled: (promptEngineeringEnabled: boolean) => void;
  setPromptEngineeringScript: (promptEngineeringScript: string) => void;
  setPostProcessingEnabled: (postProcessingEnabled: boolean) => void;
  setPostProcessingScript: (postProcessingScript: string) => void;
}

export const createConfigSlice: StoreSlice<ConfigSlice> = (set, get) => ({
  openConfig: false,
  theme: 'dark',
  hideMenuOptions: false,
  hideSideMenu: false,
  autoTitle: false,
  enterToSubmit: false, // BetterGPT default, true
  advancedMode: true,
  defaultChatConfig: _defaultChatConfig,
  defaultSystemMessage: _defaultSystemMessage,
  inlineLatex: true, // BetterGPT default, false
  markdownMode: true,
  countTotalTokens: true, // BetterGPT default, false
  totalTokenUsed: {},
  additionalBodyParameters: "",
  systemJailbreak: false,
  squashSystemMessages: true,
  simulateThinking: false,
  promptEngineeringEnabled: false,
  promptEngineeringScript: `// Available context:
//   messages      - Array of {role, content} after mustache substitution
//   config        - Chat config {model, max_tokens, temperature, presence_penalty, top_p, frequency_penalty}
//   apiEndpoint   - String
//   apiKey        - String or undefined
//   chatTitle     - String
//   currentIndex  - Number (current chat index)
// Return ONE of:
//   { messages }  - Replace only the messages array
//   { body }      - Full request body override (you control everything)
// If you throw an error, the request is aborted.

return { messages };`,
  postProcessingEnabled: false,
  postProcessingScript: `// Available:
//   originalMessage - The current last assistant message {role, content, alt, ...}
//   delta           - The incoming chunk {content: string, alt: string, toolCalls: array}
// Return: the updated message object.

return {
  ...originalMessage,
  content: originalMessage.content + delta.content,
  alt: (originalMessage.alt || '') + delta.alt,
};`,
  setOpenConfig: (openConfig: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      openConfig: openConfig,
    }));
  },
  setTheme: (theme: Theme) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      theme: theme,
    }));
  },
  setAutoTitle: (autoTitle: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      autoTitle: autoTitle,
    }));
  },
  setAdvancedMode: (advancedMode: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      advancedMode: advancedMode,
    }));
  },
  setDefaultChatConfig: (defaultChatConfig: ConfigInterface) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      defaultChatConfig: defaultChatConfig,
    }));
  },
  setDefaultSystemMessage: (defaultSystemMessage: string) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      defaultSystemMessage: defaultSystemMessage,
    }));
  },
  setHideMenuOptions: (hideMenuOptions: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      hideMenuOptions: hideMenuOptions,
    }));
  },
  setHideSideMenu: (hideSideMenu: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      hideSideMenu: hideSideMenu,
    }));
  },
  setEnterToSubmit: (enterToSubmit: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      enterToSubmit: enterToSubmit,
    }));
  },
  setInlineLatex: (inlineLatex: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      inlineLatex: inlineLatex,
    }));
  },
  setMarkdownMode: (markdownMode: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      markdownMode: markdownMode,
    }));
  },
  setCountTotalTokens: (countTotalTokens: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      countTotalTokens: countTotalTokens,
    }));
  },
  setTotalTokenUsed: (totalTokenUsed: TotalTokenUsed) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      totalTokenUsed: totalTokenUsed,
    }));
  },
  setAdditionalBodyParameters: (additionalBodyParameters: string) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      additionalBodyParameters: additionalBodyParameters,
    }));
  },
  setSystemJailbreak: (systemJailbreak: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      systemJailbreak: systemJailbreak,
    }));
  },
  setSquashSystemMessages: (squashSystemMessages: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      squashSystemMessages: squashSystemMessages,
    }));
  },
  setSimulateThinking: (simulateThinking: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      simulateThinking: simulateThinking,
    }));
  },
  setPromptEngineeringEnabled: (promptEngineeringEnabled: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      promptEngineeringEnabled: promptEngineeringEnabled,
    }));
  },
  setPromptEngineeringScript: (promptEngineeringScript: string) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      promptEngineeringScript: promptEngineeringScript,
    }));
  },
  setPostProcessingEnabled: (postProcessingEnabled: boolean) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      postProcessingEnabled: postProcessingEnabled,
    }));
  },
  setPostProcessingScript: (postProcessingScript: string) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      postProcessingScript: postProcessingScript,
    }));
  },
});
