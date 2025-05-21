import * as React from "react";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
    const orientationClasses = orientation === "horizontal" 
      ? "h-px w-full" 
      : "h-full w-px";

    return (
      <div
        ref={ref}
        className={`shrink-0 bg-gray-200 ${orientationClasses} ${className || ""}`}
        {...props}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
      />
    );
  }
);
Separator.displayName = "Separator";

export { Separator }; 