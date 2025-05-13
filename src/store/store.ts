import { StoreApi, create } from 'zustand';
import { persist, createJSONStorage, StateStorage, PersistStorage, StorageValue } from 'zustand/middleware';
import { ChatSlice, createChatSlice } from './chat-slice';
import { InputSlice, createInputSlice } from './input-slice';
import { AuthSlice, createAuthSlice } from './auth-slice';
import { ConfigSlice, createConfigSlice } from './config-slice';
import { PromptSlice, createPromptSlice } from './prompt-slice';
import { ToastSlice, createToastSlice } from './toast-slice';
import localforage from 'localforage';
import { ChatInterface } from '@type/chat';
import { generateDefaultChat } from '@constants/chat';

import {
  LocalStorageInterfaceV0ToV1,
  LocalStorageInterfaceV1ToV2,
  LocalStorageInterfaceV2ToV3,
  LocalStorageInterfaceV3ToV4,
  LocalStorageInterfaceV4ToV5,
  LocalStorageInterfaceV5ToV6,
  LocalStorageInterfaceV6ToV7,
  LocalStorageInterfaceV7oV8,
} from '@type/chat';
import {
  migrateV0,
  migrateV1,
  migrateV2,
  migrateV3,
  migrateV4,
  migrateV5,
  migrateV6,
  migrateV7,
} from './migrate';
import { use } from 'i18next';

export type StoreState = ChatSlice &
  InputSlice &
  AuthSlice &
  ConfigSlice &
  PromptSlice &
  ToastSlice;

export type StoreSlice<T> = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState']
) => T;

export const createPartializedState = (state: StoreState) => ({
  chats: state.chats,
  currentChatIndex: state.currentChatIndex,
  apiKey: state.apiKey,
  apiEndpoint: state.apiEndpoint,
  theme: state.theme,
  autoTitle: state.autoTitle,
  advancedMode: state.advancedMode,
  prompts: state.prompts,
  defaultChatConfig: state.defaultChatConfig,
  defaultSystemMessage: state.defaultSystemMessage,
  hideMenuOptions: state.hideMenuOptions,
  firstVisit: state.firstVisit,
  hideSideMenu: state.hideSideMenu,
  folders: state.folders,
  enterToSubmit: state.enterToSubmit,
  inlineLatex: state.inlineLatex,
  markdownMode: state.markdownMode,
  totalTokenUsed: state.totalTokenUsed,
  countTotalTokens: state.countTotalTokens,
  additionalBodyParameters: state.additionalBodyParameters,
  systemJailbreak: state.systemJailbreak,
  squashSystemMessages: state.squashSystemMessages,
  generating: state.generating,
});

type partializedState = ReturnType<typeof createPartializedState>

// extend from the partialized state for the unhydrated state, where the chats are undefined and the chatsID are used instead
type partializedStateUnhydrated = partializedState & {chatsID: string[]}

type JsonStorageOptions = {
  reviver?: (key: string, value: unknown) => unknown
  replacer?: (key: string, value: unknown) => unknown
}

