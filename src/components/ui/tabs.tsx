import * as React from "react";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "");

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const handleValueChange = (newValue: string) => {
      setSelectedValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div 
        ref={ref} 
        className={`${className || ""}`} 
        {...props} 
        data-value={selectedValue}
        data-value-change-fn="tabsValueChange"
      />
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-wrap border-b border-gray-200 ${className || ""}`}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const [isActive, setIsActive] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    
    // Combiner la ref externe et la ref interne
    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);
    
    // Utiliser useEffect pour vérifier si ce trigger est actif
    React.useEffect(() => {
      const currentRef = buttonRef.current;
      if (!currentRef) return;
      
      const tabs = currentRef.closest("[data-value]") as HTMLElement;
      if (tabs) {
        const tabsValue = tabs.getAttribute("data-value");
        setIsActive(value === tabsValue);
        
        // Ajouter un MutationObserver pour détecter les changements d'attribut data-value
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "data-value") {
              const newValue = (mutation.target as HTMLElement).getAttribute("data-value");
              setIsActive(value === newValue);
            }
          });
        });
        
        observer.observe(tabs, { attributes: true });
        return () => observer.disconnect();
      }
    }, [value]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const tabs = e.currentTarget.closest("[data-value]") as HTMLElement;
      
      if (tabs) {
        tabs.setAttribute("data-value", value);
        
        // Déclencher l'événement onValueChange par un événement personnalisé
        const onValueChange = tabs?.getAttribute("data-value-change-fn");
        if (typeof window !== 'undefined' && onValueChange && (window as any)[onValueChange]) {
          (window as any)[onValueChange](value);
        }
        
        // Déclencher un événement personnalisé
        const event = new CustomEvent("tabs-value-change", { detail: { value } });
        tabs.dispatchEvent(event);
      }
      
      // Appeler le gestionnaire onClick d'origine s'il existe
      props.onClick?.(e);
    };

    return (
      <button
        ref={buttonRef}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px 
          ${isActive 
            ? "border-blue-500 text-blue-500"
            : "border-transparent hover:text-gray-700 hover:border-gray-300"
          } ${className || ""}`}
        data-value={value}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    
    // Combiner la ref externe et la ref interne
    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);
    
    React.useEffect(() => {
      const currentRef = contentRef.current;
      if (!currentRef) return;
      
      const tabs = currentRef.closest("[data-value]") as HTMLElement;
      if (tabs) {
        const tabsValue = tabs.getAttribute("data-value");
        setIsVisible(value === tabsValue);
        
        // Utiliser un MutationObserver pour détecter les changements
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "data-value") {
              const newValue = (mutation.target as HTMLElement).getAttribute("data-value");
              setIsVisible(value === newValue);
            }
          });
        });
        
        observer.observe(tabs, { attributes: true });
        
        // S'abonner également à l'événement personnalisé
        const handleValueChange = (e: Event) => {
          const event = e as CustomEvent;
          setIsVisible(value === event.detail.value);
        };
        
        tabs.addEventListener("tabs-value-change", handleValueChange);
        
        return () => {
          observer.disconnect();
          tabs.removeEventListener("tabs-value-change", handleValueChange);
        };
      }
    }, [value]);

    return (
      <div
        ref={contentRef}
        className={`${className || ""} ${isVisible ? "block" : "hidden"}`}
        data-value={value}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }; 