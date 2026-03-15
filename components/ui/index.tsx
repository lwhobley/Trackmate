import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ============================================================
// BUTTON
// ============================================================
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#FF4B00] text-white hover:bg-[#e04200] shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-[#2A2A2A] bg-transparent hover:bg-[#1a1a1a] text-white",
        secondary: "bg-[#1a1a1a] text-white hover:bg-[#252525]",
        ghost: "hover:bg-[#1a1a1a] text-white",
        link: "text-[#FF4B00] underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = "Button"

// ============================================================
// BADGE
// ============================================================
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#FF4B00] text-white",
        secondary: "border-transparent bg-[#1a1a1a] text-zinc-300",
        destructive: "border-transparent bg-red-600/20 text-red-400 border-red-600/30",
        outline: "border-zinc-700 text-zinc-300",
        success: "border-transparent bg-green-600/20 text-green-400 border-green-600/30",
        warning: "border-transparent bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
        hs: "border-transparent bg-blue-600/20 text-blue-400 border-blue-600/30",
        ncaa: "border-transparent bg-purple-600/20 text-purple-400 border-purple-600/30",
        club: "border-transparent bg-orange-600/20 text-orange-400 border-orange-600/30",
        elite: "border-transparent bg-gold-600/20 text-yellow-300 border-yellow-600/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

// ============================================================
// CARD
// ============================================================
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-[#2A2A2A] bg-[#111111] text-white shadow-sm", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-bold leading-none tracking-tight text-white", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-zinc-400", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

// ============================================================
// INPUT
// ============================================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B00] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-600",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = "Input"

// ============================================================
// SELECT
// ============================================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B00] disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-600",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Select.displayName = "Select"

// ============================================================
// TEXTAREA
// ============================================================
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ className, label, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B00] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
)
Textarea.displayName = "Textarea"

// ============================================================
// SEPARATOR
// ============================================================
function Separator({ className, orientation = "horizontal", ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn(
        "shrink-0 bg-[#2A2A2A]",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
}

// ============================================================
// LOADING SPINNER
// ============================================================
function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }
  return (
    <svg
      className={cn("animate-spin text-[#FF4B00]", sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ============================================================
// LOADING PAGE
// ============================================================
function LoadingPage({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-zinc-400 text-sm">{message}</p>
    </div>
  )
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {icon && <div className="text-zinc-600 text-5xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-zinc-300">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ============================================================
// ALERT
// ============================================================
function Alert({ variant = "info", title, children, className }: {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const styles = {
    info: "border-blue-600/30 bg-blue-600/10 text-blue-400",
    success: "border-green-600/30 bg-green-600/10 text-green-400",
    warning: "border-yellow-600/30 bg-yellow-600/10 text-yellow-400",
    error: "border-red-600/30 bg-red-600/10 text-red-400",
  }
  return (
    <div className={cn("rounded-lg border p-4", styles[variant], className)}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  )
}

// ============================================================
// TABLE
// ============================================================
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b [&_tr]:border-[#2A2A2A]", className)} {...props} />
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
)
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b border-[#1a1a1a] transition-colors hover:bg-[#151515]", className)} {...props} />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn("h-12 px-4 text-left align-middle font-semibold text-zinc-400 text-xs uppercase tracking-wider", className)} {...props} />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <td ref={ref} className={cn("p-4 align-middle text-white", className)} {...props} />
)
TableCell.displayName = "TableCell"

// ============================================================
// TABS
// ============================================================
interface TabsContextValue {
  value: string
  onChange: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({ value: '', onChange: () => {} })

function Tabs({ value, onValueChange, children, className }: {
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-[#1a1a1a] p-1 text-zinc-400", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx.value === value
  return (
    <button
      onClick={() => ctx.onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-[#FF4B00] text-white shadow-sm" : "text-zinc-400 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("mt-4", className)}>{children}</div>
}

export {
  Button, buttonVariants,
  Badge, badgeVariants,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Input, Select, Textarea,
  Separator,
  Spinner, LoadingPage, EmptyState,
  Alert,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tabs, TabsList, TabsTrigger, TabsContent,
}
