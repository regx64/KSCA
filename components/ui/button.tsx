import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Apple-style pill buttons (apple.com): blue filled, blue outline, quiet
// gray, and plain text links. Restyled from the shadcn defaults.
const buttonVariantsBase = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border font-normal whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-4 focus-visible:ring-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-[#0077ed]",
        outline: "border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary: "border-transparent bg-surface text-foreground hover:bg-[#e8e8ed]",
        ghost: "border-transparent text-foreground hover:bg-black/[0.05]",
        destructive: "border-transparent bg-destructive text-white hover:bg-[#c90000]",
        link: "rounded-none border-transparent px-0 text-link hover:underline underline-offset-4",
        dark: "border-transparent bg-[#1d1d1f] text-white hover:bg-black",
      },
      size: {
        default: "h-10 gap-1.5 px-5 text-[15px]",
        xs: "h-7 gap-1 px-3 text-[12px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-4 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-7 text-[17px]",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Run through cn() so a caller's className (e.g. a text color) reliably
// overrides the variant's — plain cva output doesn't resolve conflicts.
function buttonVariants(...args: Parameters<typeof buttonVariantsBase>) {
  return cn(buttonVariantsBase(...args))
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariantsBase>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
