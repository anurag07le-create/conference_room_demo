import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const profile = user ? {
        full_name: user.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        department: user.department,
        role: (user.role || (user.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'EMPLOYEE')).toUpperCase(),
        reminder_30min: user.reminder_30min ?? true,
        daily_report: user.daily_report ?? true,
        email_alerts: user.email_alerts ?? true,
        slack_sync: user.slack_sync ?? false
    } : null;

    useEffect(() => {
        let isMounted = true;

        const handleProfileFetch = async (sessionUser) => {
            if (!sessionUser) return null;
            try {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('user_id', sessionUser.id)
                    .single();
                return profileData ? { ...sessionUser, ...profileData } : sessionUser;
            } catch (err) {
                console.error("[Auth] Profile fetch error:", err);
                return sessionUser;
            }
        };

        const initialize = async () => {
            console.log("[Auth] initialize started");
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    const fullUser = await handleProfileFetch(session.user);
                    if (isMounted) setUser(fullUser);
                }
            } catch (err) {
                console.error("[Auth] initialize error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    console.log("[Auth] initialize complete");
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("[Auth] onAuthStateChange event:", event);
                
                if (session?.user) {
                    const fullUser = await handleProfileFetch(session.user);
                    if (isMounted) {
                        setUser(fullUser);
                        setLoading(false);
                    }
                } else {
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            });

            return subscription;
        };

        const subscriptionPromise = initialize();

        return () => {
            isMounted = false;
            subscriptionPromise.then(sub => sub?.unsubscribe());
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, message: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const signUp = async (email, password, profileData) => {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) return { success: false, message: error.message };

            if (data.user) {
                await supabase.from('users').insert([{
                    user_id: data.user.id,
                    email,
                    full_name: profileData.full_name,
                    department: profileData.department,
                    role: profileData.role || 'EMPLOYEE',
                    email_alerts: true,
                    slack_sync: false,
                    reminder_30min: true,
                    daily_report: true
                }]);
            }
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("[Auth] Logout error during signOut:", err);
        } finally {
            // ALWAYS clear user state locally
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, logout, signUp, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
