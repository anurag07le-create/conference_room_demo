import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger", // danger, warning, info
    isLoading = false
}) => {
    const typeStyles = {
        danger: {
            icon: <AlertTriangle className="text-red-500" size={32} />,
            buttonBg: "bg-red-500 hover:bg-red-600",
            iconBg: "bg-red-50"
        },
        warning: {
            icon: <AlertTriangle className="text-amber-500" size={32} />,
            buttonBg: "bg-amber-500 hover:bg-amber-600",
            iconBg: "bg-amber-50"
        },
        info: {
            icon: <AlertTriangle className="text-blue-500" size={32} />,
            buttonBg: "bg-blue-500 hover:bg-blue-600",
            iconBg: "bg-blue-50"
        }
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={null}>
            <div className="flex flex-col items-center text-center gap-4 py-4 min-h-[280px] justify-center">
                <div className={`p-4 rounded-full ${style.iconBg} mb-2`}>
                    {style.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-500 max-w-xs mx-auto font-medium">
                    {message}
                </p>
                
                <div className="flex gap-3 w-full mt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 h-12 px-6 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 ${style.buttonBg} text-white h-12 px-6 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
