import React from 'react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LogoutModal = ({ isOpen, onClose }) => {
    const { signOut } = useAuth();

    if (!isOpen) return null;

    const handleLogout = async () => {
        await signOut();
        onClose();
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
                <div className="w-16 h-16 bg-green-50 dark:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogOut size={28} className="text-primary ml-1" />
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Leaving so soon?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    Are you sure you want to sign out of <span className="font-bold text-gray-900 dark:text-white">Οψοποιία</span>?<br />
                    Your unsaved recipes are safe with us.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary hover:bg-green-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-green-500/20"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold rounded-full transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
