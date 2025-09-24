"use client";
import { ROOM_MAX_MEMBERS_LIMIT } from "@/lib/app-constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRoomQuery } from "./contexts/room-context";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient, roomQueryKey } from "@/lib/query-client";
import { handleAction } from "@/lib/action-handler";
import { updateRoomData } from "@/lib/actions/room";

const roomDataFormSchema = z.object({
    name: z
        .string()
        .min(1, "Tên phòng không được để trống")
        .max(100, "Tên phòng không được vượt quá 100 ký tự"),
    maxMembers: z.coerce
        .number<number>()
        .min(1, "Số thành viên tối đa phải lớn hơn 0")
        .max(
            ROOM_MAX_MEMBERS_LIMIT,
            `Số thành viên tối đa không được vượt quá ${ROOM_MAX_MEMBERS_LIMIT}`
        ),
    isPrivate: z.boolean(),
});

export type RoomDataFormValues = z.infer<typeof roomDataFormSchema>;

export function RoomDataForm() {
    const { data: room } = useRoomQuery();

    const form = useForm<RoomDataFormValues>({
        resolver: zodResolver(roomDataFormSchema),
        defaultValues: {
            name: room.name,
            maxMembers: room.maxMembers,
            isPrivate: !!room.isPrivate,
        },
    });

    const { mutateAsync: handleSubmit } = useMutation({
        mutationFn: async (data: RoomDataFormValues) => {
            await handleAction(updateRoomData(room._id, data));
            return data;
        },
        onError: (error: any) => {
            toast.error("Đã có lỗi xảy ra khi cập nhật thông tin phòng", {
                description: error?.message,
            });
        },
        onSuccess: async (data) => {
            toast.success("Cập nhật thông tin phòng thành công!");
            queryClient.invalidateQueries({ queryKey: roomQueryKey(room._id) });
            form.reset(data);
        },
    });

    const onSubmit = async (data: RoomDataFormValues) => {
        await handleSubmit(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên phòng</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="maxMembers"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số lượng thành viên tối đa</FormLabel>
                            <FormControl>
                                <Input min={1} type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel>Chế độ riêng tư</FormLabel>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    className="w-full"
                    type="submit"
                    disabled={
                        !form.formState.isDirty || form.formState.isSubmitting
                    }
                >
                    Lưu thay đổi
                    {form.formState.isSubmitting && (
                        <Loader2 className="animate-spin ml-2" />
                    )}
                </Button>
            </form>
        </Form>
    );
}
