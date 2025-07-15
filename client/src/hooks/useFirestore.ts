import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useFirestore = (collectionName: string) => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const collectionRef = collection(db, collectionName);
    const q = query(
      collectionRef,
      where('uid', '==', currentUser.uid),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, collectionName]);

  const addDocument = async (data: any) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const docData = {
        ...data,
        uid: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false
      };

      await addDoc(collection(db, collectionName), docData);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add document');
    }
  };

  const updateDocument = async (id: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update document');
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      // Get the document first to move to recycle bin
      const docToDelete = documents.find(doc => doc.id === id);
      if (!docToDelete) throw new Error('Document not found');

      // Move to recycle bin
      const recycleBinData = {
        uid: currentUser?.uid,
        originalId: id,
        type: collectionName.slice(0, -1), // Remove 's' from collection name
        data: docToDelete,
        deletedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false
      };

      await addDoc(collection(db, 'recycle_bin'), recycleBinData);

      // Mark as deleted in original collection
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument
  };
};
