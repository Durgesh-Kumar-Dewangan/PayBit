import { ArrowDownLeft, ArrowUpRight, Bitcoin } from "lucide-react";

interface Transaction {
  id: string;
  type: "sent" | "received";
  method: "bitcoin" | "upi" | "bank";
  amount: string;
  name: string;
  time: string;
}

const TransactionItem = ({ type, method, amount, name, time }: Transaction) => {
  const isSent = type === "sent";

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        method === "bitcoin" ? "gradient-bitcoin" : isSent ? "bg-destructive/15" : "bg-primary/15"
      }`}>
        {method === "bitcoin" ? (
          <Bitcoin className="w-5 h-5 text-bitcoin-foreground" />
        ) : isSent ? (
          <ArrowUpRight className="w-5 h-5 text-destructive" />
        ) : (
          <ArrowDownLeft className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <span className={`text-sm font-semibold ${isSent ? "text-destructive" : "text-primary"}`}>
        {isSent ? "-" : "+"}{amount}
      </span>
    </div>
  );
};

export default TransactionItem;
export type { Transaction };
