const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

exports.sendNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot) => {
    const notification = snapshot.data();
    if (!notification) {
      return null;
    }

    const tokensSnapshot = await db
      .collection('deviceTokens')
      .where('branchName', '==', notification.branchName || '')
      .get();

    const tokens = tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(Boolean);

    if (tokens.length === 0) {
      return null;
    }

    const payload = {
      notification: {
        title: notification.title || '새 알림',
        body: notification.message || '',
      },
      data: {
        type: notification.type || '',
        branchName: notification.branchName || '',
        notificationId: snapshot.id,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    const cleanupPromises = [];
    response.responses.forEach((res, index) => {
      if (!res.success) {
        const error = res.error;
        const token = tokens[index];
        if (
          error &&
          (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token')
        ) {
          cleanupPromises.push(db.collection('deviceTokens').doc(token).delete());
        }
      }
    });

    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
    }

    return null;
  });
