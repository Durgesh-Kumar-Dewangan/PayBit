import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Copy, Share2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useSupabase";
import { QRCodeSVG } from "qrcode.react";

const Receive = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [tab, setTab] = useState<"wallet" | "email" | "upi" | "bank" | "bitcoin">("wallet");
  const [copied, setCopied] = useState(false);

  const walletId = (profile as any)?.wallet_id || "Not set";
  const userEmail = profile?.email || "Not set";
  const upiId = profile?.upi_id || "Not set";
  const bankDetails = {
    name: profile?.display_name || "Not set",
    account: profile?.bank_account || "Not set",
    ifsc: profile?.bank_ifsc || "Not set",
    bank: profile?.bank_name || "Not set",
  };
  const btcAddress = profile?.bitcoin_address || "Not set";

  const isConfigured = (val: string) => val !== "Not set" && val !== "";

  const getQRValue = () => {
    if (tab === "wallet" && isConfigured(walletId)) return `wallet:${walletId}`;
    if (tab === "email" && isConfigured(userEmail)) return `pay:${userEmail}`;
    if (tab === "upi" && isConfigured(upiId)) return `upi://pay?pa=${upiId}&pn=${profile?.display_name || ""}`;
    if (tab === "bank" && isConfigured(bankDetails.account)) return `bank://${bankDetails.account}/${bankDetails.ifsc}`;
    if (tab === "bitcoin" && isConfigured(btcAddress)) return `bitcoin:${btcAddress}`;
    return "";
  };

  const copyToClipboard = (text: string) => {
    if (!isConfigured(text)) {
      toast.error("Please set up your details in Profile first");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "wallet" as const, label: "Wallet ID" },
    { id: "email" as const, label: "Email" },
    { id: "upi" as const, label: "UPI" },
    { id: "bank" as const, label: "Bank" },
    { id: "bitcoin" as const, label: "Bitcoin" },
  ];

  const qrValue = getQRValue();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
          </button>
          <h1 className="text-xl font-bold font-display text-foreground">Receive Money</h1>
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 text-center mb-4">
          {qrValue ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Scan to pay via {tab === "wallet" ? "Wallet ID" : tab === "email" ? "Email" : tab === "upi" ? "UPI" : tab === "bank" ? "Bank" : "Bitcoin"}
              </p>
              <p className="text-xs text-muted-foreground mb-2">The sender can look you up using this in the Send page</p>
              <div className="bg-foreground rounded-2xl p-4 inline-block">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  bgColor="hsl(0, 0%, 95%)"
                  fgColor="hsl(220, 20%, 7%)"
                  level="M"
                />
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-muted-foreground text-sm mb-3">
                {tab === "upi" ? "UPI ID" : tab === "bank" ? "Bank details" : "Bitcoin address"} not configured
              </p>
              <button onClick={() => navigate("/profile")} className="text-primary text-sm font-medium">
                Set up in Profile →
              </button>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          {tab === "wallet" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Wallet ID</p>
                <p className="text-base font-bold font-mono text-foreground mt-1">{walletId}</p>
                <p className="text-xs text-muted-foreground mt-1">Share this ID to receive payments</p>
              </div>
              <button onClick={() => copyToClipboard(walletId)} className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
              </button>
            </div>
          )}
          {tab === "email" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-base font-medium text-foreground mt-1">{userEmail}</p>
                <p className="text-xs text-muted-foreground mt-1">Others can send you money using this email</p>
              </div>
              <button onClick={() => copyToClipboard(userEmail)} className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
              </button>
            </div>
          )}
          {tab === "upi" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">UPI ID</p>
                <p className="text-base font-medium text-foreground mt-1">{upiId}</p>
              </div>
              <button onClick={() => copyToClipboard(upiId)} className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
              </button>
            </div>
          )}
          {tab === "bank" && (
            <div className="space-y-3">
              {Object.entries(bankDetails).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value)} className="text-primary">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {tab === "bitcoin" && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Bitcoin Address</p>
              <p className="text-sm font-mono text-foreground mt-1 break-all">{btcAddress}</p>
              <button onClick={() => copyToClipboard(btcAddress)} className="mt-3 flex items-center gap-2 text-sm text-primary font-medium">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            const text = tab === "wallet" ? walletId : tab === "email" ? userEmail : tab === "upi" ? upiId : tab === "bank" ? `${bankDetails.name} | ${bankDetails.account} | ${bankDetails.ifsc}` : btcAddress;
            if (navigator.share && isConfigured(text)) {
              navigator.share({ title: "Payment Details", text });
            } else {
              copyToClipboard(text);
            }
          }}
          className="w-full mt-4 py-4 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share Payment Details
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Receive;
