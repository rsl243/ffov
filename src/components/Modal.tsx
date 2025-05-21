import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'success'; // Pour les différents styles
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction
}: ModalProps) {
  if (!isOpen) return null;
  
  // Définir les classes CSS en fonction de la variante
  const getButtonClasses = (variant: string = 'primary') => {
    const baseClasses = "px-4 py-2 rounded-md text-white";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700",
      danger: "bg-red-600 hover:bg-red-700",
      success: "bg-green-600 hover:bg-green-700"
    };
    
    return `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]}`;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
          
          <div className="mb-4">
            {children}
          </div>
          
          <div className="flex justify-end space-x-3">
            {secondaryAction && (
              <button 
                onClick={secondaryAction.onClick} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                {secondaryAction.label}
              </button>
            )}
            
            {primaryAction && (
              <button 
                onClick={primaryAction.onClick} 
                className={getButtonClasses(primaryAction.variant)}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 