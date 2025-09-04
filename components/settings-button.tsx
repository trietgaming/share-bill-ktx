import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function SettingsButton() {
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9">
      <Settings className="h-5 w-5" />
    </Button>
  )
}
