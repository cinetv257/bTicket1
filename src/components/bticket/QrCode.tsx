import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#131642", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => setSrc(""));
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-surface-container-lowest p-3 shadow-soft"
      style={{ width: size + 24, height: size + 24 }}
    >
      {src ? (
        <img src={src} alt={`QR code du ticket ${value}`} width={size} height={size} />
      ) : (
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
      )}
    </div>
  );
}
