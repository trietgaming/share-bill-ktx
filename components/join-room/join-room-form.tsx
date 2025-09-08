"use client";
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROOM_ID_LENGTH } from "@/lib/app-constants";
import { joinRoom } from "@/lib/actions/room";

const joinRoomFormSchema = z.object({
    roomId: z.string().length(ROOM_ID_LENGTH, `Mã phòng phải có đúng ${ROOM_ID_LENGTH} ký tự.`)
})

export default function JoinRoomForm() {
    const router = useRouter();

    const form = useForm<z.infer<typeof joinRoomFormSchema>>({
        resolver: zodResolver(joinRoomFormSchema),
        defaultValues: {
            roomId: ""
        }
    });

    async function onSubmit(values: z.infer<typeof joinRoomFormSchema>) {
        try {
            const isJoinSuccessfully = await joinRoom(values.roomId);

            if (isJoinSuccessfully) router.push(`/room/${values.roomId}`);
            else toast.error("Không thể tham gia phòng. Vui lòng thử lại sau");
        } catch (err) {
            // TODO: Handle errors
            toast.error("Đã có lỗi xảy ra khi tham gia phòng. Vui lòng thử lại sau")
        }
    }

    return <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="roomId" render={({ field }) => (
                <FormItem>
                    <FormLabel>ID phòng</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

        
            <Button type="submit" disabled={form.formState.isSubmitting}>Tham gia phòng</Button>
        </form>

    </Form>;
}