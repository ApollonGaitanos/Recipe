import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, Globe, X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VisibilityModal({ isOpen, onClose, onConfirm, isMakingPublic }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    // Get benefits array safely
    const benefits = t('visibility.publicBenefits');
    const benefitsList = Array.isArray(benefits) ? benefits : [];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1a1a1a] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-end mb-2">
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${isMakingPublic ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {isMakingPublic ? <Globe size={32} /> : <Lock size={32} />}
                    </div>

                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        {isMakingPublic ? t('visibility.makePublicFriendly') : t('visibility.makePrivateFriendly')}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {isMakingPublic ? t('visibility.publicDesc') : t('visibility.privateDesc')}
                    </p>
                </div>

                {/* Benefits List (Only for Public) */}
                {isMakingPublic && benefitsList.length > 0 && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 mb-8 text-left space-y-3 border border-zinc-100 dark:border-zinc-800">
                        {benefitsList.map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{benefit}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg hover:brightness-110 active:scale-95 ${isMakingPublic ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-600 shadow-amber-500/20'}`}
                    >
                        {isMakingPublic ? t('visibility.makePublic') : t('visibility.makePrivate')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
