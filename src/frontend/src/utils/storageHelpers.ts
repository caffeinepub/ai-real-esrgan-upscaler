import { HttpAgent } from "@icp-sdk/core/agent";
import { loadConfig } from "../config";
import { StorageClient } from "./StorageClient";

let instance: StorageClient | null = null;
let instancePromise: Promise<StorageClient> | null = null;

export async function getStorageClientInstance(): Promise<StorageClient> {
  if (instance) return instance;
  if (!instancePromise) {
    instancePromise = loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      instance = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      return instance;
    });
  }
  return instancePromise;
}
