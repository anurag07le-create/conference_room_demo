import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, Clock, Users, Calendar, XCircle, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

const Notifications = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { notifications, loading: dataLoading, refreshNotifications } = useData();
    const [filter, setFilter] = useState('all'); 

    useEffect(() => {
        if (user) {
            refreshNotifications();
        }
    }, [user]);

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            
            refreshNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            refreshNotifications();
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'booking':
            case 'BOOKING_CREATED': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'BOOKING_UPDATED': return <Info className="w-5 h-5 text-blue-500" />;
            case 'BOOKING_CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'MEETING_INVITE': return <Users className="w-5 h-5 text-purple-500" />;
            case 'room':
            case 'ROOM_UPDATE': return <Calendar className="w-5 h-5 text-indigo-500" />;
            case 'REPORTS': return <BarChart3 className="w-5 h-5 text-emerald-500" />;
            case 'REMINDER': return <Clock className="w-5 h-5 text-amber-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'booking':
            case 'BOOKING_CREATED': return 'bg-green-50 border-green-200';
            case 'BOOKING_UPDATED': return 'bg-blue-50 border-blue-200';
            case 'BOOKING_CANCELLED': return 'bg-red-50 border-red-200';
            case 'MEETING_INVITE': return 'bg-purple-50 border-purple-200';
            case 'room':
            case 'ROOM_UPDATE': return 'bg-indigo-50 border-indigo-200';
            case 'REPORTS': return 'bg-emerald-50 border-emerald-200';
            case 'REMINDER': return 'bg-amber-50 border-amber-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-gray-500 text-sm">Real-time updates on your bookings and invites.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20"
                    >
                        <option value="all">All ({notifications.length})</option>
                        <option value="unread">Unread ({unreadCount})</option>
                        <option value="read">Read ({notifications.length - unreadCount})</option>
                    </select>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-sm font-medium text-[#4F27E9] hover:underline">
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {dataLoading ? (
                    <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#4F27E9]/20 border-t-[#4F27E9] rounded-full animate-spin"></div>
                    </div>
                ) : filteredNotifications.length > 0 ? filteredNotifications.map((n) => (
                    <div 
                        key={n.id} 
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 hover:shadow-md ${n.is_read ? 'bg-white border-gray-100 shadow-sm' : 'bg-[#FAF9FE] border-[#F0EDFF] shadow-sm'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(n.type)}`}>
                            {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold ${n.is_read ? 'text-gray-900' : 'text-[#4F27E9]'}`}>{n.title}</h3>
                                <span className="text-xs text-gray-400 font-medium">{formatTime(n.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">{n.message}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 bg-[#4F27E9] rounded-full mt-2"></div>}
                    </div>
                )) : (
                    <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <Bell className="mx-auto w-10 h-10 text-gray-200 mb-2" />
                        <p className="text-gray-500 font-bold">No notifications</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filter === 'unread' ? 'All caught up!' : 'You\'re all set!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
