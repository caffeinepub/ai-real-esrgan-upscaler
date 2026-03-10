import { useEffect, useState } from "react";
import { getStorageClientInstance } from "../utils/storageHelpers";

interface ImageFromHashProps {
  hash: string | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function ImageFromHash({
  hash,
  alt = "",
  className,
  fallback,
}: ImageFromHashProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hash) return;
    setError(false);
    getStorageClientInstance()
      .then((client) => client.getDirectURL(hash))
      .then(setUrl)
      .catch(() => setError(true));
  }, [hash]);

  if (!hash || error) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground text-xs ${className ?? ""}`}
      >
        No image
      </div>
    );
  }

  if (!url) {
    return <div className={`shimmer ${className ?? ""}`} />;
  }

  return <img src={url} alt={alt} className={className} />;
}
