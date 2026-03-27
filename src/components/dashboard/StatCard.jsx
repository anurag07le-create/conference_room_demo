import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
    title, 
    value, 
    subvalue, 
    trend, 
    trendValue, 
    icon: Icon, 
    variant = 'white', // 'white', 'indigo', 'green', 'blue', 'orange'
    className = '' 
}) => {
    const variants = {
        white: 'bg-white text-gray-900 border-gray-100',
        indigo: 'gradient-indigo text-white border-transparent',
        green: 'gradient-green text-white border-transparent',
        blue: 'gradient-blue text-white border-transparent',
        orange: 'gradient-orange text-white border-transparent',
    };

    const iconBg = {
        white: 'bg-indigo-50 text-[#4F27E9]',
        indigo: 'bg-white/20 text-white',
        green: 'bg-white/20 text-white',
        blue: 'bg-white/20 text-white',
        orange: 'bg-white/20 text-white',
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp size={12} />;
        if (trend === 'down') return <TrendingDown size={12} />;
        return <Minus size={12} />;
    };

    const getTrendColor = () => {
        if (variant !== 'white') return 'bg-white/20 text-white border-transparent';
        if (trend === 'up') return 'bg-green-50 text-green-600 border-green-100';
        if (trend === 'down') return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    return (
        <div className={`
            relative p-4 md:p-6 rounded-[28px] md:rounded-[32px] border transition-all duration-300 shadow-premium group overflow-hidden
            ${variants[variant]}
            ${className}
        `}>
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-transform duration-300 group-hover:scale-110 ${iconBg[variant]}`}>
                        {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />}
                    </div>
                    {trendValue && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border text-[9px] md:text-[11px] font-black uppercase tracking-wider ${getTrendColor()}`}>
                            {getTrendIcon()}
                            {trendValue}
                        </div>
                    )}
                </div>

                <div>
                    <p className={`text-[9px] md:text-[12px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] mb-0.5 md:mb-1 opacity-70 truncate`}>
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-none">
                            {value}
                        </h3>
                    </div>
                    {subvalue && (
                        <p className="mt-1 md:mt-2 text-[10px] md:text-[13px] font-medium opacity-60 truncate">
                            {subvalue}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
