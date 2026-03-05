import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Dataset {
    id: bigint;
    status: DatasetStatus;
    ownerId: Principal;
    blob: ExternalBlob;
    hash: string;
    name: string;
    createdAt: bigint;
    externalTrainingUrl?: string;
    qualityPercentage: number;
}
export interface ProofMissing {
    durationAvailable: bigint;
    message: string;
}
export interface UserProfile {
    name: string;
}
export interface Metrics {
    precision: number;
    recall: number;
    accuracy: number;
}
export enum DatasetStatus {
    verified = "verified",
    rejected = "rejected",
    compromised = "compromised"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteDataset(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDataset(id: bigint): Promise<Dataset>;
    getDatasets(): Promise<Array<Dataset>>;
    getExternalTrainingLink(datasetId: bigint): Promise<{
        url: string;
        token?: string;
        proofMissing?: ProofMissing;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setExternalTrainingUrl(url: string): Promise<void>;
    trainModel(datasetId: bigint): Promise<{
        metrics: Array<Metrics | null>;
        datasetIdResult?: bigint;
    }>;
    uploadDataset(name: string, blob: ExternalBlob): Promise<{
        datasetId?: bigint;
        hash: string;
        message: string;
        qualityPercentage: number;
        _success: boolean;
    }>;
}
