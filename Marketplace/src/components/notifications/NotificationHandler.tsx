import { useEffect } from "react";
import { listenForBroadcasts } from "@/services/notificationService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function NotificationHandler() {
  const { user } = useAuth();

  useEffect(() => {
    listenForBroadcasts((broadcast) => {
      // Check audience filtering
      let shouldShow = false;
      
      if (broadcast.audience === "all") {
        shouldShow = true;
      } else if (broadcast.audience === "new_users") {
        // Logic for new users (e.g. joined in last 24h)
        const isNew = user && (Date.now() - Date.parse(user.createdAt)) < 24 * 60 * 60 * 1000;
        if (isNew) shouldShow = true;
      } else if (broadcast.audience === "inactive_users") {
        // Logic for inactive users (e.g. no orders in last 7 days)
        // This would require order history check, simplified for now
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
  }, [user]);

  return null;
}
