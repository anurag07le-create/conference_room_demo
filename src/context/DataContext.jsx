import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const refreshRooms = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
            if (!error) {
                const mapped = (data || []).map(r => ({
                    ...r,
                    id: r.id || r.room_id,
                    room_name: r.room_name || r.name
                }));
                setRooms(mapped);
            }
        } catch (e) { console.error(e); }
    }, []);

    const refreshBookings = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('bookings').select('*').order('booking_date', { ascending: false });
            if (!error) {
                const mapped = (data || []).map(b => ({
                    ...b,
                    id: b.booking_id || b.id,
                    room_id: b.room_id || b.rooms?.id,
                    startTime: b.start_time ? b.start_time.substring(0,5) : '--:--',
                    endTime: b.end_time ? b.end_time.substring(0,5) : '--:--',
                    room: b.room_name || b.rooms?.room_name || 'Room',
                    date: b.booking_date
                }));
                setBookings(mapped);
            }
        } catch (e) { console.error(e); }
    }, []);

    const refreshUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (!error) setUsers(data || []);
        } catch (e) { console.error(e); }
    }, []);

    const refreshNotifications = useCallback(async () => {
        if (!user || !user.email) return;
        try {
            const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            const currentEmail = user.email.toLowerCase();
            const filtered = (data || []).filter(n => {
                if (!n) return false;
                const type = String(n.type || '').toLowerCase();
                const msg = String(n.message || '').toLowerCase();
                const targetEmail = String(n.user_email || '').toLowerCase();
                
                // RESTRICT REPORTS TO ADMINS ONLY
                if (type.includes('report')) {
                    return user?.role?.toUpperCase() === 'ADMIN';
                }

                if (type.includes('room')) return true;
                if (targetEmail === currentEmail) return true;
                if (currentEmail && msg.includes(currentEmail)) return true;
                return false;
            });
            const mapped = filtered.map(n => ({
                ...n,
                id: n.notification_id || n.id || Math.random().toString(36).substr(2, 9)
            }));
            setNotifications(mapped);
        } catch (e) { console.log(e); setNotifications([]); }
    }, [user]);

    const refreshAll = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        try {
            await Promise.all([refreshRooms(), refreshBookings(), refreshUsers(), refreshNotifications()]);
            setLastUpdated(new Date());
        } catch (e) { console.error(e); }
        finally { if (!silent) setLoading(false); }
    }, [user, refreshRooms, refreshBookings, refreshUsers, refreshNotifications]);

    // 🚀 REAL-TIME ENGINE (Automatic UI Updates)
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                console.log("[Data] Real-time Booking Update Detected");
                refreshBookings();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
                console.log("[Data] Real-time Room Update Detected");
                refreshRooms();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                console.log("[Data] Real-time Notification Update Detected");
                refreshNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, refreshBookings, refreshRooms, refreshNotifications]);

    useEffect(() => {
        if (user) refreshAll();
    }, [user, refreshAll]);

    return (
        <DataContext.Provider value={{ 
            rooms, bookings, users, notifications, loading, lastUpdated, 
            searchQuery, setSearchQuery,
            refreshAll, refreshRooms, refreshBookings, refreshUsers, refreshNotifications 
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within DataProvider");
    return context;
};
