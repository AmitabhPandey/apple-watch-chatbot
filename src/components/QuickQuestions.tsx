"use client";

import { QUICK_QUESTIONS } from "@/lib/constants";

interface QuickQuestionsProps {
    onSelect: (question: string) => void;
}

export const QuickQuestions = ({ onSelect }: QuickQuestionsProps) => {
    return (
        <div className="p-4 border-b border-white/20">
            <p className="text-sm text-gray-300 mb-3">
                Quick questions to get started:
            </p>
            <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((question, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(question)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                    >
                        {question}
                    </button>
                ))}
            </div>
        </div>
    );
};
