import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Search, User, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface RecipientResult {
  display_name: string;
  email: string | null;
  upi_id: string | null;
  wallet_id: string;
  user_id: string;
}

const Send = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientResult | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || q.length < 3) {
      toast.error("Enter at least 3 characters to search");
      return;
    }
    setSearching(true);
    setSelectedRecipient(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, email, upi_id, wallet_id, user_id")
      .or(`email.ilike.%${q}%,upi_id.ilike.%${q}%,wallet_id.ilike.%${q}%`)
      .neq("user_id", user?.id ?? "")
      .limit(5);

    if (error) {
      toast.error("Search failed");
    } else {
      setSearchResults(data ?? []);
      if ((data ?? []).length === 0) toast("No users found with that email or UPI ID");
    }
    setSearching(false);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !amount || !user) {
      toast.error("Select a recipient and enter an amount");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    // Prioritize wallet_id for lookup
    const { data, error } = await supabase.rpc("transfer_money", {
      p_recipient_wallet_id: selectedRecipient.wallet_id || null,
      p_recipient_email: !selectedRecipient.wallet_id ? selectedRecipient.email : null,
      p_recipient_upi: (!selectedRecipient.wallet_id && !selectedRecipient.email) ? selectedRecipient.upi_id : null,
      p_amount: numAmount,
      p_method: "bank",
    });

    if (error) {
      toast.error("Transfer failed: " + error.message);
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      const result = data as Record<string, unknown>;
      if (result.success) {
        setSent(true);
        toast.success(`₹${numAmount} sent to ${result.recipient_name}!`);
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else {
        toast.error((result.error as string) || "Transfer failed");
      }
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Money Sent!</h1>
          <p className="text-muted-foreground text-sm mb-1">₹{amount} sent to</p>
          <p className="text-foreground font-semibold">{selectedRecipient?.display_name}</p>
          <Button onClick={() => navigate("/")} className="mt-8 gradient-primary text-primary-foreground rounded-2xl px-8 py-5">
            Back to Home
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
          </button>
          <h1 className="text-xl font-bold font-display text-foreground">Send Money</h1>
        </div>

        {/* Search recipient */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Find Recipient</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Wallet ID, Email, or UPI..."
                className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/40 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              size="sm"
              className="rounded-xl gradient-primary text-primary-foreground px-4"
            >
              {searching ? "..." : "Search"}
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((r) => (
                <button
                  key={r.user_id}
                  onClick={() => setSelectedRecipient(r)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedRecipient?.user_id === r.user_id
                      ? "bg-primary/15 border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.wallet_id}</p>
                    <p className="text-xs text-muted-foreground/60 truncate">{r.email || r.upi_id}</p>
                  </div>
                  {selectedRecipient?.user_id === r.user_id && (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        {selectedRecipient && (
          <>
            <div className="glass-card rounded-2xl p-5 mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={loading || !amount}
              className="w-full py-6 rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {loading ? "Processing..." : `Send ₹${amount || "0"} to ${selectedRecipient.display_name}`}
            </Button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Send;
