import { MemberRole, RoleLabelMap } from "@/enums/member-role";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleRenderMap: Record<MemberRole, { label: string; color: string }> = {
    [MemberRole.ADMIN]: { label: RoleLabelMap[MemberRole.ADMIN], color: "bg-red-700" },
    [MemberRole.MODERATOR]: { label: RoleLabelMap[MemberRole.MODERATOR], color: "bg-blue-700" },
    [MemberRole.MEMBER]: { label: RoleLabelMap[MemberRole.MEMBER], color: "bg-gray-700" },
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
