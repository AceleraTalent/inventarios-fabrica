import type { ReactNode, RefObject } from "react"
import type { LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function ModalShell({ open, onClose, icon: Icon, title, description, children, footer, className, initialFocus }: {
  initialFocus?: RefObject<HTMLElement>
  open: boolean; onClose: () => void; icon: LucideIcon; title: string; description?: string; children: ReactNode; footer: ReactNode; className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(className)}
        onOpenAutoFocus={initialFocus ? (e) => { e.preventDefault(); initialFocus.current?.focus() } : undefined}
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter className="pt-1">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
