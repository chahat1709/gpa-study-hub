
import { db, storage, isConfigValid } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  orderBy, 
  getDocs, 
  getDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChatSession, SocialMessage, Participant } from '../types';
import { generateSocialAgentResponse } from './aiProviderService';
import { encryptText, decryptText } from './encryptionService';
import { offlineStorageService } from './offlineStorageService';

/**
 * SECURE FIREBASE SOCIAL SERVICE
 * End-to-end encrypted messaging via Web Crypto API.
 */
export const socialService = {
  subscribeToUserChats: (userId: string, onUpdate: (chats: ChatSession[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userId),
      orderBy('lastTimestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      onUpdate(chats);
    });
  },

  subscribeToChatMessages: (chatId: string, onUpdate: (msgs: SocialMessage[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SocialMessage[];
      onUpdate(msgs);
    });
  },

  searchUsers: async (searchQuery: string): Promise<Participant[]> => {
    if (!db) return [];
    const q = query(
      collection(db, 'users'),
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      avatar: doc.data().photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name)}`,
    }));
  },

  startChatWithUser: async (currentUser: Participant, targetUser: Participant): Promise<string> => {
    if (!db) throw new Error("Database disconnected");
    const participants = [currentUser.id, targetUser.id].sort();
    const chatId = participants.join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participantIds: participants,
        participants: [
          { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar }
        ],
        lastMessage: 'Secure tunnel initialized',
        lastTimestamp: Date.now(),
        isGroup: false,
        unreadCount: 0
      });
    }
    return chatId;
  },

  sendMessage: async (chatId: string, senderId: string, senderName: string, content: string, type: 'text' | 'image' | 'pdf' = 'text', file?: File) => {
    if (!db) return;

    let attachmentUrl = null;
    
    if (file && storage) {
      const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(fileRef, file);
      attachmentUrl = await getDownloadURL(uploadResult.ref);
    }

    const shouldEncrypt = type === 'text';
    const finalContent = shouldEncrypt ? await encryptText(content, chatId) : (file?.name || 'File Transmission');
    
    const messageData = {
      senderId,
      senderName,
      content: finalContent,
      timestamp: Date.now(),
      type,
      isEncrypted: shouldEncrypt,
      attachmentUrl
    };

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: shouldEncrypt ? 'Encrypted Message' : `Sent a ${type}`,
        lastTimestamp: Date.now()
      });
    } catch {
      offlineStorageService.enqueue('CHAT_MESSAGE', { ...messageData, chatId });
    }

    if (content.toLowerCase().includes('@ai agent')) {
      const agentResponse = await generateSocialAgentResponse(content);
      const encryptedResponse = await encryptText(agentResponse, chatId);
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'ai-agent',
        senderName: 'AI Agent',
        content: encryptedResponse,
        timestamp: Date.now() + 500,
        type: 'text',
        isEncrypted: true
      });
    }
  },

  createGroup: async (name: string, desc: string, members: Participant[], creatorId: string) => {
    if (!db) throw new Error("Database disconnected");
    const groupId = `group_${Date.now()}`;
    const groupData = {
      participantIds: members.map(m => m.id),
      participants: members,
      groupName: name,
      groupDescription: desc,
      lastMessage: 'Group tunnel opened',
      lastTimestamp: Date.now(),
      isGroup: true,
      admins: [creatorId],
      unreadCount: 0
    };
    await setDoc(doc(db, 'chats', groupId), groupData);
    return { id: groupId, ...groupData };
  }
};
