import { useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LogoutModal = ({ isOpen, onClose }) => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleLogout = async () => {
        await signOut();
        onClose();
        navigate('/', { replace: true });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-surface-dark rounded-3xl p-8 max-w-sm w-full relative text-center shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogOut size={28} className="text-highlight ml-1" />
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('logout.title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    {t('logout.desc', { app: t('appTitle') })}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary hover:opacity-90 text-white font-bold rounded-full transition-colors shadow-lg shadow-primary/20"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold rounded-full transition-colors"
                    >
                        {t('nav.signOut')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
