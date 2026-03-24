import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchIcon from '../../assets/icons/search.svg';
import BellIcon from '../../assets/icons/bell.png';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { notifications, searchQuery, setSearchQuery } = useData();
    const [isFocused, setIsFocused] = useState(false);
    
    // Derived state for performance and real-time accuracy
    const notifCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="sticky top-0 z-20 w-full h-[76px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between pl-8 py-0 pr-8">
            {/* Search (Left) */}
            <div className="flex items-center gap-4 h-[44px]">
                <div
                    className={`
                        flex items-center gap-2.5 bg-white rounded-full transition-all duration-200 ease-in-out
                        ${isFocused || searchQuery
                            ? 'h-[44px] w-[332px] border-[0.7px] border-[#B56FFF] shadow-[0px_0px_0px_3px_#DBD4FB] p-1'
                            : 'h-[44px] w-[332px] border border-black/5 p-1 hover:border-[#B56FFF] hover:shadow-none'
                        }
                    `}
                >
                    <div className="flex items-center justify-center w-9 h-9 bg-pucho-blue/10 rounded-full flex-shrink-0">
                        <img src={SearchIcon} alt="Search" className="w-4 h-4 opacity-100" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`
                            flex-1 bg-transparent border-none outline-none text-[#111935] placeholder:text-black/50 text-[16px] font-['Inter'] leading-[150%]
                            transition-all duration-300 ease-in-out
                            ${isFocused || searchQuery ? 'pl-2' : 'pl-0'}
                        `}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-4">
                {/* REAL-TIME Notification Bell */}
                <Link to={user?.role?.toUpperCase() === 'ADMIN' ? "/admin/notifications" : "/user/notifications"} className="relative cursor-pointer hover:bg-gray-50 p-2 rounded-full transition-colors">
                    <img src={BellIcon} alt="Notifications" className="w-5 h-5 opacity-70" />
                    {notifCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-pulse">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </Link>

                <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
                <div className="flex items-center gap-2">
                </div>
            </div>
        </header>
    );
};

export default Header;
