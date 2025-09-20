"use client";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROOM_ID_LENGTH } from "@/lib/app-constants";
import { joinRoom } from "@/lib/actions/room";
import { handleAction } from "@/lib/action-handler";
import { ServerActionError } from "@/lib/errors";

const joinRoomFormSchema = z.object({
    roomIdOrLink: z
        .string()
        .min(
            0,
            `Vui lòng nhập ID hoặc liên kết phòng (ID gồm ${ROOM_ID_LENGTH} ký tự)`
        ),
});

export default function JoinRoomForm() {
    const router = useRouter();

    const form = useForm<z.infer<typeof joinRoomFormSchema>>({
        resolver: zodResolver(joinRoomFormSchema),
        defaultValues: {
            roomIdOrLink: "",
        },
    });

    async function onSubmit(values: z.infer<typeof joinRoomFormSchema>) {
        try {
            let isJoinSuccessfully = false;
            let roomId: string | undefined;

            const isLink = values.roomIdOrLink.includes("/room/join/");
            if (isLink) {
                const url = isLink ? new URL(values.roomIdOrLink) : null;

                roomId = url?.pathname.split("/room/join/")[1];

                if (!roomId || roomId.length !== ROOM_ID_LENGTH) {
                    form.setError("roomIdOrLink", {
                        message: "Liên kết phòng không hợp lệ",
                    });
                    return;
                }

                const inviteToken = url?.searchParams.get("token");

                isJoinSuccessfully = await handleAction(
                    joinRoom(roomId, inviteToken)
                );
            } else {
                roomId = values.roomIdOrLink;
                if (roomId.length !== ROOM_ID_LENGTH) {
                    form.setError("roomIdOrLink", {
                        message: `ID phòng phải gồm ${ROOM_ID_LENGTH} ký tự`,
                    });
                    return;
                }

                isJoinSuccessfully = await handleAction(joinRoom(roomId));
            }

            if (isJoinSuccessfully) router.push(`/room/${roomId}`);
            else toast.error("Không thể tham gia phòng. Vui lòng thử lại sau");
        } catch (err: any) {
            if (err instanceof ServerActionError) {
                return form.setError("roomIdOrLink", {
                    message: err.message,
                });
            }
            form.setError("roomIdOrLink", {
                message: "Đầu vào không hợp lệ. Vui lòng kiểm tra và thử lại",
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="roomIdOrLink"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID hoặc liên kết phòng</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>
                                Nếu sử dụng ID, phòng phải là phòng công khai
                                mới tham gia được.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={form.formState.isSubmitting}>
                    Tham gia phòng
                </Button>
            </form>
        </Form>
    );
}
