import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from './firebase';
import { storage } from './storage';
import { DeviceToken, User } from '../types';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export const checkNotificationSupport = async (): Promise<boolean> => {
  try {
    return await isSupported();
  } catch (error) {
    console.error('Notification support check failed:', error);
    return false;
  }
};

export const registerForNotifications = async (user: User | null): Promise<string> => {
  if (!user) {
    throw new Error('로그인 사용자 정보가 필요합니다.');
  }
  if (!app) {
    throw new Error('Firebase 초기화에 실패했습니다.');
  }
  if (!vapidKey) {
    throw new Error('VAPID 키가 설정되지 않았습니다.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('알림 권한이 거부되었습니다.');
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error('푸시 토큰을 가져오지 못했습니다.');
  }

  const deviceToken: DeviceToken = {
    id: token,
    token,
    userId: user.id,
    branchName: user.branchName,
    role: user.role,
    platform: navigator.userAgent,
    updatedAt: new Date().toISOString(),
  };
  await storage.saveDeviceToken(deviceToken);
  return token;
};

export const listenForForegroundMessages = async (
  onMessageReceived: (payload: { title?: string; body?: string }) => void
) => {
  const supported = await checkNotificationSupport();
  if (!supported || !app) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title;
    const body = payload.notification?.body;
    onMessageReceived({ title, body });
  });
};
