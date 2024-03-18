import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface, ModelOptions } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  // customHeaders?: Record<string, string>
  additionalBodyParameters?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
    };

    const model = modelmapping[config.model] || config.model;

    // set api version to 2023-07-01-preview for gpt-4 and gpt-4-32k, otherwise use 2023-03-15-preview
    const apiVersion =
      model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview';

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  const modelmapping: Partial<Record<ModelOptions, string>> = {
    'mistral-medium': 'mistralai/mistral-medium',
    'lzlv-70b-fp16-hf': 'lizpreciatior/lzlv-70b-fp16-hf',
    'mixtral-8x7b-instruct': 'mistralai/mixtral-8x7b-instruct',
    'mistral-large': 'mistralai/mistral-large',
    'claude-3-opus': 'anthropic/claude-3-opus:beta',
    'claude-3-haiku': 'anthropic/claude-3-haiku:beta',
  };
  const model = modelmapping[config.model] || config.model;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: messages.map((message)=>({role: message.role, content: message.content})),
      ...config,
      max_tokens: undefined,
      model
    }),
  });
  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data;
};

export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  // customHeaders?: Record<string, string>
  additionalBodyParameters?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
    };

    const model = modelmapping[config.model] || config.model;

    // set api version to 2023-07-01-preview for gpt-4 and gpt-4-32k, otherwise use 2023-03-15-preview
    const apiVersion =
      model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview';
    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  const modelmapping: Partial<Record<ModelOptions, string>> = {
    'mistral-medium': 'mistralai/mistral-medium',
    'lzlv-70b-fp16-hf': 'lizpreciatior/lzlv-70b-fp16-hf',
    'mixtral-8x7b-instruct': 'mistralai/mixtral-8x7b-instruct',
    'mistral-large': 'mistralai/mistral-large',
    'claude-3-opus': 'anthropic/claude-3-opus:beta',
    'claude-3-haiku': 'anthropic/claude-3-haiku:beta',
  };
  const model = modelmapping[config.model] || config.model;

  // Try to parse the additionalBodyParameters as JSON, throw an error if it fails
  let additionalBodyParametersJSON = {}
  if (additionalBodyParameters) {
    try {
      additionalBodyParametersJSON = JSON.parse(additionalBodyParameters)
    } catch (e) {
      throw new Error('Invalid additionalBodyParameters')
    }
  }

  const body = {
    messages: messages.map((message)=>({role: message.role, content: message.content})),
    ...config,
    max_tokens: undefined,
    stream: true,
    model,
    ...additionalBodyParametersJSON
  }
  
  // console.log(body)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (response.status === 404 || response.status === 405) {
    const text = await response.text();

    if (text.includes('model_not_found')) {
      throw new Error(
        text +
          '\nMessage from Better ChatGPT:\nPlease ensure that you have access to the GPT-4 API!'
      );
    } else {
      throw new Error(
        'Message from Better ChatGPT:\nInvalid API endpoint! We recommend you to check your free API endpoint.'
      );
    }
  }

  if (response.status === 429 || !response.ok) {
    const text = await response.text();
    let error = text;
    if (text.includes('insufficient_quota')) {
      error +=
        '\nMessage from Better ChatGPT:\nWe recommend changing your API endpoint or API key';
    } else if (response.status === 429) {
      error += '\nRate limited!';
    }
    throw new Error(error);
  }

  const stream = response.body;
  return stream;
};

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
