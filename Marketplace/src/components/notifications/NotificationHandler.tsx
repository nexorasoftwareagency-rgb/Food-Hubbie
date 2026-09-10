import { useEffect } from "react";
import { listenForBroadcasts } from "@/services/notificationService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function NotificationHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = listenForBroadcasts((broadcast) => {
      let shouldShow = false;
      
      if (broadcast.audience === "all") {
        shouldShow = true;
      } else if (broadcast.audience === "new_users") {
        const isNew = user && (Date.now() - Date.parse(user.createdAt)) < 24 * 60 * 60 * 1000;
        if (isNew) shouldShow = true;
      } else if (broadcast.audience === "inactive_users") {
        shouldShow = true;
      }

      if (shouldShow) {
        toast(broadcast.title, {
          description: broadcast.body,
          duration: 10000,
          action: broadcast.imageUrl ? {
            label: "View Offer",
            onClick: () => console.log("Image clicked:", broadcast.imageUrl)
          } : undefined
        });
      }
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, [user]);

  return null;
}
