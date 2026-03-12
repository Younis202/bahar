/**
 * Simple QR code generator using a public API.
 * No external library needed.
 */
interface Props {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 150, className = '' }: Props) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0a1628&color=ffffff&margin=8`;
  
  return (
    <img
      src={url}
      alt="QR Code"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
