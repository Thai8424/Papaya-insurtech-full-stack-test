import * as React from "react";
import { Content as PopoverContentPrimitive } from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const NonPortalledPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof PopoverContentPrimitive>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverContentPrimitive
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-[9999] w-72 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl outline-none",
      className,
    )}
    // Không Portal hóa
    {...props}
  />
));
NonPortalledPopoverContent.displayName = "NonPortalledPopoverContent";

export { NonPortalledPopoverContent };
