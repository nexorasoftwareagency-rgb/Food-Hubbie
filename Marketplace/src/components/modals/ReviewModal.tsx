import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, CheckCircle2, Bike } from "lucide-react";
import { submitReview } from "@/services/reviewService";
import type { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess?: () => void;
}

export default function ReviewModal({ isOpen, onClose, order, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [riderHover, setRiderHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview(order.businessId, order.outletId, order.id, {
        userId: user?.id || "anonymous",
        userName: user?.name || "",
        userAvatar: user?.avatar || "",
        outletId: order.outletId,
        outletName: order.outletName,
        rating,
        riderRating: riderRating || undefined,
        riderId: order.riderId || order.assignedRider || undefined,
        riderName: order.riderName || undefined,
        comment,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setRating(0);
        setRiderRating(0);
        setComment("");
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRider = !!(order.riderId || order.assignedRider || order.riderName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-[2rem] overflow-hidden shadow-2xl border border-border"
          >
            {isSuccess ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-heading font-black text-foreground">Thank You!</h2>
                <p className="text-muted-foreground">Your feedback helps us improve.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                  <div>
                    <h2 className="text-xl font-heading font-black text-foreground">Rate Your Order</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.outletName}</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Outlet/Food Rating */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">How was the food?</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform active:scale-90"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= (hover || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-primary">
                      {rating === 5 ? "Amazing!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Bad" : rating === 1 ? "Terrible" : "Select rating"}
                    </p>
                  </div>

                  {/* Rider Rating (if applicable) */}
                  {hasRider && (
                    <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Rate your rider</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setRiderHover(star)}
                            onMouseLeave={() => setRiderHover(0)}
                            onClick={() => setRiderRating(star)}
                            className="p-1 transition-transform active:scale-90"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                star <= (riderHover || riderRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {riderRating > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {riderRating === 5 ? "Excellent delivery!" : riderRating === 4 ? "Great service" : riderRating === 3 ? "Good" : riderRating === 2 ? "Could be better" : "Poor experience"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Any feedback? (Optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full min-h-[100px] bg-muted/50 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>

                  <button
                    disabled={rating === 0 || isSubmitting}
                    onClick={handleSubmit}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Submit Review <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
