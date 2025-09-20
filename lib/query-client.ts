"use client";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient()

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

export function presenceQueryKey(roomId: string, month?: string) {
    return month ? ["presence", roomId, month] : ["presence", roomId];
}