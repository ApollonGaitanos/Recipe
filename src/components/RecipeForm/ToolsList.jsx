import React from 'react';
import { Trash2, Plus, PenTool } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ToolsList({ tools, setTools, markDirty }) {
    const { t } = useLanguage();

    // Helper to parse tools array/string into internal list
    // (This might be better in a util, but for now we keep it close to usage if it was used here)
    // Actually, parent manages state structure, so this component receives { id, text } objects.

    const handleAdd = () => {
        setTools([...tools, { id: Date.now(), text: '' }]);
        markDirty();
    };

    const handleRemove = (id) => {
        setTools(tools.filter(t => t.id !== id));
        markDirty();
    };

    const handleChange = (id, value) => {
        const newTools = tools.map(t =>
            t.id === id ? { ...t, text: value } : t
        );
        setTools(newTools);
        markDirty();
    };

    return (
        <section className="bg-white dark:bg-[#1a2c20] rounded-xl p-6 shadow-sm border border-[#dce5df] dark:border-[#2a4030]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#111813] dark:text-[#e0e6e2] flex items-center gap-2">
                    <PenTool size={20} className="text-[#63886f]" />
                    {t('form.toolsSection')}
                </h3>
            </div>

            <div className="flex flex-col gap-4">
                {tools.length === 0 && (
                    <p className="text-gray-400 italic text-sm">{t('form.noTools')}</p>
                )}

                {tools.map((tool, i) => (
                    <div key={tool.id} className="group flex flex-col sm:flex-row gap-3 sm:items-center animate-in fade-in zoom-in duration-200">
                        <div className="hidden sm:flex w-8 justify-center text-[#63886f]/40 cursor-move hover:text-[#63886f]">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                        </div>
                        <input
                            className="flex-1 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder={t('placeholders.tool')}
                            value={tool.text}
                            onChange={e => handleChange(tool.id, e.target.value)}
                        />
                        <button
                            onClick={() => handleRemove(tool.id)}
                            className="hidden group-hover:flex w-8 justify-center text-[#63886f]/60 hover:text-red-500 transition-colors"
                            title="Remove tool"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={handleAdd}
                className="mt-6 flex items-center gap-2 text-sm font-bold text-highlight hover:text-highlight/80 transition-colors"
            >
                <Plus size={18} /> {t('form.addTool')}
            </button>
        </section>
    );
}
