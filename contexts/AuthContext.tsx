
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { Session, User, SupabaseClient, Provider } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../supabaseClient'; 
import { createProfile as createProfileInDb, updateProfile, getUserProfile } from '../services/databaseService';
import { useToast } from '../hooks/useToast';

const DEV_BYPASS_LOGIN = false;

interface AuthContextType {
    supabase: SupabaseClient;
    session: Session | null;
    user: User | null;
    profile: Profile | null | undefined; 
    profileError: string | null;
    providers: string[];
    loading: boolean;
    geminiApiKey: string | null;
    openRouterApiKey: string | null;
    tavilyApiKey: string | null; 
    scrapingAntApiKey: string | null; 
    isAdmin: boolean;
    isImpersonating: boolean;
    isGuest: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithRoblox: () => Promise<void>; 
    signInWithPassword: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    continueAsGuest: () => void;
    saveGeminiApiKey: (key: string) => Promise<void>;
    saveOpenRouterApiKey: (key: string) => Promise<void>;
    saveTavilyApiKey: (key: string) => Promise<void>; 
    saveScrapingAntApiKey: (key: string) => Promise<void>; 
    setGeminiApiKey: (key: string | null) => void;
    setOpenRouterApiKey: (key: string | null) => void;
    createProfile: (displayName: string) => Promise<void>;
    updateUserProfile: (updates: Partial<Profile>, fetchAfter?: boolean) => Promise<void>;
    loginAsAdmin: () => void;
    logoutAdmin: () => void;
    impersonateUser: (profileToImpersonate: Profile) => void;
    stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Guest Profile Mock
const GUEST_PROFILE: Profile = {
    id: 'guest',
    roblox_id: 'guest',
    roblox_username: 'Guest User',
    avatar_url: '',
    credits: 0,
    membership: 'na',
    preferred_chat_model: 'gemini-2.5-flash',
    preferred_image_model: 'nano_banana',
    role: 'user',
    ui_theme: 'dark' // Force dark mode for guests
};

const GUEST_USER: User = {
    id: 'guest',
    app_metadata: {},
    user_metadata: {},
    aud: 'guest',
    created_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [providers, setProviders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
    const [openRouterApiKey, setOpenRouterApiKey] = useState<string | null>(null);
    const [tavilyApiKey, setTavilyApiKey] = useState<string | null>(null);
    const [scrapingAntApiKey, setScrapingAntApiKey] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [originalAdminState, setOriginalAdminState] = useState<{ session: Session; user: User; profile: Profile } | null>(null);

    // Load guest state from local storage on boot
    useEffect(() => {
        // Enforce dark mode globally
        document.documentElement.classList.add('dark');
        
        const storedGuest = localStorage.getItem('is_guest_session');
        if (storedGuest === 'true') {
            setIsGuest(true);
            setUser(GUEST_USER);
            setProfile(GUEST_PROFILE);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isGuest) return; // Skip DB checks if guest

        const resolveUserSession = async (currentSession: Session | null, shouldSetLoading = true) => {
            if (originalAdminState) { setLoading(false); return; }

            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            setUser(currentUser);
            setProviders(currentUser?.identities?.map(i => i.provider as string) ?? []);

            let userIsAdmin = false;

            if (currentUser) {
                try {
                    const profileData = await getUserProfile(supabase, currentUser.id);
                    
                    if (profileData) {
                        if (profileData.role === 'admin') {
                            userIsAdmin = true;
                        } else {
                            sessionStorage.removeItem('isAdmin');
                            userIsAdmin = false;
                        }
                    }

                    setProfile(profileData);
                    setGeminiApiKey(profileData?.gemini_api_key || null);
                    setOpenRouterApiKey(profileData?.openrouter_api_key || null);
                    setTavilyApiKey(profileData?.tavily_api_key || null);
                    setScrapingAntApiKey(profileData?.scrapingant_api_key || null);
                    setProfileError(null);
                } catch (error: any) {
                    setProfileError("Could not load your profile. Please check your internet connection.");
                    setProfile(null);
                }
            } else {
                setProfile(null);
                setGeminiApiKey(null);
                setOpenRouterApiKey(null);
                setTavilyApiKey(null);
                setScrapingAntApiKey(null);
                userIsAdmin = false;
            }
            setIsAdmin(userIsAdmin);
            if (shouldSetLoading) setLoading(false);
        };

        if (!isGuest) {
            setLoading(true);
            supabase.auth.getSession().then(({ data: { session } }) => resolveUserSession(session));
            
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'TOKEN_REFRESHED') {
                    setSession(session);
                } else if (event === 'SIGNED_IN') {
                    await resolveUserSession(session, false);
                } else {
                    if (!isGuest) { // Don't wipe guest state on random auth events unless explicit
                        setLoading(true);
                        await resolveUserSession(session);
                    }
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [originalAdminState, isGuest]);

    const clearGuestSession = () => {
        localStorage.removeItem('is_guest_session');
        setIsGuest(false);
    };

    const signInWithProvider = async (provider: Provider) => {
        clearGuestSession();
        await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    };
    const signInWithGoogle = () => signInWithProvider('google');
    const signInWithRoblox = () => signInWithProvider('roblox' as Provider);
    const signInWithPassword = async (email: string, password: string) => {
        clearGuestSession();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };
    const signUpWithEmail = async (email: string, password: string) => {
        clearGuestSession();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
    }
    const signOut = async () => {
        if (!isGuest) await supabase.auth.signOut();
        clearGuestSession();
        setSession(null); setUser(null); setProfile(null); setProviders([]); 
        setGeminiApiKey(null); setOpenRouterApiKey(null); setTavilyApiKey(null); setScrapingAntApiKey(null);
        if (isAdmin) logoutAdmin();
    };

    const continueAsGuest = () => {
        localStorage.setItem('is_guest_session', 'true');
        setIsGuest(true);
        setUser(GUEST_USER);
        setProfile(GUEST_PROFILE);
        setLoading(false);
    };
    
    const saveGeminiApiKey = async (key: string) => {
        if (isGuest) {
            setGeminiApiKey(key);
            return;
        }
        if (!user) throw new Error("User not authenticated.");
        await updateProfile(supabase, user.id, { gemini_api_key: key });
        setGeminiApiKey(key);
    };

    const saveOpenRouterApiKey = async (key: string) => {
        if (isGuest) {
            setOpenRouterApiKey(key);
            return;
        }
        if (!user) throw new Error("User not authenticated.");
        await updateProfile(supabase, user.id, { openrouter_api_key: key });
        setOpenRouterApiKey(key);
    };

    const saveTavilyApiKey = async (key: string) => {
        if (!user) return;
        await updateProfile(supabase, user.id, { tavily_api_key: key });
        setTavilyApiKey(key);
    };

    const saveScrapingAntApiKey = async (key: string) => {
        if (!user) return;
        await updateProfile(supabase, user.id, { scrapingant_api_key: key });
        setScrapingAntApiKey(key);
    };

    const createProfile = async (displayName: string) => {
        if (!user) throw new Error("User not authenticated.");
        setLoading(true);
        try {
            const newProfile = await createProfileInDb(supabase, user.id, displayName, user.user_metadata.avatar_url || '');
            setProfile(newProfile);
        } finally { setLoading(false); }
    };
    const updateUserProfile = async (updates: Partial<Profile>, fetchAfter: boolean = true) => {
        if (isGuest) {
            setProfile(prev => ({ ...(prev || GUEST_PROFILE), ...updates }));
            return;
        }
        if (!user) throw new Error("User not authenticated.");
        const updatedProfile = await updateProfile(supabase, user.id, updates);
        if (fetchAfter) {
            setProfile(prev => ({ ...(prev || {}), ...updatedProfile }));
        }
    };
    const loginAsAdmin = () => { sessionStorage.setItem('isAdmin', 'true'); setIsAdmin(true); };
    const logoutAdmin = () => { sessionStorage.removeItem('isAdmin'); setIsAdmin(false); };
    const impersonateUser = (profileToImpersonate: Profile) => {
        if (!isAdmin || !session || !user || !profile) return;
        setOriginalAdminState({ session, user, profile });
        const impersonatedUser: User = { ...user, id: profileToImpersonate.id, email: `impersonating@bubble.ai`, user_metadata: { ...user.user_metadata, name: profileToImpersonate.roblox_username, avatar_url: profileToImpersonate.avatar_url }};
        const impersonatedSession: Session = { ...session, user: impersonatedUser };
        setSession(impersonatedSession); 
        setUser(impersonatedUser); 
        setProfile(profileToImpersonate); 
        setGeminiApiKey(profileToImpersonate.gemini_api_key || null); 
        setOpenRouterApiKey(profileToImpersonate.openrouter_api_key || null);
        setTavilyApiKey(profileToImpersonate.tavily_api_key || null);
        setScrapingAntApiKey(profileToImpersonate.scrapingant_api_key || null);
        setIsAdmin(false);
    };
    const stopImpersonating = () => {
        if (!originalAdminState) return;
        setSession(originalAdminState.session); 
        setUser(originalAdminState.user); 
        setProfile(originalAdminState.profile); 
        setGeminiApiKey(originalAdminState.profile.gemini_api_key || null); 
        setOpenRouterApiKey(originalAdminState.profile.openrouter_api_key || null);
        setTavilyApiKey(originalAdminState.profile.tavily_api_key || null);
        setScrapingAntApiKey(originalAdminState.profile.scrapingant_api_key || null);
        setOriginalAdminState(null); 
        setIsAdmin(true);
    };

    const value: AuthContextType = { 
        supabase, session, user, profile, profileError, providers, loading, 
        geminiApiKey, openRouterApiKey, tavilyApiKey, scrapingAntApiKey, isAdmin, isGuest,
        isImpersonating: originalAdminState !== null, 
        signInWithGoogle, signInWithRoblox, signInWithPassword, signUpWithEmail, resetPassword, signOut, continueAsGuest,
        saveGeminiApiKey, saveOpenRouterApiKey, saveTavilyApiKey, saveScrapingAntApiKey,
        setGeminiApiKey, setOpenRouterApiKey, 
        createProfile, updateUserProfile, loginAsAdmin, logoutAdmin, impersonateUser, stopImpersonating 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
