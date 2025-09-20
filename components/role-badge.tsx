import { MemberRole } from "@/enums/member-role";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleRenderMap: Record<MemberRole, { label: string; color: string }> = {
    [MemberRole.ADMIN]: { label: "Quản trị viên", color: "bg-red-700" },
    [MemberRole.MODERATOR]: { label: "Người điều hành", color: "bg-blue-700" },
    [MemberRole.MEMBER]: { label: "Thành viên", color: "bg-gray-700" },
};

export function RoleBadge({
    role,
    ...props
}: React.ComponentProps<typeof Badge> & { role: MemberRole }) {
    const { color, label } = roleRenderMap[role];
    return role === MemberRole.MEMBER ? null : (
        <Badge
            {...props}
            className={cn("text-xs", color, props.className)}
        >
            {label}
        </Badge>
    );
}
