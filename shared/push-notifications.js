/**
 * ============================================================
 * FOODHUBBIE SAAS — Push Notifications Module (FCM)
 * ============================================================
 * Handles sending high-priority mobile alerts to admins
 * and riders via Firebase Cloud Messaging.
 * ============================================================
 */

/**
 * Sends a push notification to a specific FCM token.
 * 
 * @param {object} admin - The initialized firebase-admin instance
 * @param {string} token - The recipient's FCM token
 * @param {object} payload - Notification details { title, body, data }
 */
async function sendPushNotification(admin, token, payload) {
    if (!token) return { success: false, error: "No token provided" };

    const message = {
        notification: {
            title: payload.title,
            body: payload.body
        },
        data: payload.data || {},
        token: token,
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                channelId: 'high_importance_channel'
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1
                }
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(`✅ [Push] Notification sent successfully: ${response}`);
        return { success: true, messageId: response };
    } catch (error) {
        console.error(`❌ [Push] Error sending notification:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a notification to all admins of a specific outlet.
 */
async function notifyAdmins(admin, db, businessId, outletId, payload) {
    try {
        const adminsSnap = await db.ref('admins').once('value');
        const admins = adminsSnap.val();
        
        if (!admins) return;

        const promises = [];
        for (const uid in admins) {
            const adminUser = admins[uid];
            // Only notify if they belong to this outlet and have a token
            if (adminUser.outlet === outletId && adminUser.fcmToken) {
                promises.push(sendPushNotification(admin, adminUser.fcmToken, payload));
            }
        }

        return Promise.all(promises);
    } catch (err) {
        console.error("❌ [Push] Failed to notify admins:", err.message);
    }
}

module.exports = {
    sendPushNotification,
    notifyAdmins
};
