import React, { useMemo, useState, useCallback } from 'react';
import { AgentResponse, ExpertRole } from '../types';
import Tooltip from './Tooltip';
import { Scale, HardHat, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { formatMarkdownText } from '../utils/textFormatter';

interface AgentCardProps {
  agent: AgentResponse;
  isExpanded?: boolean;
  showButton?: boolean;
  showExpandedContent?: boolean; // Czy pokazywać rozwiniętą treść w karcie
}

const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  isExpanded: controlledExpanded,
  showButton = true,
  showExpandedContent = true
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Użyj kontrolowanego state jeśli dostępny, w przeciwnym razie lokalny
  const isExpanded = controlledExpanded !== undefined 
    ? controlledExpanded 
    : internalExpanded;
  
  const setIsExpanded = (value: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(value);
    }
  };

  const theme = useMemo(() => {
    switch (agent.role) {
      case ExpertRole.LEGISLATOR:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-600 dark:bg-blue-500',
          icon: <Scale className="w-6 h-6" />,
          keyPointIcons: [
            <AlertCircle className="w-4 h-4" key="0" />,
            <CheckCircle className="w-4 h-4" key="1" />,
            <Lightbulb className="w-4 h-4" key="2" />
          ]
        };
      case ExpertRole.PRACTITIONER:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-300',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-600 dark:bg-emerald-500',
          icon: <HardHat className="w-6 h-6" />,
          keyPointIcons: [
            <TrendingUp className="w-4 h-4" key="0" />,
            <Target className="w-4 h-4" key="1" />,
            <CheckCircle className="w-4 h-4" key="2" />
          ]
        };
      case ExpertRole.AUDITOR:
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-300',
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-600 dark:bg-orange-500',
          icon: <ShieldAlert className="w-6 h-6" />,
          keyPointIcons: [
            <AlertCircle className="w-4 h-4" key="0" />,
            <TrendingUp className="w-4 h-4" key="1" />,
            <Target className="w-4 h-4" key="2" />
          ]
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-slate-800',
          border: 'border-gray-200 dark:border-slate-700',
          text: 'text-gray-800 dark:text-slate-200',
          iconColor: 'text-gray-600 dark:text-slate-400',
          bgColor: 'bg-gray-600 dark:bg-gray-500',
          icon: <CheckCircle2 className="w-6 h-6" />,
          keyPointIcons: [
            <CheckCircle className="w-4 h-4" key="0" />,
            <Lightbulb className="w-4 h-4" key="1" />,
            <Target className="w-4 h-4" key="2" />
          ]
        };
    }
  }, [agent.role]);

  // Extract TLDR (first 1-2 sentences from analysis)
  const getTLDR = useCallback(() => {
    const sentences = agent.analysis.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
  }, [agent.analysis]);

  // Get key points to show in collapsed state (2-3)
  const visibleKeyPoints = useMemo(() => agent.keyPoints.slice(0, 3), [agent.keyPoints]);

  // Get score color based on value
  const getScoreColor = useCallback((score: number) => {
    if (score >= 70) return { text: 'text-green-600 dark:text-green-400', stroke: '#22c55e' };
    if (score >= 40) return { text: 'text-yellow-600 dark:text-yellow-400', stroke: '#eab308' };
    return { text: 'text-red-600 dark:text-red-400', stroke: '#ef4444' };
  }, []);

  const scoreColor = getScoreColor(agent.recommendationScore);
  const circumference = 2 * Math.PI * 30; // radius = 30
  const offset = circumference - (agent.recommendationScore / 100) * circumference;


  // Highlight important fragments in analysis (bold text becomes colored)
  const highlightAnalysis = useCallback((text: string) => {
    // Find all bold text (**text**) and wrap in colored span
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let partIndex = 0;

    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) parts.push(<br key={`br-${lineIndex}`} />);
      
      let lineLastIndex = 0;
      const lineParts: React.ReactNode[] = [];
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lineLastIndex) {
          lineParts.push(line.substring(lineLastIndex, match.index));
        }
        lineParts.push(
          <span key={`highlight-${lineIndex}-${partIndex++}`} className={`font-bold ${theme.text}`}>
            {match[1]}
          </span>
        );
        lineLastIndex = match.index + match[0].length;
      }
      
      if (lineLastIndex < line.length) {
        lineParts.push(line.substring(lineLastIndex));
      }
      
      if (lineParts.length === 0) {
        lineParts.push(line);
      }
      
      parts.push(...lineParts);
    });
    
    return <>{parts}</>;
  }, [theme.text]);

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} shadow-sm dark:shadow-blue transition-all hover:shadow-md dark:hover:glow-blue overflow-hidden flex flex-col h-full`}>
      {/* Collapsed Header */}
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start gap-5 mb-6">
          <div className={`p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm dark:shadow-blue ${theme.iconColor} flex-shrink-0`}>
            {theme.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-h3 font-semibold ${theme.text} dark:text-white dark:text-glow-white mb-2`}>{agent.role}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-normal leading-[1.6]">{agent.title}</p>
          </div>
          
          {/* Radial Score Gauge */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <Tooltip content={`Ocena wpływu: ${agent.recommendationScore}/100`}>
              <svg className="transform -rotate-90 w-20 h-20 cursor-help">
                <circle
                  cx="50%"
                  cy="50%"
                  r="30"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-slate-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="30"
                  stroke={scoreColor.stroke}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreColor.text}`}>
                  {agent.recommendationScore}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* TLDR Section */}
        <div className="mb-6 p-4 bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-700">
          <p className="text-sm font-normal text-gray-700 dark:text-slate-300 italic leading-[1.6]">
            {getTLDR()}
          </p>
        </div>

        {/* Key Points (2-3 visible) */}
        <div className="space-y-3 flex-grow">
          {visibleKeyPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300 leading-[1.6]">
              <div className={`mt-0.5 ${theme.iconColor} flex-shrink-0`}>
                {theme.keyPointIcons[idx % theme.keyPointIcons.length]}
              </div>
              <span className="flex-1">{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {showButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full px-8 py-4 border-t ${theme.border} ${theme.bg} hover:bg-opacity-80 dark:hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2 ${theme.text} font-semibold text-sm flex-shrink-0`}
        >
          {isExpanded ? (
            <>
              <span>Zwiń</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Czytaj więcej</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Expanded Content */}
      {showExpandedContent && (
        <div className={`transition-all duration-400 ease-out overflow-hidden relative ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className={`px-8 pb-6 pt-4 border-t ${theme.border}`}>
          <div className="prose prose-sm text-gray-700 dark:text-slate-300 mb-4">
            <div className="leading-[1.6] text-justify whitespace-pre-line">
              {highlightAnalysis(agent.analysis)}
            </div>
          </div>

          {/* All Key Points */}
          {agent.keyPoints.length > 3 && (
            <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 rounded-lg p-4">
              <h4 className={`text-xs font-semibold uppercase tracking-[0.05em] mb-3 ${theme.text} opacity-80`}>
                Wszystkie kluczowe argumenty:
              </h4>
              <ul className="space-y-2">
                {agent.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300 leading-[1.6]">
                    <div className={`mt-0.5 ${theme.iconColor} flex-shrink-0`}>
                      {theme.keyPointIcons[idx % theme.keyPointIcons.length]}
                    </div>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
      )}
    </div>
  );
};

export default React.memo(AgentCard);