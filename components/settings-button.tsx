import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

export function SettingsButton() {
  return (
    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
      <Link href="/settings">
        <Settings className="h-5 w-5" />
      </Link>
    </Button>
  )
}
