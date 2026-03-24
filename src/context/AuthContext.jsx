import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial session check (from localStorage)
    useEffect(() => {
        const storedUser = localStorage.getItem('pucho_session');
        if (storedUser) {
            try {
                const sessionUser = JSON.parse(storedUser);
                setUser(sessionUser);
            } catch (err) {
                console.error("[Auth] Session Corruption:", err);
                localStorage.removeItem('pucho_session');
            }
        }
        setLoading(false);
    }, []);

    // CUSTOM SIGNUP (No Supabase Auth)
    const signUp = async (email, password, profileData) => {
        try {
            // Check if user already exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                return { success: false, message: "User already exists with this email." };
            }

            // Hash password securely
            const hashedPassword = bcrypt.hashSync(password, 10);
            
            // Create user record in DB
            const { data, error: insertError } = await supabase
                .from('users')
                .insert([{
                    email,
                    password: hashedPassword,
                    full_name: profileData.full_name,
                    role: profileData.role || 'EMPLOYEE',
                    department: profileData.department,
                    last_login: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // Optional: Auto-login after signup
            const sessionUser = { ...data };
            delete sessionUser.password; // Don't store password in state
            
            localStorage.setItem('pucho_session', JSON.stringify(sessionUser));
            setUser(sessionUser);

            return { success: true, message: "Account created successfully!" };
        } catch (error) {
            console.error("[Auth] Custom Signup Failure:", error.message);
            return { success: false, message: error.message };
        }
    };

    // CUSTOM LOGIN (No Supabase Auth)
    const login = async (email, password) => {
        try {
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (fetchError || !userData) {
                return { success: false, message: "Invalid email or password." };
            }

            // Verify password
            const isMatch = bcrypt.compareSync(password, userData.password);
            if (!isMatch) {
                return { success: false, message: "Invalid email or password." };
            }

            // Prepare session data
            const sessionUser = { ...userData };
            delete sessionUser.password;
            
            // Atomic update (DB + State + Storage)
            await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('email', email);
            
            localStorage.setItem('pucho_session', JSON.stringify(sessionUser));
            setUser(sessionUser);

            return { success: true, message: "Login successful!" };
        } catch (error) {
            console.error("[Auth] Custom Login Failure:", error.message);
            return { success: false, message: error.message };
        }
    };

    // CUSTOM LOGOUT
    const logout = () => {
        localStorage.removeItem('pucho_session');
        setUser(null);
    };

    const value = {
        user,
        loading,
        signUp,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
