import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Calendar, Clock, Users, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const { rooms: dataRooms, refreshBookings } = useData();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        room_id: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        attendees: 1,
        description: '',
        attendee_emails: ''
    });

    const WEBHOOK_URL = import.meta.env.VITE_SMART_COMM_WEBHOOK_URL || "https://studio.pucho.ai/api/v1/webhooks/8F0t3Zmk3XRABYJ8P77k6";

    // Standardize room mapping from context
    const rooms = (dataRooms || []).map(r => ({
        ...r,
        id: r.id || r.room_id,
        name: r.room_name || r.name || 'Unnamed Room'
    }));

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const targetRoomId = initialData.room_id || initialData.id || '';
                setFormData({
                    title: initialData.title || '',
                    room_id: targetRoomId,
                    date: initialData.date || initialData.booking_date || new Date().toISOString().split('T')[0],
                    startTime: initialData.time || initialData.start_time || '',
                    endTime: initialData.end_time || (initialData.time ? `${String(parseInt(initialData.time?.split(':')[0]) + 1).padStart(2, '0')}:00` : ''),
                    description: initialData.description || '',
                    attendees: initialData.attendees || 1,
                    attendee_emails: initialData.attendee_emails || ''
                });
            } else {
                const now = new Date();
                const start = new Date(now.getTime() + 30 * 60000);
                const end = new Date(start.getTime() + 60 * 60000);

                setFormData({
                    startTime: start.toTimeString().substring(0, 5),
                    endTime: end.toTimeString().substring(0, 5),
                    title: '',
                    room_id: rooms.length > 0 ? rooms[0].id : '',
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    attendees: 1,
                    attendee_emails: ''
                });
            }
        }
    }, [isOpen, initialData, rooms.length]);

    const validate = () => {
        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);
        const now = new Date();

        if (!formData.title) return "Please enter a meeting title.";
        if (!formData.room_id) return "Please select a room.";
        if (start < now) return "Start time must be in the future.";
        if (end <= start) return "End time must be after start time.";

        const selectedRoom = rooms.find(r => r.id === formData.room_id);
        if (selectedRoom && Number(formData.attendees) > Number(selectedRoom.capacity)) {
            return `This room has a maximum capacity of ${selectedRoom.capacity}.`;
        }

        return null;
    };

    const checkConflicts = async (roomId, date, startTime, endTime, excludeId = null) => {
        const { data: existingBookings, error } = await supabase
            .from('bookings')
            .select('id, booking_id, start_time, end_time, status')
            .eq('room_id', roomId)
            .eq('booking_date', date)
            .neq('status', 'CANCELLED');

        if (error || !existingBookings) return false;

        // Simple overlap logic: (StartA < EndB) && (EndA > StartB)
        return existingBookings.some(b => {
            const bId = b.id || b.booking_id;
            if (excludeId && bId === excludeId) return false;

            const bStart = b.start_time.substring(0, 5);
            const bEnd = b.end_time.substring(0, 5);
            const sStart = startTime.substring(0, 5);
            const sEnd = endTime.substring(0, 5);

            return (sStart < bEnd) && (sEnd > bStart);
        });
    };

    const triggerWebhook = async (action, payload) => {
        const selectedRoom = rooms.find(r => r.id === payload.room_id);
        const dateRaw = payload.booking_date || payload.date;
        const start = payload.start_time;
        const end = payload.end_time;

        let startISO = '';
        let endISO = '';

        if (dateRaw && start) {
            const cleanDate = typeof dateRaw === 'string' ? dateRaw.split('T')[0] : new Date().toISOString().split('T')[0];
            const cleanStart = (start || '').substring(0, 5);
            // 🚀 Timezone Fix: Remove 'Z' to allow local time interpretation
            startISO = `${cleanDate}T${cleanStart}:00`;
        }
        if (dateRaw && end) {
            const cleanDate = typeof dateRaw === 'string' ? dateRaw.split('T')[0] : new Date().toISOString().split('T')[0];
            const cleanEnd = (end || '').substring(0, 5);
            endISO = `${cleanDate}T${cleanEnd}:00`;
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
                    room_name: selectedRoom?.room_name || 'Selected Room',
                    user_email: user?.email,
                    user_name: profile?.full_name || user?.email,
                    start_date_time: startISO,
                    end_date_time: endISO
                })
            });
        } catch (err) {
            console.error("Webhook trigger failed:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            showToast(error, "error");
            return;
        }

        setLoading(true);
        const isEditing = !!initialData?.id || !!initialData?.booking_id;
        const targetId = initialData?.id || initialData?.booking_id;

        // 🚀 Conflict Guard (Check for overlaps)
        const hasConflict = await checkConflicts(
            formData.room_id,
            formData.date,
            formData.startTime,
            formData.endTime,
            targetId
        );

        if (hasConflict) {
            showToast("This room is already occupied during the selected time.", "error");
            setLoading(false);
            return;
        }

        const payload = {
            title: formData.title,
            room_id: formData.room_id,
            booking_date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            attendees: parseInt(formData.attendees),
            description: formData.description,
            attendee_emails: formData.attendee_emails,
            user_email: user?.email || profile?.email || 'admin@pucho.ai',
            status: 'CONFIRMED'
        };

        const watchdog = setTimeout(() => {
            setLoading(false);
            onClose();
            showToast("Syncing in background...", "info");
        }, 5000);

        try {
            let dbError;
            if (isEditing && targetId) {
                const { error } = await supabase
                    .from('bookings')
                    .update(payload)
                    .match({ [targetId.toString().length > 10 ? 'booking_id' : 'id']: targetId });
                dbError = error;
            } else {
                const { error } = await supabase
                    .from('bookings')
                    .insert([payload]);
                dbError = error;
            }

            if (dbError) throw dbError;

            clearTimeout(watchdog);
            setLoading(false);
            onClose();
            showToast(isEditing ? "Meeting updated successfully!" : "Meeting booked successfully!", "success");

            if (onSuccess) onSuccess();
            if (refreshBookings) refreshBookings();

            const finalPayload = {
                ...payload,
                room_name: rooms.find(r => r.id === payload.room_id)?.name || 'Room'
            };
            triggerWebhook(isEditing ? 'edit_booking' : 'create_booking', finalPayload)
                .catch(e => console.error("Webhook Background Trace:", e.message));

        } catch (err) {
            clearTimeout(watchdog);
            showToast(err.message || "Operation failed", "error");
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id || initialData?.booking_id ? "Edit Reservation" : "Reserve Room"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Meeting Title */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={12} className="text-[#4F27E9]" />
                        Meeting Title
                    </label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Design Sprint / Client Call"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-bold text-gray-900"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Select Room - Pre-populated from context */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Room</label>
                        <select
                            required
                            value={formData.room_id}
                            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">Select a room</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendees */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendees</label>
                        <div className="relative">
                            <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.attendees}
                                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                        <input
                            required
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-gray-900">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Time</label>
                            <input
                                required
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full h-12 px-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold transition-all"
                            />
                        </div>
                        <div className="space-y-2 text-gray-900">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Time</label>
                            <input
                                required
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full h-12 px-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Attendee Emails */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee Emails</label>
                    <input
                        type="text"
                        placeholder="email1@gmail.com, email2@gmail.com"
                        value={formData.attendee_emails}
                        onChange={(e) => setFormData({ ...formData, attendee_emails: e.target.value })}
                        className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-bold text-gray-700"
                    />
                </div>

                {/* Agenda */}
                <div className="space-y-2 text-gray-900">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meeting Agenda</label>
                    <textarea
                        rows="2"
                        placeholder="What's this meeting about?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-medium text-gray-700 resize-none transition-all"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-[#4F27E9] text-white hover:bg-[#3D1DB3] rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin mx-auto text-white" /> : (initialData?.id || initialData?.booking_id ? "Update Reservation" : "Confirm Reservation")}
                </Button>
            </form>
        </Modal>
    );
};

export default BookingModal;
