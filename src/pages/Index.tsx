import BalanceCard from "@/components/BalanceCard";
import BottomNav from "@/components/BottomNav";
import { ArrowUpRight, ArrowDownLeft, Bitcoin, Landmark, ArrowDownLeft as Received, ArrowUpRight as Sent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useTransactions } from "@/hooks/useSupabase";
import { formatDistanceToNow } from "date-fns";

const QuickAction = ({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} transition-transform hover:scale-105 active:scale-95`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-xs text-muted-foreground font-medium">{label}</span>
  </button>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-xl font-bold font-display text-foreground">
              {profile?.display_name || user?.email?.split("@")[0] || "User"}
            </h1>
            {(profile as any)?.wallet_id && (
              <p className="text-xs text-muted-foreground font-mono">{(profile as any).wallet_id}</p>
            )}
          </div>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-secondary-foreground">
              {(profile?.display_name || "U")[0].toUpperCase()}
            </span>
          </button>
        </div>

        <BalanceCard />

        <div className="flex justify-around mt-6 mb-8">
          <QuickAction icon={ArrowUpRight} label="Send" color="bg-destructive/15 text-destructive" onClick={() => navigate("/send")} />
          <QuickAction icon={ArrowDownLeft} label="Receive" color="bg-primary/15 text-primary" onClick={() => navigate("/receive")} />
          <QuickAction icon={Bitcoin} label="Bitcoin" color="gradient-bitcoin text-bitcoin-foreground" onClick={() => navigate("/send")} />
          <QuickAction icon={Landmark} label="Bank" color="bg-secondary text-secondary-foreground" onClick={() => navigate("/receive")} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-display text-foreground">Recent Transactions</h2>
          </div>
          <div className="glass-card rounded-2xl px-4 divide-y divide-border">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No transactions yet. Start sending or receiving money!
              </div>
            ) : (
              transactions.map((tx) => {
                const isSent = tx.type === "sent";
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.method === "bitcoin" ? "gradient-bitcoin" : isSent ? "bg-destructive/15" : "bg-primary/15"
                    }`}>
                      {tx.method === "bitcoin" ? (
                        <Bitcoin className="w-5 h-5 text-bitcoin-foreground" />
                      ) : isSent ? (
                        <Sent className="w-5 h-5 text-destructive" />
                      ) : (
                        <Received className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.recipient_name || (isSent ? "Sent" : "Received")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${isSent ? "text-destructive" : "text-primary"}`}>
                      {isSent ? "-" : "+"}{tx.amount}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
