import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function UserAvatar({
    user,
    ...props
}: React.ComponentProps<typeof Avatar> & {
    user: { displayName: string; photoUrl?: string };
}) {
    return (
        <Avatar {...props}>
            <AvatarImage src={user.photoUrl} alt={user.displayName} />
            <AvatarFallback className="text-xs md:text-sm">
                {user.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
            </AvatarFallback>
        </Avatar>
    );
}
