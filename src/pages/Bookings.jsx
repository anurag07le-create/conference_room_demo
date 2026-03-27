import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
    Calendar, Clock, Users as UsersIcon, MapPin, 
    MoreHorizontal, Edit2, XCircle, Search, 
    Filter, Download, Plus, RefreshCw, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BookingModal from '../components/dashboard/BookingModal';
import MoMModal from '../components/dashboard/MoMModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Bookings = () => {
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const { bookings, rooms, loading: dataLoading, refreshBookings, searchQuery } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMoMModalOpen, setIsMoMModalOpen] = useState(false);
    const [selectedBookingForMoM, setSelectedBookingForMoM] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
    const [bookingToCancelId, setBookingToCancelId] = useState(null);

    const WEBHOOK_URL = import.meta.env.VITE_SMART_COMM_WEBHOOK_URL || "https://studio.pucho.ai/api/v1/webhooks/HHRERjvYyx4TblQt65NLD";

    const handleOpenModal = (booking = null) => {
        if (booking) {
            const targetRoomId = booking.room_id || booking.rooms?.id || '';
            setEditingBooking({
                ...booking,
                room_id: targetRoomId
            });
        } else {
            setEditingBooking(null);
        }
        setIsModalOpen(true);
    };

    const handleOpenMoM = (booking) => {
        setSelectedBookingForMoM(booking);
        setIsMoMModalOpen(true);
    };

    const triggerWebhook = async (action, payload) => {
        const date = payload.booking_date || payload.date;
        const start = payload.start_time;
        const end = payload.end_time;
        
        let startISO = '';
        let endISO = '';
        
        if (date && start) {
            const cleanDate = date.split('T')[0];
            const cleanStart = start.substring(0, 5);
            startISO = `${cleanDate}T${cleanStart}:00.000Z`;
        }
        if (date && end) {
            const cleanEnd = end.substring(0, 5);
            endISO = `${date.split('T')[0]}T${cleanEnd}:00.000Z`;
        }

        try {
            const { 
                start_date_time, end_date_time, 
                start_time, end_time, 
                startTime, endTime, 
                ...cleanPayload 
            } = payload;
            
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    ...cleanPayload,
                    action_type: action, 
                    start_date_time: startISO,
                    end_date_time: endISO
                })
            });
        } catch (error) {
            console.error("Webhook Trace Failed:", error.message);
        }
    };

    const handleCancelClick = (id) => {
        setBookingToCancelId(id);
        setIsConfirmCancelOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancelId) return;
        const id = bookingToCancelId;
        setLoading(true);

        const watchdog = setTimeout(() => {
            setLoading(false);
            setIsConfirmCancelOpen(false);
            showToast("Syncing in background...", "info");
        }, 3000);

        try {
            const bookingToCancel = bookings.find(b => (String(b.booking_id) === String(id) || String(b.id) === String(id)));
            
            // 🚀 Determine the correct column and value type for the query
            const isNumericId = !isNaN(id) && String(id).length < 10;
            const query = isNumericId 
                ? supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', parseInt(id))
                : supabase.from('bookings').update({ status: 'CANCELLED' }).eq('booking_id', id);

            const { error } = await query;
            
            if (error) throw error;
            
            clearTimeout(watchdog);
            showToast('Booking cancelled successfully', 'success');
            
            if (bookingToCancel) {
                triggerWebhook('cancel_booking', { ...bookingToCancel, status: 'CANCELLED' }).catch(() => {});
            }
            
            if (refreshBookings) refreshBookings();
            setIsConfirmCancelOpen(false);
        } catch (error) {
            clearTimeout(watchdog);
            showToast(`Cancellation failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setBookingToCancelId(null);
        }
    };

    if (dataLoading) return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;

    const handleRefresh = async () => {
        setLoading(true);
        try {
            if (refreshBookings) await refreshBookings();
            showToast('Bookings refreshed', 'success');
        } catch (e) {
            showToast('Refresh failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Search & Role Logic
    const q = (searchQuery || '').toLowerCase();
    const userEmail = user?.email?.toLowerCase();
    const isAdmin = profile?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'ADMIN';

    const filteredBookings = bookings.filter(b => {
        // 1. Role Filter
        const isOwner = b.user_email?.toLowerCase() === userEmail;
        if (!isAdmin && !isOwner) return false;

        // 2. Search Filter
        if (!q) return true;
        return (
            b.title?.toLowerCase().includes(q) ||
            b.user_email?.toLowerCase().includes(q) ||
            b.room_name?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-premium">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-[#111834] tracking-tight">Booking Hub</h1>
                    <p className="text-sm font-medium text-gray-500">Effortlessly manage your workspace reservations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="w-12 h-12 flex items-center justify-center bg-white text-gray-400 hover:text-[#4F27E9] rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] h-14 px-8 flex items-center gap-3 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Plus size={20} />
                        New Booking
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[40px] border border-gray-100 shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Meeting</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Schedule</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Workspace</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <Calendar size={32} />
                                            </div>
                                            <p className="font-bold">No reservations found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id || booking.booking_id} className="hover:bg-indigo-50/30 transition-colors group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-[15px] text-[#111834] group-hover/row:text-[#4F27E9] transition-colors">
                                                        {booking.title || 'Team Sync'}
                                                    </p>
                                                    {booking.mom_notes && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-widest border border-purple-100 animate-pulse">
                                                            <FileText size={10} /> AI Ready
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                    <UsersIcon size={12} className="opacity-70" />
                                                    {booking.user_email || 'pucho.ai member'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-bold text-gray-700">{booking.booking_date || booking.date}</p>
                                                <p className="text-[11px] font-black text-[#4F27E9] opacity-70 uppercase tracking-widest">
                                                    {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                                                <MapPin size={14} className="text-[#4F27E9]" />
                                                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                                    {booking.room_name || booking.room}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge 
                                                status={booking.status}
                                                className="px-4 py-1.5 uppercase font-black text-[10px] tracking-widest shadow-sm rounded-xl"
                                            >
                                                {booking.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenMoM(booking)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-white text-gray-400 hover:text-purple-600 rounded-xl border border-transparent hover:border-purple-100 hover:shadow-sm transition-all"
                                                    title="View AI MoM"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenModal(booking)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-white text-gray-400 hover:text-[#4F27E9] rounded-xl border border-transparent hover:border-gray-100 hover:shadow-sm transition-all disabled:opacity-30"
                                                    disabled={booking.status === 'CANCELLED'}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelClick(booking.booking_id || booking.id)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-white text-gray-400 hover:text-red-500 rounded-xl border border-transparent hover:border-red-50 hover:shadow-sm transition-all disabled:opacity-30"
                                                    disabled={booking.status === 'CANCELLED'}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredBookings.length === 0 ? (
                    <div className="bg-white p-12 rounded-[32px] border border-gray-100 text-center text-gray-400">
                        <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">No reservations found</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <div key={booking.id || booking.booking_id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-lg text-[#111834] leading-tight">{booking.title || 'Team Sync'}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                        <UsersIcon size={10} />
                                        {booking.user_email || 'pucho.ai member'}
                                    </div>
                                </div>
                                <Badge status={booking.status} className="text-[9px] px-3 font-black tracking-widest uppercase">
                                    {booking.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                                    <p className="text-xs font-bold text-gray-700 truncate">{booking.booking_date || booking.date}</p>
                                    <p className="text-[10px] font-black text-[#4F27E9] mt-0.5 whitespace-nowrap">
                                        {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Workspace</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <MapPin size={12} className="text-[#4F27E9]" />
                                        <span className="text-[11px] font-black text-gray-700 truncate">
                                            {booking.room_name || booking.room}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button 
                                    onClick={() => handleOpenMoM(booking)}
                                    className="flex-1 bg-purple-50 text-purple-600 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider border border-purple-100"
                                >
                                    <FileText size={16} /> Summary
                                </button>
                                <button 
                                    onClick={() => handleOpenModal(booking)}
                                    className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 disabled:opacity-30"
                                    disabled={booking.status === 'CANCELLED'}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleCancelClick(booking.booking_id || booking.id)}
                                    className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-400 rounded-2xl border border-red-100 disabled:opacity-30"
                                    disabled={booking.status === 'CANCELLED'}
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                initialData={editingBooking}
                onSuccess={refreshBookings}
            />

            <MoMModal 
                isOpen={isMoMModalOpen}
                onClose={() => setIsMoMModalOpen(false)}
                booking={selectedBookingForMoM}
                onSuccess={refreshBookings}
            />

            <ConfirmDialog 
                isOpen={isConfirmCancelOpen}
                onClose={() => setIsConfirmCancelOpen(false)}
                onConfirm={handleConfirmCancel}
                isLoading={loading}
                title="Cancel Booking"
                message="Are you sure you want to cancel this booking? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="No, Keep it"
                type="danger"
            />
        </div>
    );
};

export default Bookings;
