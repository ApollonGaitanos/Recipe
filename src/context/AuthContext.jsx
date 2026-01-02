/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data);
        } else {
            console.error("Error fetching profile:", error);
            // Fallback: create one if missing? (Trigger should handle it, but fallback is safe)
            setProfile(null);
        }
    };

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            else setProfile(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });
        return { data, error };
    };

    const updateProfile = async (data) => {
        const { data: { user }, error } = await supabase.auth.updateUser({
            data: data
        });

        if (user) {
            setUser(user);
        }

        return { data: user, error };
    };

    const updateProfileTable = async (updates) => {
        if (!user) return { error: { message: "No user logged in" } };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (data) {
            setProfile(data);
        }
        return { data, error };
    };

    const value = {
        user,
        profile,
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signUp,
        updateProfile,
        updateProfileTable,
        signOut: async () => {
            setUser(null);
            setProfile(null);
            await supabase.auth.signOut();
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
