import BottomNav from "@/components/BottomNav";
import { ArrowLeft, LogOut, Save, Palette, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useSupabase";
import { useTheme, themes, ThemeName } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { theme, setTheme, colorMode, toggleColorMode } = useTheme();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    upi_id: "",
    bank_name: "",
    bank_account: "",
    bank_ifsc: "",
    bitcoin_address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        phone: profile.phone || "",
        upi_id: profile.upi_id || "",
        bank_name: profile.bank_name || "",
        bank_account: profile.bank_account || "",
        bank_ifsc: profile.bank_ifsc || "",
        bitcoin_address: profile.bitcoin_address || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const fields = [
    { key: "display_name", label: "Display Name", placeholder: "Your name" },
    { key: "phone", label: "Phone", placeholder: "+91 XXXXX XXXXX" },
    { key: "upi_id", label: "UPI ID", placeholder: "yourname@upi" },
    { key: "bank_name", label: "Bank Name", placeholder: "State Bank" },
    { key: "bank_account", label: "Account Number", placeholder: "1234 5678 9012" },
    { key: "bank_ifsc", label: "IFSC Code", placeholder: "SBIN0001234" },
    { key: "bitcoin_address", label: "Bitcoin Address", placeholder: "bc1q..." },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
          </button>
          <h1 className="text-xl font-bold font-display text-foreground">Profile</h1>
          <div className="flex-1" />
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">Edit</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-sm text-primary font-medium">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">
              {(form.display_name || user?.email || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold font-display text-foreground">{form.display_name || "User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="glass-card rounded-2xl p-4 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Payment Details</h3>
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              {editing ? (
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {form[key as keyof typeof form] || <span className="text-muted-foreground">Not set</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Dark / Light Mode Toggle */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {colorMode === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {colorMode === "dark" ? "Dark Mode" : "Light Mode"}
              </h3>
            </div>
            <button
              onClick={toggleColorMode}
              className="w-12 h-7 rounded-full bg-secondary relative transition-colors"
            >
              <div className={`w-5 h-5 rounded-full bg-primary absolute top-1 transition-all ${colorMode === "dark" ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Color Theme</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(themes) as [ThemeName, typeof themes[ThemeName]][]).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                  theme === key
                    ? "bg-primary/15 border border-primary/30 ring-1 ring-primary/20"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: t.preview }} />
                <span className="text-xs font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-destructive/10 text-destructive font-medium text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
      <BottomNav />
    </div>
    </PageTransition>
  );
};

export default Profile;
