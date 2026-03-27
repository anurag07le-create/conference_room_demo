import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FileText, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

const MoMModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const { showToast } = useToast();
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const MOM_BOT_WEBHOOK_URL = "https://studio.pucho.ai/api/v1/webhooks/QGd9SnHTLLRq57ezXGTJl";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!notes.trim()) {
            showToast('Please enter some meeting notes.', 'error');
            return;
        }
        setLoading(true);
        const watchdog = setTimeout(() => {
            setLoading(false);
            onClose();
            showToast("Syncing with Flow...", "info");
        }, 3000);

        try {
            // 1. Prepare Payload
            const payload = {
                action: 'generate_mom',
                booking_id: booking.id || booking.booking_id,
                title: booking.title,
                room_name: booking.room_name || booking.room,
                date: booking.booking_date || booking.date,
                start_time: booking.start_time || booking.startTime,
                end_time: booking.end_time || booking.endTime,
                attendees: booking.attendees,
                attendee_emails: booking.attendee_emails,
                description: booking.description,
                mom_notes: notes,
                timestamp: new Date().toISOString()
            };

            // 🚀 2. Immediate DB Update (Client-side reflects change instantly)
            const { error: dbError } = await supabase
                .from('bookings')
                .update({
                    mom_notes: notes
                })
                .eq('booking_id', booking.booking_id || booking.id);

            if (dbError) throw dbError;

            // 🚀 3. Trigger Pucho Studio Webhook (Background Flow Hand-off)
            fetch(MOM_BOT_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(e => console.error("MoM Webhook Flow Error:", e));

            clearTimeout(watchdog);
            showToast('AI Summary request sent and DB updated!', 'success');
            if (onSuccess) onSuccess();
            onClose();
            setNotes('');
        } catch (error) {
            clearTimeout(watchdog);
            console.error("MoM Submission Error:", error);
            showToast('Failed to save: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Meeting Minutes (MoM)">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-gray-900">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pucho-blue/10 flex items-center justify-center text-pucho-blue shrink-0">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{booking.title || 'Untitled Meeting'}</h4>
                        <p className="text-xs text-gray-500">{booking.date} • {booking.startTime} - {booking.endTime}</p>
                        <p className="text-xs text-gray-400 mt-1">Room: {booking.room}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1 flex justify-between">
                        Meeting Notes / Highlights
                        <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">AI will summarize these</span>
                    </label>
                    <textarea
                        required
                        rows="6"
                        placeholder="Type the key decisions, action items, or discussion points here..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/30 focus:border-pucho-blue transition-all resize-none text-sm leading-relaxed"
                    />
                </div>

                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100/50">
                    <p className="text-[11px] text-indigo-700 leading-tight">
                        <strong>Note:</strong> This summary will be sent to <strong>{booking.attendee_emails || 'no attendees listed'}</strong>.
                    </p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <Button type="submit" disabled={loading} className="px-8 flex items-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Send AI Summary
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default MoMModal;
