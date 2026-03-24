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
            // LAYER 1: Explicit Silent Signup 
            // Note: This works best when "Confirm Email" is OFF in Supabase Dashboard
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: profileData.full_name,
                        role: profileData.role || 'EMPLOYEE',
                        department: profileData.department
                    },
                    // Prevent email confirmation redirection if possible via client
                    emailRedirectTo: window.location.origin,
                }
            });

            if (error) {
                // Precise error reporting for Rate Limits & Email send limits
                if (error.status === 429 || error.message.includes('over_email_send_rate_limit')) {
                    return { 
                        success: false, 
                        message: "Too many requests. For security, Supabase has throttled your IP/Email. Please wait 60s or use an alias (+test)." 
                    };
                }
                throw error;
            }

            if (data.user) {
                // LAYER 2: Immediate DB Induction (Atomic)
                const { error: dbError } = await supabase.from('users').upsert([{
                    user_id: data.user.id,
                    email,
                    full_name: profileData.full_name,
                    department: profileData.department,
                    role: profileData.role || 'EMPLOYEE',
                    last_login: new Date().toISOString()
                }], { onConflict: 'user_id' });

                if (dbError) throw dbError;
            }

            return { success: true, message: "Account created! Welcome to Pucho." };
        } catch (error) {
            console.error("[Auth] Registration Engine Failure:", error.message);
            return { success: false, message: error.message };
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
