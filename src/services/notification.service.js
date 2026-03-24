import { supabase } from '../lib/supabase';

// Create notification helper function
export const createNotification = async (userId, type, title, message, bookingId = null, senderId = null) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                message,
                booking_id: bookingId,
                sender_id: senderId,
                is_read: false
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { success: false, error };
    }
};

// Notify booking created - to owner + all attendees
export const notifyBookingCreated = async (booking, ownerEmail, attendeeEmails = []) => {
    const title = 'Booking Confirmed';
    const message = `Your booking "${booking.title}" for ${booking.room_name} on ${booking.booking_date} at ${booking.start_time} has been confirmed.`;
    
    // Notify owner
    if (booking.user_id) {
        await createNotification(
            booking.user_id,
            'BOOKING_CREATED',
            title,
            message,
            booking.id
        );
    }
    
    // Notify attendees (if any invited)
    for (const email of attendeeEmails) {
        const { data: user } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', email)
            .single();
        
        if (user?.user_id) {
            await createNotification(
                user.user_id,
                'MEETING_INVITE',
                'Meeting Invitation',
                `You've been invited to "${booking.title}" on ${booking.booking_date} at ${booking.start_time}.`,
                booking.id,
                booking.user_id
            );
        }
    }
    
    // Notify all admins
    const { data: admins } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'ADMIN');
    
    for (const admin of admins || []) {
        await createNotification(
            admin.user_id,
            'BOOKING_CREATED',
            'New Booking Created',
            `${ownerEmail} created a booking "${booking.title}" for ${booking.room_name}.`,
            booking.id,
            booking.user_id
        );
    }
};

// Notify booking updated
export const notifyBookingUpdated = async (booking, ownerEmail) => {
    const title = 'Booking Updated';
    const message = `Your booking "${booking.title}" has been updated. New time: ${booking.booking_date} ${booking.start_time} - ${booking.end_time}`;
    
    // Notify owner
    if (booking.user_id) {
        await createNotification(
            booking.user_id,
            'BOOKING_UPDATED',
            title,
            message,
            booking.id
        );
    }
    
    // Notify all admins
    const { data: admins } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'ADMIN');
    
    for (const admin of admins || []) {
        await createNotification(
            admin.user_id,
            'BOOKING_UPDATED',
            'Booking Modified',
            `${ownerEmail} modified booking "${booking.title}".`,
            booking.id,
            booking.user_id
        );
    }
};

// Notify booking cancelled
export const notifyBookingCancelled = async (booking, ownerEmail, cancelledBy = 'User') => {
    const title = 'Booking Cancelled';
    const message = `Your booking "${booking.title}" for ${booking.room_name} on ${booking.booking_date} has been cancelled.`;
    
    // Notify owner
    if (booking.user_id) {
        await createNotification(
            booking.user_id,
            'BOOKING_CANCELLED',
            title,
            message,
            booking.id
        );
    }
    
    // Notify all admins
    const { data: admins } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'ADMIN');
    
    for (const admin of admins || []) {
        await createNotification(
            admin.user_id,
            'BOOKING_CANCELLED',
            'Booking Cancelled',
            `${cancelledBy} cancelled booking "${booking.title}" for ${booking.room_name}.`,
            booking.id,
            booking.user_id
        );
    }
};

// Notify room update (to all users)
export const notifyRoomUpdate = async (room, action, adminEmail) => {
    // 🚀 Disabled global broadcast to prevent notification fatigue (Observations #4, #10)
    /*
    const { data: users } = await supabase
        .from('users')
        .select('user_id');
    
    let title, message;
    ...
    */
};

// Meeting reminder
export const notifyMeetingReminder = async (booking, userId) => {
    await createNotification(
        userId,
        'REMINDER',
        'Meeting Starting Soon',
        `Your meeting "${booking.title}" starts in 30 minutes at ${booking.room_name}.`,
        booking.id
    );
};
