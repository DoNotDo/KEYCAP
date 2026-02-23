import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth as firebaseAuth } from './firebase';
import { User } from '../types';

const COLLECTIONS = { USERS: 'users' };

const DEFAULT_USERS: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { username: 'admin', password: 'admin123', role: 'admin', status: 'active' },
  { username: '직원1', password: 'emp123', role: 'employee', branchName: '강남점', status: 'active' },
  { username: '직원2', password: 'emp123', role: 'employee', branchName: '서초점', status: 'active' },
];

const convertFirebaseUserToAppUser = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
  if (!firebaseUser) return null;
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const appUser: User = {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
      } as User;
      // 관리자는 지점이 없음 — Firestore에 잘못 저장된 branchName 무시
      if (appUser.role === 'admin') {
        appUser.branchName = undefined;
      }
      return appUser;
    }
  } catch (error) {
    console.error('Error converting Firebase user:', error);
  }
  return null;
};

export const auth = {
  initialize: async (): Promise<void> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      if (snapshot.empty) {
        for (const userData of DEFAULT_USERS) {
          try {
            const email = `${userData.username}@inventory.local`;
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, userData.password);
            const user: User = {
              ...userData,
              id: userCredential.user.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
              ...user,
              createdAt: Timestamp.fromDate(new Date(user.createdAt)),
              updatedAt: Timestamp.fromDate(new Date(user.updatedAt)),
            });
          } catch (error: any) {
            if (error.code !== 'auth/email-already-in-use') {
              console.error('Error creating default user:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || doc.data().updatedAt,
      } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  addUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const email = `${userData.username}@inventory.local`;
    const password = userData.password || 'default123';
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const newUser: User = {
      ...userData,
      id: userCredential.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, newUser.id), {
      ...newUser,
      createdAt: Timestamp.fromDate(new Date(newUser.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(newUser.updatedAt)),
    });
    return newUser;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, { ...updates, updatedAt: Timestamp.now() });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  },

  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const email = `${username}@inventory.local`;
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const appUser = await convertFirebaseUserToAppUser(userCredential.user);
      if (appUser && appUser.status === 'active') {
        localStorage.setItem('inventory_current_user', JSON.stringify(appUser));
        return appUser;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await signOut(firebaseAuth);
    localStorage.removeItem('inventory_current_user');
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('inventory_current_user');
    if (!data) return null;
    const user = JSON.parse(data) as User;
    if (user.role === 'admin') user.branchName = undefined;
    return user;
  },

  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const appUser = await convertFirebaseUserToAppUser(firebaseUser);
      callback(appUser);
    });
  },
};
