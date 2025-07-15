import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  onClick: () => void;
  disabled: boolean;
  selectedCount: number;
  label: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onClick, 
  disabled, 
  selectedCount, 
  label 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      {label} ({selectedCount})
    </button>
  );
};

export default DeleteButton;