export function customJSONStorage(
  getStorage: () => StateStorage,
  options?: JsonStorageOptions,
): PersistStorage<partializedState> | undefined {
  let storage: StateStorage | undefined
  try {
    storage = getStorage()
  } catch {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
    return
  }
  const persistStorage: PersistStorage<partializedState> = {
    getItem: (name) => {
      // console.log('getItem', name)
      // handle both synchronous and asynchronous storage
      const str = (storage as StateStorage).getItem(name) ?? null

      if (str === null || !(str instanceof Promise)) {
        return null
      }

      return str.then((value) => {
        if (value === null) return null
        const obj = JSON.parse(value, options?.reviver) as StorageValue<partializedStateUnhydrated>
        // console.log('obj', obj)
        //hydrate the chats from the storage
        if (obj.state.chatsID) {
          return Promise.all(obj.state.chatsID.map(async (id) => {
            const chat = await (storage as StateStorage).getItem(id)
            if (chat === null) {
              return generateDefaultChat()
            }
            return JSON.parse(chat, options?.reviver) as ChatInterface
          })).then((chats) => {
            // console.log('chats', chats)
            return {...obj, state: {...obj.state, chats, chatsID: undefined}}
          })
        }
        return obj
      })


      // // console.log('str', str)
      // if (str instanceof Promise) {
      //   if (str === null) {
      //     return null
      //   }
      //   const obj = str.then((value) => parse(value))
      // }
      // return null
    },
    setItem: async (name, newValue) => {
      if (!useStore.persist.hasHydrated()) return;
      if (newValue.state.generating) return;
      // console.log(useStore.persist.hasHydrated())
      // console.log('setItem', name, newValue)

      const addChats = (chats: ChatInterface[]) => {
        // console.log('addChats', chats)
        //given the chats, save each chat to a separate key using the chat id
        return Promise.all(chats.map(async (chat) => 
          await (storage as StateStorage).setItem(chat.id, JSON.stringify(chat, options?.replacer))))
      }

      const removeChats = (chatsID: string[]) => {
        return Promise.all(chatsID.map(async (id) => await (storage as StateStorage).removeItem(id)))
      }

        // chats.forEach((chat) => {
        //   (storage as StateStorage).setItem(chat.id, JSON.stringify(chat, options?.replacer))
        // })
      //replace the chats with the chat ids in the storage
      const newChats = newValue.state.chats || []
      const newChatsID = newChats.map((chat) => chat.id)
      const partialState: partializedStateUnhydrated = {...newValue.state, chatsID: newChatsID}

      // compare the chats in the storage with the new chats, and only save the new chats


      const oldState = await (storage as StateStorage).getItem("free-chat-gpt") ?? null
      let addChatsContent: ChatInterface[] = []
      let removeChatsID: string[] = []
      if (oldState !== null) {
        const oldChatsID = (JSON.parse(oldState) as StorageValue<partializedStateUnhydrated>).state.chatsID
        // compute the new chat to be saved to the database using the difference between the old and new chats
        // also ensure that the current focused chat is saved
        addChatsContent = newChats.filter((chat) => !oldChatsID.includes(chat.id) || chat.id === newChatsID[newValue.state.currentChatIndex])
        // compute the chats to be removed from the database
        removeChatsID = oldChatsID.filter((id) => !newChatsID.includes(id))
      }
      await addChats(addChatsContent)
      await removeChats(removeChatsID)
      await (storage as StateStorage).setItem( name, JSON.stringify({version: newValue.version, state: {...partialState, chats:undefined}}, options?.replacer),)

      // if (newValue.state.chats) {
      //   saveChats(newValue.state.chats)
      //   //@ts-ignore
      // }
      // return (storage as StateStorage).setItem(
      //   name,
      //   //stringify everything except the chats
      //   JSON.stringify({...partialState, chats:undefined}, options?.replacer),
      // )
    },
    removeItem: (name) => {
      // console.log('removeItem', name)
      return (storage as StateStorage).removeItem(name)
    },
  }
  return persistStorage
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createChatSlice(set, get),
      ...createInputSlice(set, get),
      ...createAuthSlice(set, get),
      ...createConfigSlice(set, get),
      ...createPromptSlice(set, get),
      ...createToastSlice(set, get),
    }),
    {
      name: 'free-chat-gpt',
      // @ts-ignore
      storage: customJSONStorage(() => localforage),
      // the setItem and removeItem which returns string causing mismatch is neglected
      partialize: (state) => createPartializedState(state),
      version: 8,
      // migrate: (persistedState, version) => {
      //   // switch (version) {
      //   //   case 0:
      //   //     migrateV0(persistedState as LocalStorageInterfaceV0ToV1);
      //   //   case 1:
      //   //     migrateV1(persistedState as LocalStorageInterfaceV1ToV2);
      //   //   case 2:
      //   //     migrateV2(persistedState as LocalStorageInterfaceV2ToV3);
      //   //   case 3:
      //   //     migrateV3(persistedState as LocalStorageInterfaceV3ToV4);
      //   //   case 4:
      //   //     migrateV4(persistedState as LocalStorageInterfaceV4ToV5);
      //   //   case 5:
      //   //     migrateV5(persistedState as LocalStorageInterfaceV5ToV6);
      //   //   case 6:
      //   //     migrateV6(persistedState as LocalStorageInterfaceV6ToV7);
      //   //   case 7:
      //   //     migrateV7(persistedState as LocalStorageInterfaceV7oV8);
      //   //     break;
      //   // }
      //   return persistedState as StoreState;
      // },
      // getStorage: () => localForage;
    }
  )
);

export default useStore;
