import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebaseConfig';

export async function createConversation(title: string) {
  const user = auth.currentUser;
  console.log("createConversation user:", user);
  if (!user) throw new Error("Not authenticated");
  const convRef = collection(db, 'users', user.uid, 'conversations');
  const docRef = await addDoc(convRef, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function addMessage(conversationId: string, message: { role: string, content: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const msgRef = collection(db, 'users', user.uid, 'conversations', conversationId, 'messages');
  await addDoc(msgRef, {
    ...message,
    timestamp: new Date(),
  });
  // Update the parent conversation's updatedAt field
  const convDocRef = doc(db, 'users', user.uid, 'conversations', conversationId);
  await updateDoc(convDocRef, { updatedAt: serverTimestamp() });
}

export async function updateConversationTitle(conversationId: string, title: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const convDocRef = doc(db, 'users', user.uid, 'conversations', conversationId);
  await updateDoc(convDocRef, { title, updatedAt: serverTimestamp() });
}

export function listenToConversations(callback: (convs: any[]) => void) {
  const user = auth.currentUser;
  console.log("listenToConversations user:", user);
  if (!user) return;
  const convRef = collection(db, 'users', user.uid, 'conversations');
  const convQuery = query(convRef, orderBy('updatedAt', 'desc'));
  return onSnapshot(convQuery, (snapshot) => {
    const convs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(conv => (conv as any).updatedAt); // Optional: filter out chats missing updatedAt
    callback(convs);
  });
}

export function listenToMessages(conversationId: string, callback: (msgs: any[]) => void) {
  const user = auth.currentUser;
  if (!user) return;
  const msgRef = collection(db, 'users', user.uid, 'conversations', conversationId, 'messages');
  const q = query(msgRef, orderBy('timestamp'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
}

export async function deleteConversation(conversationId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  // Delete all messages in the conversation
  const messagesRef = collection(db, 'users', user.uid, 'conversations', conversationId, 'messages');
  const messagesSnap = await getDocs(messagesRef);
  for (const msgDoc of messagesSnap.docs) {
    await deleteDoc(msgDoc.ref);
  }
  // Delete the conversation document
  const convDocRef = doc(db, 'users', user.uid, 'conversations', conversationId);
  await deleteDoc(convDocRef);
} 