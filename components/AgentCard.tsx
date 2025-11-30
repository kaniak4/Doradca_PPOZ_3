import React, { useMemo } from 'react';
import { AgentResponse, ExpertRole } from '../types';
import Tooltip from './Tooltip';
import { Scale, HardHat, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AgentCardProps {
  agent: AgentResponse;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const theme = useMemo(() => {
    switch (agent.role) {
      case ExpertRole.LEGISLATOR:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          iconColor: 'text-blue-600 dark:text-blue-400',
          icon: <Scale className="w-6 h-6" />
        };
      case ExpertRole.PRACTITIONER:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-300',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          icon: <HardHat className="w-6 h-6" />
        };
      case ExpertRole.AUDITOR:
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-300',
          iconColor: 'text-orange-600 dark:text-orange-400',
          icon: <ShieldAlert className="w-6 h-6" />
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-slate-800',
          border: 'border-gray-200 dark:border-slate-700',
          text: 'text-gray-800 dark:text-slate-200',
          iconColor: 'text-gray-600 dark:text-slate-400',
          icon: <CheckCircle2 className="w-6 h-6" />
        };
    }
  }, [agent.role]);

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} p-6 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm ${theme.iconColor}`}>
          {theme.icon}
        </div>
        <div>
          <h3 className={`font-bold text-lg ${theme.text}`}>{agent.role}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{agent.title}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Tooltip content="Ocena wpływu rekomendacji eksperta na ostateczną decyzję (0-100). Wyższa wartość oznacza większe znaczenie opinii.">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 cursor-help">Wpływ</span>
            </Tooltip>
            <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${theme.iconColor.replace('text', 'bg')}`} 
                    style={{ width: `${agent.recommendationScore}%` }}
                />
            </div>
        </div>
      </div>

      <div className="prose prose-sm text-gray-700 dark:text-slate-300 mb-4">
        <p className="leading-relaxed">{agent.analysis}</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme.text} opacity-80`}>Kluczowe argumenty:</h4>
        <ul className="space-y-2">
          {agent.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${theme.iconColor.replace('text', 'bg')} flex-shrink-0`} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default React.memo(AgentCard);