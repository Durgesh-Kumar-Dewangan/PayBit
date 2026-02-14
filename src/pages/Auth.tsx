import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowRight, Wallet, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else if (data.session) {
        toast.success("Account created! Welcome!");
        navigate("/");
      } else {
        toast.success("Check your email to verify your account!");
      }
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Icon cluster */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 mb-6">
              {/* Center icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-primary shadow-lg"
              >
                <Wallet className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              {/* Orbiting icons */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md"
              >
                <Shield className="w-5 h-5 text-primary" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="absolute bottom-0 left-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md"
              >
                <Mail className="w-5 h-5 text-accent" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md"
              >
                <Lock className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold font-display text-foreground"
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {isLogin ? "Sign in to your wallet" : "Start sending & receiving money"}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                    className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50 text-sm"
                  />
                </div>
              )}
              <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email or Wallet ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50 text-sm"
                />
              </div>
              <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-2xl gradient-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium"
            >
              {isLogin ? "Create new" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Auth;
