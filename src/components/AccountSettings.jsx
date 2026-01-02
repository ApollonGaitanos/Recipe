import React, { useState, useEffect } from "react";
import { User as UserIcon, Settings, LogOut, ChevronRight, Save, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabaseClient";
import Layout from "./Layout";
import LogoutModal from "./LogoutModal";

const AccountSettings = () => {
    const { user, profile, updateProfile, updateProfileTable, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    // eslint-disable-next-line no-unused-vars
    const { theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState("edit-profile");

    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        dietary: []
    });

    const [isEditing, setIsEditing] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'unavailable', null

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                username: profile?.username || user.user_metadata?.username || '',
                bio: user.user_metadata?.bio || '',
                dietary: user.user_metadata?.dietary_preferences || []
            });
        }
    }, [user, profile]);

    // specific useEffect for debounced username check
    useEffect(() => {
        if (!isEditing) return; // Don't check if not editing

        const checkUsername = async () => {
            const usernameToCheck = formData.username.trim();
            const currentUsername = profile?.username;

            // If empty or same as current, reset status
            if (!usernameToCheck || usernameToCheck === currentUsername) {
                setUsernameStatus(null);
                return;
            }

            // Only check if length > 2
            if (usernameToCheck.length < 3) {
                setUsernameStatus(null);
                return;
            }

            setUsernameStatus('checking');

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', usernameToCheck)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setUsernameStatus('unavailable');
                } else {
                    setUsernameStatus('available');
                }
            } catch (err) {
                console.error("Error checking username:", err);
                setUsernameStatus(null); // Reset on error to avoid blocking
            }
        };

        const timeoutId = setTimeout(checkUsername, 300); // 300ms debounce (faster)
        return () => clearTimeout(timeoutId);
    }, [formData.username, profile?.username, isEditing]);


    const handleSave = async () => {
        if (usernameStatus === 'unavailable') return; // Prevent save if unavailable

        setLoading(true);
        try {
            // Update Auth Metadata (Bio, Dietary)
            const { error: metaError } = await updateProfile({
                bio: formData.bio,
                dietary_preferences: formData.dietary
            });
            if (metaError) throw metaError;

            // Update Profile Table (Username)
            if (formData.username !== profile?.username) {
                const { error: profileError } = await updateProfileTable({
                    username: formData.username
                });
                if (profileError) {
                    // Fallback database check
                    if (profileError.code === '23505') {
                        setUsernameStatus('unavailable');
                        throw new Error("this username already exist");
                    }
                    throw profileError;
                }
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsEditing(false); // Disable edit mode on success
            }, 1000); // Short delay to show "Saved!"
        } catch (err) {
            console.error("Failed to update profile", err);
            // Only alert if it's NOT the username error (which is handled by UI)
            if (err.message !== "this username already exist") {
                alert(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleDietary = (option) => {
        setFormData(prev => {
            const current = prev.dietary || [];
            if (current.includes(option)) {
                return { ...prev, dietary: current.filter(item => item !== option) };
            } else {
                return { ...prev, dietary: [...current, option] };
            }
        });
    };

    const menuItems = [
        { id: "edit-profile", label: "Edit Profile", icon: UserIcon }
    ];

    return (
        <Layout fullWidth={true}>
            <div className="min-h-[calc(100vh-64px)] bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 transition-colors duration-200">
                <div className="max-w-[1280px] mx-auto">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Account Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your profile and preferences</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                                <div className="p-2 space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#17cf54]'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                {item.label}
                                                {isActive && <ChevronRight size={16} className="ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
                                    >
                                        <LogOut size={18} />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-1">
                            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-200">
                                {/* Profile Header */}
                                <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Public Profile</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">The following will be displayed in Your Kitchen</p>
                                    </div>

                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2 rounded-lg font-bold text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-all flex items-center gap-2"
                                        >
                                            <Settings size={16} />
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {/* Form */}
                                <div className="space-y-8">
                                    {/* Username Section */}
                                    <div className={`transition-all duration-200 ${!isEditing ? 'p-4 -mx-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
                                                className={`w-full transition-all outline-none ${!isEditing
                                                    ? 'bg-transparent text-lg font-medium text-gray-900 dark:text-white border-none p-0'
                                                    : usernameStatus === 'unavailable'
                                                        ? 'px-4 py-3 rounded-xl border border-red-500 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-red-200'
                                                        : usernameStatus === 'available'
                                                            ? 'px-4 py-3 rounded-xl border border-green-500 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-green-200'
                                                            : 'px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                                                    }`}
                                                placeholder="username"
                                            />
                                            {/* Validation Icons - Only show when editing */}
                                            {isEditing && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                                                    {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                                    {usernameStatus === 'unavailable' && <XCircle className="w-5 h-5 text-red-500" />}
                                                </div>
                                            )}
                                        </div>

                                        {/* Validation Feedback */}
                                        {isEditing && (
                                            <div className="mt-2 text-xs flex items-center gap-1 min-h-[1.25rem]">
                                                {usernameStatus === 'checking' && (
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Loader2 size={12} className="animate-spin" /> Checking availability...
                                                    </span>
                                                )}
                                                {usernameStatus === 'available' && (
                                                    <span className="text-green-600 font-medium">
                                                        ✓ Username is available
                                                    </span>
                                                )}
                                                {usernameStatus === 'unavailable' && (
                                                    <span className="text-red-500 font-bold">
                                                        ✕ This username is already taken
                                                    </span>
                                                )}
                                                {!usernameStatus && (
                                                    <span className="text-gray-400">Must be unique. Used for public recipes.</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bio Section */}
                                    <div className={`transition-all duration-200 ${!isEditing ? 'p-4 -mx-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bio</label>

                                        {isEditing ? (
                                            <>
                                                <textarea
                                                    maxLength={350}
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    rows={4}
                                                    className="w-full transition-all outline-none resize-none px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 dark:text-white"
                                                    placeholder="Tell us a little about yourself..."
                                                />
                                                <div className="flex justify-end mt-2">
                                                    <p className={`text-xs ${formData.bio.length > 300 ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>
                                                        {formData.bio.length} / 350 characters
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="w-full bg-transparent text-gray-800 dark:text-gray-200 border-none p-0 break-words whitespace-pre-wrap text-base">
                                                {formData.bio || "No bio added yet."}
                                            </p>
                                        )}
                                    </div>

                                    {/* Dietary Preferences */}
                                    {(!isEditing && (!formData.dietary || formData.dietary.length === 0)) ? null : (
                                        <div className={`transition-all duration-200 ${!isEditing ? 'p-4 -mx-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dietary Preferences</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo'].map((option) => (
                                                    <button
                                                        key={option}
                                                        disabled={!isEditing}
                                                        onClick={() => toggleDietary(option)}
                                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${formData.dietary?.includes(option)
                                                            ? 'bg-primary text-white shadow-md shadow-green-500/20 shadow-primary/20'
                                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-[#17cf54] dark:hover:border-[#17cf54]'
                                                            } ${!isEditing && !formData.dietary?.includes(option) ? 'hidden' : ''} ${!isEditing ? 'cursor-default pointer-events-none' : ''}`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {isEditing && (
                                        <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 animate-in fade-in slide-in-from-bottom-2">
                                            <button
                                                className="px-6 py-2.5 rounded-full font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    // Reset form to original user data
                                                    setFormData({
                                                        username: profile?.username || user.user_metadata?.username || '',
                                                        bio: user.user_metadata?.bio || '',
                                                        dietary: user.user_metadata?.dietary_preferences || []
                                                    });
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={loading || usernameStatus === 'unavailable'}
                                                className={`px-8 py-2.5 rounded-full font-bold text-white shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all ${loading || usernameStatus === 'unavailable'
                                                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                                    : 'bg-primary hover:bg-green-600 hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                {loading ? (
                                                    <span>Saving...</span>
                                                ) : success ? (
                                                    <span>Saved!</span>
                                                ) : (
                                                    <>
                                                        <Save size={18} />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
        </Layout>
    );
};

export default AccountSettings;
