import html2canvas from 'html2canvas';
import { ChatInterface, MessageInterface } from '@type/chat';
import { Prompt } from '@type/prompt';

// Function to convert HTML to an image using html2canvas
export const htmlToImg = async (html: HTMLDivElement) => {
  const needResize = window.innerWidth >= 1024;
  const initialWidth = html.style.width;
  if (needResize) {
    html.style.width = '1023px';
  }
  const canvas = await html2canvas(html);
  if (needResize) html.style.width = initialWidth;
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
};

// Function to download the image as a file
export const downloadImg = (imgData: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = imgData;
  link.download = fileName;
  link.click();
  link.remove();
};

// // Function to convert a chat object to markdown format
// export const chatToMarkdown = (chat: ChatInterface) => {
//   let markdown = `# ${chat.title}\n\n`;
//   chat.messages.forEach((message) => {
//     markdown += `### **${message.role}**:\n\n${message.content}\n\n---\n\n`;
//   });
//   return markdown;
// };

// Function to download the markdown content as a file
export const downloadMarkdown = (markdown: string, fileName: string) => {
  const link = document.createElement('a');
  const markdownFile = new Blob([markdown], { type: 'text/markdown' });
  link.href = URL.createObjectURL(markdownFile);
  link.download = fileName;
  link.click();
  link.remove();
};

export const getMessages = (chat: ChatInterface) => {
  const messages: MessageInterface[] = [];
  let currentMessage: MessageInterface | undefined = chat.messages;
  while (currentMessage) {
    messages.push(currentMessage);
    currentMessage = currentMessage.children.at(currentMessage.childId);
  }
  // messages.shift(); // remove the first dummy message
  return messages;
};

export const simpleMustache = (template: string, prompts: Prompt[]) => {
  let result = template;
  prompts.forEach((prompt) => {
    // support  arbitrary whitespace around the variable name
    const regex = new RegExp(`{{\\s*${prompt.name}\\s*}}`, 'g');
    result = result.replace(regex, prompt.prompt);
  });
  return result;
}