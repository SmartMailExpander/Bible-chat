import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { app } from "../../firebaseConfig";

const db = getFirestore(app);

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  verse?: string;
  userId: string;
}

export async function getUserJournals(userId: string): Promise<JournalEntry[]> {
  try {
    const q = query(
      collection(db, "journals"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as JournalEntry));
  } catch (error) {
    console.error("Error fetching journals:", error);
    return [];
  }
}

export async function addJournalEntry(entry: Omit<JournalEntry, "id">): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "journals"), entry);
    return docRef.id;
  } catch (error) {
    console.error("Error adding journal entry:", error);
    return null;
  }
}

export async function updateJournalEntry(entryId: string, updatedData: Partial<JournalEntry>): Promise<boolean> {
  try {
    const docRef = doc(db, "journals", entryId);
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return false;
  }
}

export async function deleteJournalEntry(entryId: string): Promise<boolean> {
  try {
    const docRef = doc(db, "journals", entryId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return false;
  }
} 