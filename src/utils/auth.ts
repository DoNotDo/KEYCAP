// Firebase Auth로 전환 - 사용자 데이터 영구 보존
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth as firebaseAuth } from './firebase';
import { User, UserRole } from '../types';
import { Timestamp } from 'firebase/firestore';

const COLLECTIONS = {
  USERS: 'users',
};

// 초기 테스트 사용자
const DEFAULT_USERS: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    status: 'active',
  },
  {
    username: '직원1',
    password: 'emp123',
    role: 'employee',
    branchName: '강남점',
    status: 'active',
  },
  {
    username: '직원2',
    password: 'emp123',
    role: 'employee',
    branchName: '서초점',
    status: 'active',
  },
];

// Firebase User를 앱 User로 변환
const convertFirebaseUserToAppUser = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
  if (!firebaseUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
      } as User;
    }
  } catch (error) {
    console.error('Error converting Firebase user:', error);
  }
  return null;
};

// 로컬 스토리지에서 사용자 데이터 마이그레이션
const migrateUsersFromLocalStorage = async () => {
  try {
    const migrationKey = 'firebase_users_migration_completed';
    if (localStorage.getItem(migrationKey)) {
      return;
    }

    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    if (!snapshot.empty) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    const localUsers = localStorage.getItem('inventory_users');
    if (localUsers) {
      try {
        const users: User[] = JSON.parse(localUsers);
        const batch = writeBatch(db);
        for (const user of users) {
          const userRef = doc(db, COLLECTIONS.USERS, user.id);
          batch.set(userRef, {
            ...user,
            createdAt: Timestamp.fromDate(new Date(user.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(user.updatedAt)),
          });
        }
        await batch.commit();
        localStorage.setItem(migrationKey, 'true');
      } catch (e) {
        console.error('Error migrating users:', e);
      }
    }
  } catch (error) {
    console.error('사용자 마이그레이션 오류:', error);
  }
};

// 초기화 시 마이그레이션 실행
migrateUsersFromLocalStorage();

export const auth = {
  // 초기화 (기본 사용자 생성)
  initialize: async (): Promise<void> => {
    try {
      await migrateUsersFromLocalStorage();
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      if (snapshot.empty) {
        // 기본 사용자 생성
        for (const userData of DEFAULT_USERS) {
          try {
            const email = `${userData.username}@inventory.local`;
            const userCredential = await createUserWithEmailAndPassword(
              firebaseAuth,
              email,
              userData.password
            );
            
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

  // 사용자 목록 가져오기
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

  // 사용자 저장
  saveUsers: async (users: User[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      const existingSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      existingSnapshot.docs.forEach(docRef => {
        batch.delete(docRef.ref);
      });
      users.forEach(user => {
        const userRef = doc(db, COLLECTIONS.USERS, user.id);
        batch.set(userRef, {
          ...user,
          createdAt: Timestamp.fromDate(new Date(user.createdAt)),
          updatedAt: Timestamp.fromDate(new Date(user.updatedAt)),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  },

  // 사용자 추가
  addUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      const email = `${userData.username}@inventory.local`;
      const password = userData.password || 'default123';
      
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      
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
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  // 사용자 업데이트
  updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // 사용자 삭제
  deleteUser: async (userId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // 로그인
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      // 먼저 Firestore에서 사용자 찾기 (더 간단하고 안정적)
      const users = await auth.getUsers();
      let user = users.find(
        u => u.username === username && u.password === password && u.status === 'active'
      );
      
      if (user) {
        // Firestore에서 찾은 사용자 사용
        localStorage.setItem('inventory_current_user', JSON.stringify(user));
        return user;
      }
      
      // Firestore에 없으면 Firebase Authentication 시도
      try {
        const email = `${username}@inventory.local`;
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const appUser = await convertFirebaseUserToAppUser(userCredential.user);
        if (appUser) {
          localStorage.setItem('inventory_current_user', JSON.stringify(appUser));
          return appUser;
        }
      } catch (authError: any) {
        // Firebase Authentication 실패는 무시 (Firestore 방식 사용)
        console.log('Firebase Auth login failed, using Firestore:', authError.code);
      }
      
      return null;
    } catch (error: any) {
      console.error('Login error:', error);
      return null;
    }
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    try {
      await signOut(firebaseAuth);
      localStorage.removeItem('inventory_current_user');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('inventory_current_user');
    }
  },

  // 현재 사용자 가져오기
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const firebaseUser = firebaseAuth.currentUser;
      if (firebaseUser) {
        const appUser = await convertFirebaseUserToAppUser(firebaseUser);
        if (appUser) {
          return appUser;
        }
      }
      // 로컬 스토리지 폴백
      const data = localStorage.getItem('inventory_current_user');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      const data = localStorage.getItem('inventory_current_user');
      return data ? JSON.parse(data) : null;
    }
  },

  // 인증 상태 리스너
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const appUser = await convertFirebaseUserToAppUser(firebaseUser);
      callback(appUser);
    });
  },

  // 인증 확인
  isAuthenticated: async (): Promise<boolean> => {
    const user = await auth.getCurrentUser();
    return user !== null;
  },

  // 권한 확인
  hasRole: async (role: UserRole): Promise<boolean> => {
    const user = await auth.getCurrentUser();
    return user?.role === role;
  },

  // 어드민 확인
  isAdmin: async (): Promise<boolean> => {
    return await auth.hasRole('admin');
  },
};
