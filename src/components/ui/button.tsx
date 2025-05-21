import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "outline":
          return "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700";
        case "secondary":
          return "bg-gray-100 text-gray-900 hover:bg-gray-200";
        case "ghost":
          return "bg-transparent hover:bg-gray-100 text-gray-700";
        case "link":
          return "bg-transparent underline-offset-4 hover:underline text-blue-500";
        default:
          return "bg-blue-500 text-white hover:bg-blue-600";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "h-8 px-3 text-xs";
        case "lg":
          return "h-11 px-8 text-base";
        case "icon":
          return "h-9 w-9 p-0";
        default:
          return "h-9 px-4 py-2 text-sm";
      }
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${getVariantClasses()} ${getSizeClasses()} ${className || ""}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button }; 