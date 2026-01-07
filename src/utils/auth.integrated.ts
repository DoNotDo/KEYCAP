// 통합 Auth - 환경 변수에 따라 로컬 또는 Firebase 사용
import { auth as localAuth } from './auth';
import { auth as firebaseAuth } from './auth.firebase';

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || 'local';

export const auth = STORAGE_MODE === 'firebase' ? firebaseAuth : localAuth;
