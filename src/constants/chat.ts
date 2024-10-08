import { v4 as uuidv4 } from 'uuid';
import { ChatInterface, ConfigInterface, ModelOptions } from '@type/chat';
import useStore from '@store/store';

const date = new Date();
const dateString =
  date.getFullYear() +
  '-' +
  ('0' + (date.getMonth() + 1)).slice(-2) +
  '-' +
  ('0' + date.getDate()).slice(-2);

// default system message obtained using the following method: https://twitter.com/DeminDimin/status/1619935545144279040
export const _defaultSystemMessage =
  import.meta.env.VITE_DEFAULT_SYSTEM_MESSAGE ??
  `You are ChatGPT, a large language model trained by OpenAI.
Carefully heed the user's instructions. 
Respond using Markdown.`;

export const modelOptions: ModelOptions[] = [
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-1106',
  'gpt-4',
  'gpt-4-32k',
  'gpt-4-1106-preview',
  'mistral-medium',
  'lzlv-70b-fp16-hf',
  'mixtral-8x7b-instruct',
  'mistral-large',
  'claude-3-opus',
  'claude-3-haiku',
  'command-r-plus',
  'llama-3-70b-instruct',
  'claude-3.5-sonnet',
  'llama-3.1-405b-instruct',
  'custom'
  // 'gpt-3.5-turbo-0301',
  // 'gpt-4-0314',
  // 'gpt-4-32k-0314',
];

export const defaultModel = 'gpt-3.5-turbo';

export const modelMaxToken = {
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-0301': 4096,
  'gpt-3.5-turbo-0613': 4096,
  'gpt-3.5-turbo-16k': 16384,
  'gpt-3.5-turbo-16k-0613': 16384,
  'gpt-3.5-turbo-1106': 16384,
  'gpt-4': 8192,
  'gpt-4-0314': 8192,
  'gpt-4-0613': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-32k-0314': 32768,
  'gpt-4-32k-0613': 32768,
  'gpt-4-1106-preview': 128000,
  'mistral-medium': 32000,
  'mistral-large': 32000,
  'lzlv-70b-fp16-hf': 4096,
  'mixtral-8x7b-instruct': 32768,
  'claude-3-opus': 4096,
  'claude-3-haiku': 4096,
  'command-r-plus': 4000,
  'llama-3-70b-instruct': 8192,
  'claude-3.5-sonnet': 8192,
  'llama-3.1-405b-instruct': 32000,
  'custom': 128000,
};

export const modelCost = {
  'gpt-3.5-turbo': {
    prompt: { price: 0.0015, unit: 1000 },
    completion: { price: 0.002, unit: 1000 },
  },
  'gpt-3.5-turbo-0301': {
    prompt: { price: 0.0015, unit: 1000 },
    completion: { price: 0.002, unit: 1000 },
  },
  'gpt-3.5-turbo-0613': {
    prompt: { price: 0.0015, unit: 1000 },
    completion: { price: 0.002, unit: 1000 },
  },
  'gpt-3.5-turbo-16k': {
    prompt: { price: 0.003, unit: 1000 },
    completion: { price: 0.004, unit: 1000 },
  },
  'gpt-3.5-turbo-16k-0613': {
    prompt: { price: 0.003, unit: 1000 },
    completion: { price: 0.004, unit: 1000 },
  },
  'gpt-3.5-turbo-1106': {
    prompt: { price: 0.001, unit: 1000 },
    completion: { price: 0.0015, unit: 1000 },
  },
  'gpt-4': {
    prompt: { price: 0.03, unit: 1000 },
    completion: { price: 0.06, unit: 1000 },
  },
  'gpt-4-0314': {
    prompt: { price: 0.03, unit: 1000 },
    completion: { price: 0.06, unit: 1000 },
  },
  'gpt-4-0613': {
    prompt: { price: 0.03, unit: 1000 },
    completion: { price: 0.06, unit: 1000 },
  },
  'gpt-4-32k': {
    prompt: { price: 0.06, unit: 1000 },
    completion: { price: 0.12, unit: 1000 },
  },
  'gpt-4-32k-0314': {
    prompt: { price: 0.06, unit: 1000 },
    completion: { price: 0.12, unit: 1000 },
  },
  'gpt-4-32k-0613': {
    prompt: { price: 0.06, unit: 1000 },
    completion: { price: 0.12, unit: 1000 },
  },
  'gpt-4-1106-preview': {
    prompt: { price: 0.01, unit: 1000 },
    completion: { price: 0.03, unit: 1000 },
  },
  'mistral-medium': {
    prompt: { price: 2.78, unit: 1000000 },
    completion: { price: 8.33, unit: 1000000 },
  },
  'lzlv-70b-fp16-hf': {
    prompt: { price: 0.70, unit: 1000000 },
    completion: { price: 0.90, unit: 1000000 },
  },
  'mixtral-8x7b-instruct': {
    prompt: { price: 0.27, unit: 1000000 },
    completion: { price: 0.27, unit: 1000000 },
  },
  'mistral-large': {
    prompt: { price: 8.0, unit: 1000000 },
    completion: { price: 24.0, unit: 1000000 },
  },
  'claude-3-opus': {
    prompt: { price: 15, unit: 1000000 },
    completion: { price: 75, unit: 1000000 },
  },
  'claude-3-haiku': {
    prompt: { price: 0.25, unit: 1000000 },
    completion: { price: 1.25, unit: 1000000 },
  },
  'command-r-plus': {
    prompt: { price: 3, unit: 1000000 },
    completion: { price: 15, unit: 1000000 },
  },
  'llama-3-70b-instruct': {
    prompt: { price: 0.75, unit: 1000000 },
    completion: { price: 0.75, unit: 1000000 },
  },
  'claude-3.5-sonnet': {
    prompt: { price: 3, unit: 1000000 },
    completion: { price: 15, unit: 1000000 },
  },
  'llama-3.1-405b-instruct': {
    prompt: { price: 2.5, unit: 1000000 },
    completion: { price: 2.5, unit: 1000000 },
  },
  'custom': {
    prompt: { price: 1, unit: 1000000 },
    completion: { price: 1, unit: 1000000 },
  },
};

export const defaultUserMaxToken = 4000;

export const _defaultChatConfig: ConfigInterface = {
  model: defaultModel,
  max_tokens: defaultUserMaxToken,
  temperature: 1,
  presence_penalty: 0,
  top_p: 1,
  frequency_penalty: 0,
};

export const generateDefaultChat = (
  title?: string,
  folder?: string
): ChatInterface => ({
  id: uuidv4(),
  title: title ? title : 'New Chat',
  // messages: {
  //   role: 'system',
  //   content: '',
  //   childId: 0,
  //   children: [{childId: -1, role: 'system', content: useStore.getState().defaultSystemMessage, children: []}],
  // },
  messages: {childId: -1, role: 'system', content: useStore.getState().defaultSystemMessage, children: [], favorite: false},
    // useStore.getState().defaultSystemMessage.length > 0
    //   ? [{ role: 'system', content: useStore.getState().defaultSystemMessage }]
    //   : [],
  config: { ...useStore.getState().defaultChatConfig },
  titleSet: false,
  folder,
});

export const codeLanguageSubset = [
  'python',
  'javascript',
  'java',
  'go',
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'diff',
  'graphql',
  'json',
  'kotlin',
  'less',
  'lua',
  'makefile',
  'markdown',
  'objectivec',
  'perl',
  'php',
  'php-template',
  'plaintext',
  'python-repl',
  'r',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'typescript',
  'vbnet',
  'wasm',
  'xml',
  'yaml',
];
