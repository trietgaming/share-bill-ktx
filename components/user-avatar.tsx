import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function UserAvatar({ user, ...props }: React.ComponentProps<typeof Avatar> & { user: { displayName: string, photoUrl?: string } }) {
    return (
        <Avatar {...props}>
            <AvatarImage src={user.photoUrl} alt={user.displayName} />
            <AvatarFallback>
                {user.displayName?.[0] || "?"}
            </AvatarFallback>
        </Avatar>
    )
}