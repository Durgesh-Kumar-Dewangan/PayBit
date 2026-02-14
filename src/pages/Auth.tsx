import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowRight, Wallet, Bitcoin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

const Auth = () => {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

  // Diamond welcome screen
  if (!showEmailForm) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold font-display text-foreground mb-2"
          >
            Choose Sign Up / Sign In
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-muted-foreground mb-12"
          >
            Select your preferred method
          </motion.p>

          {/* Diamond layout */}
          <div className="relative w-64 h-64 mb-12">
            {/* Connecting lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
              <line x1="128" y1="32" x2="32" y2="128" stroke="hsl(var(--border))" strokeWidth="2" />
              <line x1="128" y1="32" x2="224" y2="128" stroke="hsl(var(--border))" strokeWidth="2" />
              <line x1="32" y1="128" x2="128" y2="224" stroke="hsl(var(--border))" strokeWidth="2" />
              <line x1="224" y1="128" x2="128" y2="224" stroke="hsl(var(--border))" strokeWidth="2" />
              {/* Lines to center */}
              <line x1="128" y1="32" x2="128" y2="128" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <line x1="32" y1="128" x2="128" y2="128" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <line x1="224" y1="128" x2="128" y2="128" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <line x1="128" y1="224" x2="128" y2="128" stroke="hsl(var(--border))" strokeWidth="1.5" />
            </svg>

            {/* Center - Wallet icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg z-10"
            >
              <Wallet className="w-7 h-7 text-foreground" />
            </motion.div>

            {/* Top - Google */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              onClick={handleGoogleSignIn}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all z-10"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </motion.button>

            {/* Left - Email */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              onClick={() => setShowEmailForm(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all z-10"
            >
              <Mail className="w-7 h-7 text-primary" />
            </motion.button>

            {/* Right - UPI */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md opacity-50 z-10"
              title="Coming soon"
            >
              <span className="text-xs font-bold text-muted-foreground">UPI</span>
            </motion.div>

            {/* Bottom - Bitcoin */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-orange-500 border-2 border-orange-400 flex items-center justify-center shadow-md opacity-50 z-10"
              title="Coming soon"
            >
              <Bitcoin className="w-7 h-7 text-white" />
            </motion.div>
          </div>

          {/* Labels */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Tap <strong>Google</strong> or <strong>Email</strong> to get started</p>
            <p className="text-xs text-muted-foreground/60">UPI & Bitcoin coming soon</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Email form
  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowEmailForm(false)}
              className="self-start mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← Back
            </motion.button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-primary shadow-lg mb-4"
            >
              <Mail className="w-7 h-7 text-primary-foreground" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-display text-foreground"
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {isLogin ? "Sign in with your email" : "Start sending & receiving money"}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailSubmit}
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
                  placeholder="Email"
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
