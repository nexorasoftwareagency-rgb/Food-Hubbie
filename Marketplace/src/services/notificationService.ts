import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { ref, set, onValue } from "firebase/database";

const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BFt7v1MvR8O_n-pT7_G_H-Y-8_M-5_R-3_E-1_S-4_P-7_O-6_N-9_K-2" // Placeholder, should be user's actual VAPID key
      });
      
      if (token) {
        console.log("FCM Token:", token);
        await set(ref(db, `users/${userId}/fcmToken`), token);
        return token;
      }
    }
  } catch (error) {
    console.error("Notification permission error:", error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      resolve(payload);
    });
  });

export const listenForBroadcasts = (callback: (broadcast: any) => void) => {
  const broadcastRef = ref(db, 'system/broadcasts');
  // Only listen for new broadcasts after the app starts
  let initialized = false;
  
  onValue(broadcastRef, (snapshot) => {
    if (!snapshot.exists()) return;
    
    // Get the most recent broadcast
    const broadcasts = snapshot.val();
    const latestId = Object.keys(broadcasts).sort().pop();
    const latest = broadcasts[latestId!];
    
    // Safety: ignore broadcasts older than 1 minute to avoid spamming on load
    const isRecent = (Date.now() - latest.sentAt) < 60000;
    
    if (initialized && isRecent) {
      callback(latest);
    }
    initialized = true;
  });
};
