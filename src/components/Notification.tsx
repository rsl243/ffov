"use client";

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-green-50 border-green-500',
    error: 'bg-red-50 border-red-500',
    info: 'bg-blue-50 border-blue-500',
    warning: 'bg-yellow-50 border-yellow-500'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center p-4 rounded-md border ${bgColors[type]} shadow-md max-w-md`}>
        <div className={`mr-3 ${iconColors[type]}`}>
          <FiCheckCircle size={20} />
        </div>
        <div className={`flex-1 ${textColors[type]}`}>{message}</div>
        <button 
          onClick={handleClose}
          className={`ml-3 ${iconColors[type]} hover:opacity-75 focus:outline-none`}
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
