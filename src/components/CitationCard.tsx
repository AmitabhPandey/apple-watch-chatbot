"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Citation } from "@/types/chat";

export const CitationCard = ({ citations }: { citations: Citation[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mt-2 border-t border-white/10 pt-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
                {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
                <span>
                    {citations.length} {citations.length === 1 ? "source" : "sources"}
                </span>
            </button>

            {isExpanded && (
                <div className="mt-2 space-y-2">
                    {citations.map((citation, index) => (
                        <a
                            key={index}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                            <div className="flex flex-col gap-2">
                                {citation.imageUrl && (
                                    <div className="relative w-full h-32 mb-1 rounded-md overflow-hidden">
                                        <img
                                            src={citation.imageUrl}
                                            alt={citation.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex items-start gap-2">
                                    <ExternalLink className="w-3 h-3 mt-0.5 text-blue-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white group-hover:text-blue-200 transition-colors truncate">
                                            {citation.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {citation.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};
