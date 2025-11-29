import React from 'react';
import { AgentResponse, ExpertRole } from '../types';
import { Scale, HardHat, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AgentCardProps {
  agent: AgentResponse;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getTheme = (role: ExpertRole) => {
    switch (role) {
      case ExpertRole.LEGISLATOR:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: <Scale className="w-6 h-6" />
        };
      case ExpertRole.PRACTITIONER:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          iconColor: 'text-emerald-600',
          icon: <HardHat className="w-6 h-6" />
        };
      case ExpertRole.AUDITOR:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: <ShieldAlert className="w-6 h-6" />
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          iconColor: 'text-gray-600',
          icon: <CheckCircle2 className="w-6 h-6" />
        };
    }
  };

  const theme = getTheme(agent.role);

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} p-6 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-white rounded-full shadow-sm ${theme.iconColor}`}>
          {theme.icon}
        </div>
        <div>
          <h3 className={`font-bold text-lg ${theme.text}`}>{agent.role}</h3>
          <p className="text-sm text-gray-500 font-medium">{agent.title}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Wpływ</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${theme.iconColor.replace('text', 'bg')}`} 
                    style={{ width: `${agent.recommendationScore}%` }}
                />
            </div>
        </div>
      </div>

      <div className="prose prose-sm text-gray-700 mb-4">
        <p className="leading-relaxed">{agent.analysis}</p>
      </div>

      <div className="bg-white/60 rounded-lg p-4">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme.text} opacity-80`}>Kluczowe argumenty:</h4>
        <ul className="space-y-2">
          {agent.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${theme.iconColor.replace('text', 'bg')} flex-shrink-0`} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentCard;