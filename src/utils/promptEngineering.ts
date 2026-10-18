import { ConfigInterface, MessageInterface } from '@type/chat';

export interface PromptEngineeringContext {
  messages: MessageInterface[];
  config: ConfigInterface;
  apiEndpoint: string;
  apiKey?: string;
  chatTitle: string;
  currentIndex: number;
}

export interface PromptEngineeringMessagesResult {
  messages: MessageInterface[];
}

export interface PromptEngineeringBodyResult {
  body: Record<string, unknown>;
}

export type PromptEngineeringResult =
  | PromptEngineeringMessagesResult
  | PromptEngineeringBodyResult;

export interface PromptEngineeringPreviewOutput {
  type: 'messages' | 'body';
  data: MessageInterface[] | Record<string, unknown>;
  logs: string[];
  error?: string;
}

/**
 * Runs the user-provided prompt engineering script in a sandboxed Function.
 * Returns either { messages } or { body }.
 */
export const runPromptEngineeringScript = (
  script: string,
  context: PromptEngineeringContext
): PromptEngineeringResult => {
  // Build a function that receives destructured context and executes the user script
  const fn = new Function(
    'messages',
    'config',
    'apiEndpoint',
    'apiKey',
    'chatTitle',
    'currentIndex',
    `
"use strict";
${script}
`
  );

  const result = fn(
    context.messages,
    context.config,
    context.apiEndpoint,
    context.apiKey,
    context.chatTitle,
    context.currentIndex
  );

  if (result === undefined || result === null) {
    throw new Error(
      'Prompt engineering script did not return anything. Return { messages } or { body }.'
    );
  }

  if (typeof result !== 'object') {
    throw new Error(
      'Prompt engineering script must return an object: { messages } or { body }'
    );
  }

  if ('body' in result) {
    return result as PromptEngineeringBodyResult;
  }

  if ('messages' in result) {
    return result as PromptEngineeringMessagesResult;
  }

  throw new Error(
    'Prompt engineering script must return { messages } or { body }'
  );
};

/**
 * Preview version: runs script with console.log capture and error handling.
 * Safe to call from UI — never throws; errors are returned in output.error.
 */
export const previewPromptEngineeringScript = (
  script: string,
  context: PromptEngineeringContext
): PromptEngineeringPreviewOutput => {
  const logs: string[] = [];

  const makeLog = (args: unknown[]) => {
    try {
      return args
        .map((a) =>
          typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(' ');
    } catch {
      return String(args);
    }
  };

  const fn = new Function(
    'messages',
    'config',
    'apiEndpoint',
    'apiKey',
    'chatTitle',
    'currentIndex',
    'console',
    `
"use strict";
${script}
`
  );

  try {
    const result = fn(
      context.messages,
      context.config,
      context.apiEndpoint,
      context.apiKey,
      context.chatTitle,
      context.currentIndex,
      {
        log: (...args: unknown[]) => logs.push(makeLog(args)),
        error: (...args: unknown[]) => logs.push('[error] ' + makeLog(args)),
        warn: (...args: unknown[]) => logs.push('[warn] ' + makeLog(args)),
        info: (...args: unknown[]) => logs.push('[info] ' + makeLog(args)),
      }
    );

    if (result === undefined || result === null) {
      return {
        type: 'messages',
        data: context.messages,
        logs,
        error: 'Script did not return anything. Return { messages } or { body }.',
      };
    }

    if (typeof result !== 'object') {
      return {
        type: 'messages',
        data: context.messages,
        logs,
        error: 'Script must return an object: { messages } or { body }',
      };
    }

    if ('body' in result) {
      return {
        type: 'body',
        data: result.body as Record<string, unknown>,
        logs,
      };
    }

    if ('messages' in result) {
      return {
        type: 'messages',
        data: result.messages as MessageInterface[],
        logs,
      };
    }

    return {
      type: 'messages',
      data: context.messages,
      logs,
      error: 'Script must return { messages } or { body }',
    };
  } catch (e: unknown) {
    return {
      type: 'messages',
      data: context.messages,
      logs,
      error: (e as Error).message || String(e),
    };
  }
};
