import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/profile");
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // No setLocation here! The browser will redirect.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-muted/30 to-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Abstract background glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-lg shadow-primary/20 rotate-6">
            <UtensilsCrossed className="h-10 w-10 text-primary-foreground -rotate-6" />
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-10">Sign in to your Foodhubbie account to continue your delicious journey.</p>

          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-background border border-border hover:border-primary/30 hover:bg-muted/50 py-4 rounded-2xl font-bold flex items-center justify-center gap-4 transition-all shadow-sm group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FcGoogle className="h-6 w-6" />
                  <span className="text-foreground group-hover:text-primary transition-colors">Continue with Google</span>
                </>
              )}
            </motion.button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Or guest mode</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/")}
              className="w-full bg-muted/50 hover:bg-muted py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-muted-foreground transition-all"
            >
              Browse as Guest
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>

          <p className="mt-10 text-xs text-muted-foreground px-4">
            By signing in, you agree to our <span className="text-primary font-semibold cursor-pointer">Terms of Service</span> and <span className="text-primary font-semibold cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
