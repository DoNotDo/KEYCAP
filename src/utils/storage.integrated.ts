// 통합 Storage - 환경 변수에 따라 로컬 또는 Firebase 사용
import { storage as localStorage } from './storage';
import { storage as firebaseStorage } from './storage.firebase';

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || 'local';

export const storage = STORAGE_MODE === 'firebase' ? firebaseStorage : localStorage;
