"use client";
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createNewRoom } from "@/lib/actions/room";
import { useRouter } from "next/navigation";

const createRoomFormSchema = z.object({
    name: z.string().min(1, "Tên phòng là bắt buộc!").max(100, "Tên phòng không được vượt quá 100 ký tự."),
    maxMembers: z.number().min(1, "Số lượng thành viên tối thiểu là 1").max(100, "Số lượng thành viên tối đa là 100")
})

export default function CreateRoomForm() {
    const router = useRouter();
    
    const form = useForm<z.infer<typeof createRoomFormSchema>>({
        resolver: zodResolver(createRoomFormSchema),
        defaultValues: {
            name: "",
            maxMembers: 4
        }
    });

    async function onSubmit(values: z.infer<typeof createRoomFormSchema>) {
        try {
            const newRoomId = await createNewRoom(values);

            router.push(`/room/${newRoomId}?isNew=true`);
        } catch (err) {
            console.error(err);

            form.setError("root", { message: "Đã có lỗi xảy ra. Vui lòng thử lại sau." });
        }
    }

    return <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tên phòng</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="maxMembers" render={({ field }) => (
                <FormItem>
                    <FormLabel>Số lượng thành viên tối đa</FormLabel>
                    <FormControl>
                        <Input min={1} type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <Button type="submit" disabled={form.formState.isSubmitting || form.formState.isSubmitSuccessful}>Tạo phòng</Button>
        </form>

    </Form>;
}