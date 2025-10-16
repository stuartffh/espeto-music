import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({
      isOpen: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
