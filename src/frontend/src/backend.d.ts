import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_header {
    value: string;
    name: string;
}
export interface Job {
    id: string;
    status: string;
    userId: Principal;
    createdAt: bigint;
    errorMessage?: string;
    enhancementType: string;
    scale: bigint;
    updatedAt: bigint;
    resultBlobId?: string;
    originalBlobId: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UserProfile {
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteJob(jobId: string): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getJob(jobId: string): Promise<Job | null>;
    getStats(): Promise<{
        completedJobs: bigint;
        totalJobs: bigint;
        failedJobs: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listMyJobs(): Promise<Array<Job>>;
    processJob(jobId: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitJob(originalBlobId: string, enhancementType: string, scale: bigint): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
