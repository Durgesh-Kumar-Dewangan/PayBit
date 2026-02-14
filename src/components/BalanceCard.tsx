import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/useSupabase";

const BalanceCard = () => {
  const [visible, setVisible] = useState(true);
  const { data: profile } = useProfile();
  const dailyBalance = (profile as any)?.daily_balance ?? 200;

  return (
    <div className="rounded-2xl p-5 gradient-primary glow-primary">
      <div className="flex items-center justify-between mb-1">
        <span className="text-primary-foreground/70 text-sm font-medium">Daily Balance</span>
        <button onClick={() => setVisible(!visible)} className="text-primary-foreground/70 hover:text-primary-foreground">
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      <div className="mb-3">
        <span className="text-3xl font-bold font-display text-primary-foreground">
          {visible ? `₹${Number(dailyBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "••••••"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-primary-foreground/15 rounded-full px-2 py-0.5">
          <RefreshCw className="w-3 h-3 text-primary-foreground" />
          <span className="text-xs text-primary-foreground font-medium">₹200 renews daily</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
