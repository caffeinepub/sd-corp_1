import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Labour,
  Site,
  SiteStatus,
  Transaction,
  TransactionType,
  WorkProgress,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Sites ────────────────────────────────────────────────────

export function useGetAllSites() {
  const { actor, isFetching } = useActor();
  return useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSite(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Site>({
    queryKey: ["site", id?.toString()],
    queryFn: async () => {
      if (!actor || !id) throw new Error("No actor or id");
      return actor.getSite(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateSite() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      clientName: string;
      location: string;
      startDate: bigint;
      expectedEndDate: bigint;
      totalAmount: number;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createSite(
        data.name,
        data.clientName,
        data.location,
        data.startDate,
        data.expectedEndDate,
        data.totalAmount,
        data.notes,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

export function useUpdateSite() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      clientName: string;
      location: string;
      startDate: bigint;
      expectedEndDate: bigint;
      totalAmount: number;
      notes: string;
      status: SiteStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateSite(
        data.id,
        data.name,
        data.clientName,
        data.location,
        data.startDate,
        data.expectedEndDate,
        data.totalAmount,
        data.notes,
        data.status,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["site", vars.id.toString()] });
    },
  });
}

export function useDeleteSite() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteSite(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

// ── Transactions ─────────────────────────────────────────────

export function useGetTransactionsBySiteId(siteId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", siteId?.toString()],
    queryFn: async () => {
      if (!actor || !siteId) return [];
      return actor.getTransactionsBySiteId(siteId);
    },
    enabled: !!actor && !isFetching && siteId !== null,
  });
}

export function useCreateTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteId: bigint;
      date: bigint;
      transactionType: TransactionType;
      amount: number;
      paymentMode: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTransaction(
        data.siteId,
        data.date,
        data.transactionType,
        data.amount,
        data.paymentMode,
        data.notes,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({
        queryKey: ["transactions", vars.siteId.toString()],
      });
    },
  });
}

export function useDeleteTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      siteId: _siteId,
    }: { id: bigint; siteId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTransaction(id);
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({
        queryKey: ["transactions", vars.siteId.toString()],
      });
    },
  });
}

// ── Labour ───────────────────────────────────────────────────

export function useGetLaboursBySiteId(siteId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Labour[]>({
    queryKey: ["labours", siteId?.toString()],
    queryFn: async () => {
      if (!actor || !siteId) return [];
      return actor.getLaboursBySiteId(siteId);
    },
    enabled: !!actor && !isFetching && siteId !== null,
  });
}

export function useCreateLabour() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteId: bigint;
      name: string;
      phone: string;
      workType: string;
      dailyWage: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createLabour(
        data.siteId,
        data.name,
        data.phone,
        data.workType,
        data.dailyWage,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["labours", vars.siteId.toString()] });
    },
  });
}

export function useUpdateLabour() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      siteId: bigint;
      name: string;
      phone: string;
      workType: string;
      dailyWage: number;
      totalPaid: number;
      pendingPayment: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateLabour(
        data.id,
        data.name,
        data.phone,
        data.workType,
        data.dailyWage,
        data.totalPaid,
        data.pendingPayment,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["labours", vars.siteId.toString()] });
    },
  });
}

export function useDeleteLabour() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      siteId: _siteId,
    }: { id: bigint; siteId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteLabour(id);
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["labours", vars.siteId.toString()] });
    },
  });
}

// ── Work Progress ────────────────────────────────────────────

export function useGetWorkProgressBySiteId(siteId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<WorkProgress[]>({
    queryKey: ["workProgress", siteId?.toString()],
    queryFn: async () => {
      if (!actor || !siteId) return [];
      return actor.getWorkProgressBySiteId(siteId);
    },
    enabled: !!actor && !isFetching && siteId !== null,
  });
}

export function useCreateWorkProgress() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteId: bigint;
      taskName: string;
      progressPercent: number;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createWorkProgress(
        data.siteId,
        data.taskName,
        data.progressPercent,
        data.notes,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({
        queryKey: ["workProgress", vars.siteId.toString()],
      });
    },
  });
}

export function useUpdateWorkProgress() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      siteId: bigint;
      taskName: string;
      progressPercent: number;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateWorkProgress(
        data.id,
        data.taskName,
        data.progressPercent,
        data.notes,
      );
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({
        queryKey: ["workProgress", vars.siteId.toString()],
      });
    },
  });
}
