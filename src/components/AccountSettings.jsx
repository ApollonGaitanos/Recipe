import React, { useState, useEffect } from "react";
import { User as UserIcon, Settings, LogOut, ChevronRight, Save } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Layout from "./Layout";
import LogoutModal from "./LogoutModal";

const AccountSettings = () => {
    const { user, updateProfile, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    // eslint-disable-next-line no-unused-vars
    const { theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState("edit-profile");

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        dietary: [],
        isPublic: false
    });

    // Initialize form with user data
    useEffect(() => {
        if (user?.user_metadata) {
            setFormData({
                firstName: user.user_metadata.first_name || '',
                lastName: user.user_metadata.last_name || '',
                bio: user.user_metadata.bio || '',
                dietary: user.user_metadata.dietary_preferences || [],
                isPublic: user.user_metadata.public_profile || false
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await updateProfile({
                first_name: formData.firstName,
                last_name: formData.lastName,
                bio: formData.bio,
                dietary_preferences: formData.dietary,
                public_profile: formData.isPublic,
                username: `${formData.firstName} ${formData.lastName}`.trim() || user.email.split('@')[0]
            });

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Error updating profile. Please try again.");
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
        { id: "edit-profile", label: "Edit Profile", icon: UserIcon },
        { id: "notifications", label: "Notifications", icon: Settings },
        { id: "privacy", label: "Privacy & Security", icon: Settings },
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
                                <div className="flex items-start justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Public Profile</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">This will be displayed on your profile.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-[#17cf54] text-2xl font-bold font-serif">
                                            {formData.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                        </div>
                                        <button className="text-sm font-bold text-primary dark:text-[#17cf54] hover:underline cursor-pointer">
                                            Change Avatar
                                        </button>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                                            placeholder="Tell us a little about yourself..."
                                        />
                                        <p className="text-xs text-gray-500 mt-2 text-right">0 / 200 characters</p>
                                    </div>

                                    {/* Dietary Preferences */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Dietary Preferences</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo'].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => toggleDietary(option)}
                                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${formData.dietary?.includes(option)
                                                        ? 'bg-primary text-white shadow-md shadow-green-500/20 shadow-primary/20'
                                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-[#17cf54] dark:hover:border-[#17cf54]'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                                        <button
                                            className="px-6 py-2.5 rounded-full font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                            onClick={() => window.history.back()}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className={`px-8 py-2.5 rounded-full font-bold text-white shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all ${loading
                                                ? 'bg-gray-400 cursor-not-allowed'
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
