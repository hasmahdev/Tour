import React from 'react';
import Dialog from './Dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
}) => {
  const confirmButtonClasses = {
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        {variant === 'destructive' && <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />}
        <p className="text-brand-secondary mb-6">{message}</p>
        <div className="flex w-full gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-brand-border/10 hover:bg-brand-border/20 text-brand-primary font-bold py-2.5 px-5 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-bold py-2.5 px-5 rounded-lg transition-colors ${confirmButtonClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmationModal;
