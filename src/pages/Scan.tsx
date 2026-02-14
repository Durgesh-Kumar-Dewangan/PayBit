import BottomNav from "@/components/BottomNav";
import QRScanner from "@/components/QRScanner";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

const Scan = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScan = (result: string) => {
    toast.success("QR Code scanned!");
    // Parse UPI QR
    if (result.startsWith("upi://")) {
      const params = new URLSearchParams(result.split("?")[1]);
      const pa = params.get("pa") || "";
      const pn = params.get("pn") || "";
      navigate("/send", { state: { method: "bank", address: pa, recipientName: pn } });
    } else if (result.startsWith("bitcoin:")) {
      const addr = result.replace("bitcoin:", "").split("?")[0];
      navigate("/send", { state: { method: "bitcoin", address: addr } });
    } else {
      // Treat as generic address
      navigate("/send", { state: { address: result } });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode("qr-file-scanner");
      const result = await scanner.scanFile(file, true);
      handleScan(result);
    } catch {
      toast.error("No QR code found in the image");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
          </button>
          <h1 className="text-xl font-bold font-display text-foreground">Scan QR Code</h1>
        </div>

        <div className="rounded-2xl overflow-hidden mb-4">
          <QRScanner onScan={handleScan} onError={(err) => toast.error(err)} />
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Point your camera at a UPI or Bitcoin QR code
        </p>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-4 rounded-2xl glass-card text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          <ImageIcon className="w-4 h-4" /> Upload QR from Gallery
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <div id="qr-file-scanner" className="hidden" />
      </div>
      <BottomNav />
    </div>
  );
};

export default Scan;
