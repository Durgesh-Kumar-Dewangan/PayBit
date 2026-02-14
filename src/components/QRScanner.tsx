import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader";

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {} // ignore scan failures (no QR found in frame)
      );
      setIsScanning(true);
      setHasPermission(true);
    } catch (err: any) {
      setHasPermission(false);
      onError?.(err?.message || "Camera access denied");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="w-full">
      <div id={containerId} className="w-full rounded-2xl overflow-hidden" />
      {hasPermission === false && (
        <div className="text-center py-8">
          <p className="text-destructive text-sm mb-3">Camera access denied</p>
          <button
            onClick={startScanning}
            className="text-primary text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
