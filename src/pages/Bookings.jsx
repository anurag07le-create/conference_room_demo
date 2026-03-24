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

    // Search Logic
    const q = (searchQuery || '').toLowerCase();
    const filteredBookings = bookings.filter(b => {
        if (!q) return true;
        return (
            b.title?.toLowerCase().includes(q) ||
            b.user_email?.toLowerCase().includes(q) ||
            b.room_name?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6 animate-fade-in group/bookings">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">Booking Management</h1>
                    <p className="text-gray-500 text-sm">Manage meetings and room reservations.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={refreshBookings}
                        className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 h-11 px-5 flex items-center gap-2 rounded-full font-bold transition-all"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] h-11 px-6 flex items-center gap-2 rounded-full font-bold shadow-lg transition-all"
                    >
                        <Plus size={18} />
                        New Booking
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#111935]/[0.02] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 font-['Outfit'] uppercase tracking-wider">Meeting Details</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 font-['Outfit'] uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 font-['Outfit'] uppercase tracking-wider">Room</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 font-['Outfit'] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 font-['Outfit'] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                                        No bookings found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id || booking.booking_id} className="hover:bg-gray-50/50 transition-colors group/row">
                                        <td className="px-6 py-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[#111935]">{booking.title || 'Untitled Meeting'}</p>
                                                    {booking.mom_notes && (
                                                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-600 border-purple-100 font-black uppercase py-0 px-1.5 animate-pulse">
                                                            AI Summary Ready
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <MapPin size={12} className="text-gray-400 opacity-50" />
                                                    <p className="text-xs text-gray-400">{booking.user_email || 'admin@pucho.ai'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-600">
                                                {booking.booking_date || booking.date}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5 font-medium">
                                                {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-pucho-blue/5 border-pucho-blue/10 text-pucho-blue font-bold px-3 py-1 uppercase tracking-tighter">
                                                {booking.room_name || booking.room || 'Room'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge 
                                                status={booking.status}
                                                className="px-4 py-1.5 uppercase tracking-tighter shadow-sm"
                                            >
                                                {booking.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenMoM(booking)}
                                                    className="p-2 hover:bg-pucho-blue/5 text-gray-400 hover:text-pucho-blue rounded-lg transition-all"
                                                    title="Meeting Minutes"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenModal(booking)}
                                                    className="p-2 hover:bg-pucho-blue/5 text-gray-400 hover:text-pucho-blue rounded-lg transition-all"
                                                    disabled={booking.status === 'CANCELLED'}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelClick(booking.booking_id || booking.id)}
                                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
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
