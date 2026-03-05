import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type { Dataset, Metrics, UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ── Query: Get all datasets ──────────────────────────────────────────────────
export function useDatasets() {
  const { actor, isFetching } = useActor();
  return useQuery<Dataset[]>({
    queryKey: ["datasets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDatasets();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Query: Get single dataset ────────────────────────────────────────────────
export function useDataset(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Dataset>({
    queryKey: ["dataset", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error("No actor or id");
      return actor.getDataset(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

// ── Query: Is caller admin ───────────────────────────────────────────────────
export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Query: Get caller role ───────────────────────────────────────────────────
export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return "guest" as UserRole;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutation: Upload dataset ─────────────────────────────────────────────────
export function useUploadDataset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      file,
      onProgress,
    }: {
      name: string;
      file: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Not connected");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.uploadDataset(name, blob);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

// ── Mutation: Train model ────────────────────────────────────────────────────
export function useTrainModel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datasetId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.trainModel(datasetId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

// ── Mutation: Delete dataset ─────────────────────────────────────────────────
export function useDeleteDataset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteDataset(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

// ── Mutation: Set external training URL ─────────────────────────────────────
export function useSetExternalTrainingUrl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.setExternalTrainingUrl(url);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

// ── Query: Get external training link ────────────────────────────────────────
export function useExternalTrainingLink(datasetId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<{ url: string; token?: string }>({
    queryKey: ["externalLink", datasetId?.toString()],
    queryFn: async () => {
      if (!actor || datasetId === null) throw new Error("No actor or id");
      return actor.getExternalTrainingLink(datasetId);
    },
    enabled: !!actor && !isFetching && datasetId !== null,
  });
}

// Re-export Metrics type for convenience
export type { Metrics };
