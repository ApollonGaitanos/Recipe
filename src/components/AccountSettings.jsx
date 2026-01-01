
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRecipes } from '../context/RecipeContext';
import {
    User,
    Shield,
    Bell,
    LogOut,
    Save,
    Mail,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DIETARY_OPTIONS = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten_free', label: 'Gluten-Free' },
    { id: 'dairy_free', label: 'Dairy-Free' },
    { id: 'keto', label: 'Keto' },
    { id: 'mediterranean', label: 'Mediterranean' }
];

export default function AccountSettings() {
    const { user, updateProfile, signOut } = useAuth();
    const { t } = useLanguage();
    const { recipes } = useRecipes();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleDietary = (id) => {
        setFormData(prev => {
            const current = prev.dietary || [];
            if (current.includes(id)) {
                return { ...prev, dietary: current.filter(d => d !== id) };
            } else {
                return { ...prev, dietary: [...current, id] };
            }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await updateProfile({
                first_name: formData.firstName,
                last_name: formData.lastName,
                bio: formData.bio,
                dietary_preferences: formData.dietary,
                public_profile: formData.isPublic,
                // Fallback for older username logic
                username: `${formData.firstName} ${formData.lastName}`.trim() || user.email.split('@')[0]
            });

            if (error) throw error;
            // Show success animation or toast? For now, we just rely on button state
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Error updating profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // Calculate level based on recipe count (Mock logic)
    const recipeCount = recipes.length;
    const userLevel = recipeCount > 50 ? "Executive Chef" : recipeCount > 20 ? "Sous Chef" : recipeCount > 5 ? "Line Cook" : "Home Cook";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 px-4">
                        Settings
                    </h2>
                    <nav className="space-y-1">
                        <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-primary bg-primary/10 transition-colors">
                            <User className="w-4 h-4 mr-3" />
                            Edit Profile
                        </button>
                        <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
                            <Shield className="w-4 h-4 mr-3" />
                            Account Security
                        </button>
                        <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
                            <Bell className="w-4 h-4 mr-3" />
                            Notifications
                        </button>

                        <div className="pt-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log Out
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-text-primary">Edit Profile</h1>
                        <p className="text-text-secondary mt-1">Manage your personal information, bio, and cooking preferences.</p>
                    </div>

                    {/* Profile Overview Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-divider p-6 flex flex-col sm:flex-row items-center sm:justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            {/* No Image requested - using Initials/Icon placeholder if strictly needed, 
                                 but user said "no image". We will just show text details. 
                                 However, to match the visual weight of the reference, we can use a simpler layout.
                             */}
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">
                                    {formData.firstName || formData.lastName
                                        ? `${formData.firstName} ${formData.lastName}`
                                        : user?.email?.split('@')[0]}
                                </h2>
                                <p className="text-sm font-medium text-primary mt-1">{userLevel}</p>
                            </div>
                        </div>
                        <div className="bg-surface-hover/50 px-4 py-2 rounded-lg text-center border border-divider">
                            <span className="block text-xl font-bold text-text-primary">{recipeCount}</span>
                            <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">Total Recipes</span>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-divider p-6 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-divider bg-background-light dark:bg-background-dark text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. Alexios"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-divider bg-background-light dark:bg-background-dark text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    placeholder="e.g. Papas"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-text-primary">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-divider bg-surface-hover text-text-secondary cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-text-primary">Bio</label>
                                    <span className="text-xs text-text-tertiary">{formData.bio.length}/300</span>
                                </div>
                                <textarea
                                    name="bio"
                                    maxLength={300}
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-divider bg-background-light dark:bg-background-dark text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                                    placeholder="Tell us a bit about your culinary journey..."
                                />
                            </div>
                        </div>

                        {/* Dietary Preferences */}
                        <div className="space-y-3 pt-4 border-t border-divider">
                            <label className="text-sm font-bold text-text-primary">Dietary Preferences</label>
                            <div className="flex flex-wrap gap-3">
                                {DIETARY_OPTIONS.map(option => {
                                    const isSelected = formData.dietary.includes(option.id);
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleDietary(option.id)}
                                            className={`
                                                px-4 py-2 rounded-full text-sm font-medium border transition-all
                                                ${isSelected
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background-light dark:bg-background-dark border-divider text-text-secondary hover:border-text-secondary'}
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Public Profile Toggle */}
                        <div className="flex items-center justify-between pt-4 border-t border-divider">
                            <div>
                                <h3 className="text-sm font-bold text-text-primary">Public Profile</h3>
                                <p className="text-xs text-text-secondary mt-0.5">Allow others to see your public recipes and bio.</p>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isPublic ? 'bg-primary' : 'bg-divider'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
