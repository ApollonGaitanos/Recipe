import { useNavigate } from 'react-router-dom';
import { ChefHat, Globe, Sparkles, Import, BookOpen, ArrowRight, Copy, Share2, Users, Clock, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function LandingPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();

    const features = [
        {
            icon: Globe,
            title: "Discover Global Flavors",
            description: "Browse a growing collection of recipes from chefs worldwide. Find your next favorite dish in seconds.",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/10"
        },
        {
            icon: BookOpen,
            title: "Your Digital Kitchen",
            description: "Save, organize, and manage your personal cookbook. Keep your family secrets safe and accessible anywhere.",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/10"
        },
        {
            icon: Sparkles,
            title: "AI Sous-Chef",
            description: "Enhance your cooking with AI. Generate descriptions, translate recipes, and get smart suggestions instantly.",
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/10"
        },
        {
            icon: Import,
            title: "Magic Import",
            description: "Found a recipe online? Paste the URL and let our Magic Import tool extract the ingredients and steps for you.",
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/10"
        }
    ];

    return (
        <Layout>
            <div className="flex flex-col items-center">

                {/* HERO SECTION */}
                <div className="w-full max-w-4xl mx-auto text-center py-16 md:py-24 px-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20 animate-in zoom-in duration-500 overflow-hidden relative">
                        {/* Use mix-blend-multiply to make white background transparent on the gradient */}
                        <img
                            src="/logo.png"
                            alt="Opsopoiia Logo"
                            className="w-full h-full object-contain p-4 opacity-80"
                        />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                        {t('appTitle')}
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        The modern way to cook, discover, and organize your favorite recipes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/discover')}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white text-lg font-bold hover:bg-primary/90 hover:-translate-y-1 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                        >
                            <Globe size={20} />
                            Start Exploring
                        </button>
                        {!user && (
                            <button
                                onClick={() => navigate('/discover')}
                                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-lg font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                            >
                                Log In to Save
                            </button>
                        )}
                    </div>
                </div>

                {/* FEATURES GRID */}
                <div className="w-full max-w-6xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GLOSSARY SECTION */}
                <div className="w-full max-w-6xl mx-auto px-4 py-16 border-t border-gray-100 dark:border-white/5">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                            Know Your Tools
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Master your kitchen with these powerful built-in features.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[
                            { icon: Languages, label: "Translate", desc: "Instantly translate recipes to your preferred language." },
                            { icon: Users, label: "Smart Scaling", desc: "Adjust serving sizes and ingredients automatically." },
                            { icon: ChefHat, label: "Private Chef", desc: "Get AI-powered tips and ingredient substitutions." },
                            { icon: Import, label: "Magic Import", desc: "Extract recipes from any website URL." },
                            { icon: Copy, label: "Quick Copy", desc: "Copy ingredients or steps with a single click." },
                            { icon: Share2, label: "Share", desc: "Share your culinary creations with friends." },
                            { icon: Clock, label: "Timers", desc: "Keep track of prep and cooking times." },
                            { icon: Sparkles, label: "Enhance", desc: "Let AI improve your recipe descriptions." }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                                    <item.icon size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.label}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER CTA */}
                <div className="w-full bg-primary/5 dark:bg-surface-hover py-16 mt-8 rounded-3xl mx-4 max-w-[1440px] mb-8 text-center px-6">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                        Ready to cook something amazing?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Join our community of food lovers and start building your own digital cookbook today.
                    </p>
                    <button
                        onClick={() => navigate('/discover')}
                        className="px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
                    >
                        Display Recipes <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </Layout>
    );
}
