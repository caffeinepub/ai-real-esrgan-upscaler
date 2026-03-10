import { HttpAgent } from "@icp-sdk/core/agent";
import { useRef } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

let storageClientInstance: StorageClient | null = null;
let storageClientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (storageClientInstance) return storageClientInstance;
  if (!storageClientPromise) {
    storageClientPromise = loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      storageClientInstance = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      return storageClientInstance;
    });
  }
  return storageClientPromise;
}

export function useStorage() {
  const uploadFile = async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string> => {
    const client = await getStorageClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await client.putFile(bytes, onProgress);
    return hash;
  };

  const getFileUrl = async (hash: string): Promise<string> => {
    const client = await getStorageClient();
    return client.getDirectURL(hash);
  };

  return { uploadFile, getFileUrl };
}

export function useImageUrl(hash: string | undefined) {
  const urlRef = useRef<string | null>(null);
  return {
    getUrl: async () => {
      if (!hash) return null;
      if (urlRef.current) return urlRef.current;
      const client = await getStorageClient();
      urlRef.current = await client.getDirectURL(hash);
      return urlRef.current;
    },
  };
}
