"use client";
import { QueryClient } from "@tanstack/react-query";
import { toYYYYMM } from "./utils";

export const queryClient = new QueryClient();

export function userRoomsQueryKey() {
    return ["user-rooms"];
}

export function roomQueryKey(roomId: string) {
    return ["room", roomId];
}

export function roommatesQueryKey(roomId: string) {
    return ["roommates", roomId];
}

export function invoicesQueryKey(roomId: string) {
    return ["invoices", roomId];
}

export function paidInvoicesQueryKey(roomId: string) {
    return ["paid-invoices", roomId];
}

export function presenceQueryKey(roomId: string, month?: string) {
    return month ? ["presence", roomId, month] : ["presence", roomId];
}

export function invalidateAllRoomQuery(roomId: string) {
    queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });

    queryClient.invalidateQueries({
        queryKey: roommatesQueryKey(roomId),
    });
    queryClient.invalidateQueries({
        queryKey: invoicesQueryKey(roomId),
    });
    queryClient.invalidateQueries({
        queryKey: paidInvoicesQueryKey(roomId),
    });
    queryClient.invalidateQueries({
        queryKey: presenceQueryKey(roomId),
    });
    queryClient.invalidateQueries({
        queryKey: presenceQueryKey(roomId, toYYYYMM(new Date())),
    });
}
