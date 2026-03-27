import React from 'react';

const Button = ({ children, onClick, className = '', disabled = false, icon: Icon, variant = 'primary' }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'outline':
                return 'bg-white border-2 border-[#4F27E9] text-[#4F27E9] hover:bg-indigo-50';
            case 'ghost':
                return 'bg-transparent border-transparent text-[#111834] hover:bg-gray-100/50';
            case 'danger':
                return 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100';
            default:
                return 'bg-[#4F27E9] text-white hover:bg-[#3D1DB3] shadow-indigo-100';
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                relative h-12 px-8 flex items-center justify-center gap-3 rounded-2xl
                transition-all duration-300 ease-out
                font-['Inter'] font-bold text-[12px] uppercase tracking-widest
                overflow-hidden select-none
                disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent disabled:cursor-not-allowed disabled:scale-100
                hover:scale-[1.02] active:scale-[0.98]
                ${getVariantStyles()}
                ${className}
            `}
            style={{
                boxShadow: disabled || variant === 'ghost' ? 'none' : '0px 10px 20px -5px rgba(79, 39, 233, 0.2)',
            }}
        >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="relative z-10">{children}</span>
        </button>
    );
};

export default Button;
