import { ChatInterface, FolderCollection, Role } from './chat';

export interface ExportBase {
  version: number;
}

export interface ExportV1 extends ExportBase {
  chats?: ChatInterface[];
  folders: FolderCollection;
  promptEngineeringScript?: string;
  postProcessingScript?: string;
  promptEngineeringEnabled?: boolean;
  postProcessingEnabled?: boolean;
  // API settings (only included in password-protected exports)
  apiEndpoint?: string;
  apiKey?: string;
  additionalBodyParameters?: string;
}

export interface EncryptedExport {
  version: 'encrypted';
  salt: string;
  iv: string;
  ciphertext: string;
}

// export type OpenAIChat = {
//   title: string;
//   mapping: {
//     [key: string]: {
//       id: string;
//       message?: {
//         author: {
//           role: Role;
//         };
//         content: {
//           parts?: string[];
//         };
//       } | null;
//       parent: string | null;
//       children: string[];
//     };
//   };
//   current_node: string;
// };

export default ExportV1;
