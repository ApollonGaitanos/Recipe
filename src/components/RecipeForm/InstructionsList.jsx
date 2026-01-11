import React from 'react';
import { Trash2, Plus, List } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function InstructionsList({ instructions, setInstructions, markDirty }) {
    const { t } = useLanguage();

    const handleAdd = () => {
        setInstructions([...instructions, { id: Date.now(), text: '' }]);
        markDirty();
    };

    const handleRemove = (id) => {
        setInstructions(instructions.filter(step => step.id !== id));
        markDirty();
    };

    const handleChange = (id, value) => {
        const newInstructions = instructions.map(step =>
            step.id === id ? { ...step, text: value } : step
        );
        setInstructions(newInstructions);
        markDirty();
    };

    return (
        <section className="bg-white dark:bg-[#1a2c20] rounded-xl p-6 shadow-sm border border-[#dce5df] dark:border-[#2a4030]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#111813] dark:text-[#e0e6e2] flex items-center gap-2">
                    <List size={20} className="text-[#63886f]" />
                    {t('form.instructions')}
                </h3>
            </div>

            <div className="flex flex-col gap-6">
                {instructions.map((step, i) => (
                    <div key={step.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f5e9] dark:bg-[#2a4030] text-xs font-bold text-[#63886f] dark:text-[#8ca395]">
                                {i + 1}
                            </span>
                            {/* Connector Line */}
                            {i < instructions.length - 1 && (
                                <div className="w-px h-full bg-gray-200 dark:bg-white/5 mx-auto" />
                            )}
                        </div>

                        <div className="flex-1">
                            <textarea
                                className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary min-h-[80px] text-gray-800 dark:text-gray-200"
                                placeholder={t('placeholders.step', { number: i + 1 })}
                                value={step.text}
                                onChange={e => handleChange(step.id, e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => handleRemove(step.id)}
                            className="hidden group-hover:flex w-8 justify-start pt-3 text-[#63886f]/60 hover:text-red-500 transition-colors"
                            title="Remove step"
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
                <Plus size={18} /> {t('form.addStep')}
            </button>
        </section>
    );
}
