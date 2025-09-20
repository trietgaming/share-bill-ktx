import { ROOM_MAX_MEMBERS_LIMIT } from "@/lib/app-constants";
import { z } from "zod";

const roomDataFormSchema = z.object({
    name: z
        .string()
        .min(1, "Tên phòng không được để trống")
        .max(100, "Tên phòng không được vượt quá 100 ký tự"),
    maxMembers: z
        .number()
        .min(1, "Số thành viên tối đa phải lớn hơn 0")
        .max(
            ROOM_MAX_MEMBERS_LIMIT,
            `Số thành viên tối đa không được vượt quá ${ROOM_MAX_MEMBERS_LIMIT}`
        ),
});
