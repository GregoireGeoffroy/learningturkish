import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';

export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
) => {
  await setDoc(doc(db, collectionName, docId), data);
};

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string,
  field?: string,
  value?: string | number | boolean | null
) => {
  const collectionRef = collection(db, collectionName);
  const q = field && value !== undefined
    ? query(collectionRef, where(field, '==', value))
    : collectionRef;
    
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data() 
  })) as (T & { id: string })[];
}; 