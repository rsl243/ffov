import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "outline":
          return "border border-gray-300 text-gray-700 bg-transparent";
        case "secondary":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-blue-100 text-blue-800";
      }
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getVariantClasses()} ${className || ""}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge }; 