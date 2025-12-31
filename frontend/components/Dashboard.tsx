import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnalysisResult, TabView } from '../types';
import AgentCard from './AgentCard';
import Tooltip from './Tooltip';
import { 
  SummarySkeleton, 
  ExpertsSkeleton, 
  CitationsSkeleton, 
  ExportSkeleton 
} from './SkeletonLoaders';
import { FileText, Users, BookOpen, Download, CheckCircle, TrendingUp, FileDown, Share2, Check, Copy, Printer, Info, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, ArrowUp, Scale, HardHat, ShieldAlert, Lightbulb, Target } from 'lucide-react';
import { useExport, useShare } from '../hooks';
import { formatMarkdownText } from '../utils/textFormatter';

interface DashboardProps {
  data?: AnalysisResult;
  isLoading?: boolean;
  onShowToast?: (message: string) => void;
  onShowError?: (message: string) => void;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ data, isLoading = false, onShowToast, onShowError }) => {
  const [activeTab, setActiveTab] = useState<TabView>('SUMMARY');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTab, setDisplayTab] = useState<TabView>('SUMMARY');
  
  // State for progressive disclosure
  const [expandedSections, setExpandedSections] = useState<{
    recommendation: boolean;
    summary: boolean;
    experts: boolean;
    citations: boolean;
  }>({
    recommendation: false,
    summary: false,
    experts: false,
    citations: false,
  });
  
  // State for expanding all expert cards at once
  const [allCardsExpanded, setAllCardsExpanded] = useState(false);
  
  // Używamy hooka do zarządzania eksportem
  const { isExporting, exportToDocx, exportToPdf } = useExport(onShowToast, onShowError);
  
  // Hook do zarządzania udostępnianiem
  const { isSharing, shareUrl, shareError, createShareLink, copyShareLink } = useShare(onShowToast, onShowError);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // State for expanded citation accordions
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleCitation = useCallback((citationId: string) => {
    setExpandedCitations(prev => {
      const next = new Set(prev);
      if (next.has(citationId)) {
        next.delete(citationId);
      } else {
        next.add(citationId);
      }
      return next;
    });
  }, []);

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        {/* Tab Navigation - Sticky przy przewijaniu */}
        <div className="sticky top-[73px] z-40 bg-slate-50 dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 pt-4 pb-2 -mt-4 -mx-4 px-4 mb-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2">
          {[
            { id: 'SUMMARY', label: 'Podsumowanie', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'EXPERTS', label: 'Opinie 3 Agentów', icon: <Users className="w-4 h-4" /> },
            { id: 'CITATIONS', label: 'Weryfikacja Prawna', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'EXPORT', label: 'Eksport Raportu', icon: <FileText className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              disabled
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg text-gray-400 dark:text-slate-500 cursor-not-allowed"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          </div>
        </div>

        {/* Content Area with Skeleton Loaders */}
        <div className="min-h-[400px]">
          {activeTab === 'SUMMARY' && <SummarySkeleton />}
          {activeTab === 'EXPERTS' && <ExpertsSkeleton />}
          {activeTab === 'CITATIONS' && <CitationsSkeleton />}
          {activeTab === 'EXPORT' && <ExportSkeleton />}
        </div>
      </div>
    );
  }

  const getRiskColor = useCallback((level: string) => {
    switch (level) {
      case 'Wysokie': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'Średnie': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Niskie': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  }, []);
  
  const getRiskValue = useCallback((level: string): number => {
    switch (level) {
      case 'Wysokie': return 85;
      case 'Średnie': return 50;
      case 'Niskie': return 20;
      default: return 0;
    }
  }, []);
  
  const getRiskStrokeColor = useCallback((level: string): string => {
    switch (level) {
      case 'Wysokie': return '#ef4444';
      case 'Średnie': return '#eab308';
      case 'Niskie': return '#22c55e';
      default: return '#6b7280';
    }
  }, []);
  
  
  // Component for Risk Assessment Card with radial progress
  const RiskCard = useCallback(({ 
    label, 
    level, 
    tooltip, 
    isHighRisk 
  }: { 
    label: string; 
    level: string; 
    tooltip: string;
    isHighRisk: boolean;
  }) => {
    const value = getRiskValue(level);
    const strokeColor = getRiskStrokeColor(level);
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className={`bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-blue transition-all hover:shadow-md dark:hover:glow-blue ${isHighRisk ? 'animate-pulse-risk' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">{label}</span>
            <Tooltip content={tooltip} icon />
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-6">
          {/* Radial Progress Circle */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="50%"
                cy="50%"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-slate-700"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45"
                stroke={strokeColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${
                level === 'Wysokie' ? 'text-red-600 dark:text-red-400' :
                level === 'Średnie' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {value}%
              </span>
            </div>
          </div>
          
          {/* Risk Level Badge */}
          <div className="flex items-center">
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${getRiskColor(level)}`}>
              {level}
            </span>
          </div>
        </div>
      </div>
    );
  }, [getRiskColor, getRiskValue, getRiskStrokeColor]);

  const renderSummary = useCallback(() => {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Risk Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RiskCard
            label="Ryzyko Prawne"
            level={data.riskAssessment.legalRisk}
            tooltip="Ocena ryzyka związanego z naruszeniem przepisów prawnych i możliwymi konsekwencjami prawnymi (mandaty, kary, odpowiedzialność karna)."
            isHighRisk={data.riskAssessment.legalRisk === 'Wysokie'}
          />
          <RiskCard
            label="Ryzyko Finansowe"
            level={data.riskAssessment.financialRisk}
            tooltip="Ocena kosztów wdrożenia rozwiązania oraz potencjalnych strat finansowych w przypadku braku działania."
            isHighRisk={data.riskAssessment.financialRisk === 'Wysokie'}
          />
          <RiskCard
            label="Ryzyko Bezpieczeństwa"
            level={data.riskAssessment.safetyRisk}
            tooltip="Ocena realnego zagrożenia dla życia i zdrowia ludzi oraz mienia w przypadku wystąpienia zdarzenia (pożar, wypadek)."
            isHighRisk={data.riskAssessment.safetyRisk === 'Wysokie'}
          />
        </div>

        {/* Rekomendacja Końcowa - Hero Section */}
        {(() => {
          return (
            <div className="relative overflow-hidden rounded-2xl shadow-xl dark:shadow-orange">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black animate-gradient"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/40 via-transparent to-blue-100/40 dark:from-orange-600/20 dark:via-transparent dark:to-blue-600/20 animate-gradient-slow"></div>
              <div className="absolute inset-0 dark:glow-orange opacity-50"></div>
              
              {/* Content */}
              <div className="relative p-10 md:p-16">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 dark:bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-h2 font-semibold text-slate-900 dark:text-white dark:text-glow-white mb-0">
                        Rekomendacja Końcowa
                      </h2>
                    </div>
                  </div>
                </div>
                
                {/* Recommendation Text */}
                <div className="bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-xl p-8 md:p-10 mb-8 border border-slate-200/50 dark:border-white/20 shadow-sm">
                  <div className="text-lg md:text-xl leading-[1.6] text-slate-800 dark:text-white whitespace-pre-line text-justify">
                    {formatMarkdownText(data.finalRecommendation)}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => exportToPdf(data)}
                    disabled={isExporting || isSharing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-white/20 dark:hover:bg-white/30 disabled:bg-red-400 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white dark:text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-red-700 dark:border-white/30 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'Pobierz PDF'}
                  </button>
                  <button
                    onClick={() => exportToDocx(data)}
                    disabled={isExporting || isSharing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-white/20 dark:hover:bg-white/30 disabled:bg-blue-400 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white dark:text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-blue-700 dark:border-white/30 shadow-md"
                  >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'Pobierz DOCX'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!shareUrl) {
                        const url = await createShareLink(data);
                        if (url) {
                          const copied = await copyShareLink(url);
                          if (copied) {
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          }
                        }
                      } else {
                        const copied = await copyShareLink(shareUrl);
                        if (copied) {
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }
                      }
                    }}
                    disabled={isSharing || isExporting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-white/20 dark:hover:bg-white/30 disabled:bg-green-400 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white dark:text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-green-700 dark:border-white/30 shadow-md"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Skopiowano!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {isSharing ? 'Tworzenie...' : 'Udostępnij link'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Section Divider */}
        <div className="section-divider"></div>

        {/* Podsumowanie sytuacji - Collapsible Card */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-blue overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-gray-600 dark:text-slate-400" />
              </div>
              <div className="text-left">
                <h3 className="text-h3 font-semibold text-gray-800 dark:text-white dark:text-glow-white">Podsumowanie sytuacji</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 leading-[1.6]">
                  {expandedSections.summary 
                    ? 'Kliknij aby zwinąć' 
                    : `${data.summary.substring(0, 100)}...`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip 
                content="Krótkie streszczenie problemu zidentyfikowanego w zapytaniu użytkownika."
                icon
              />
              {expandedSections.summary ? (
                <ChevronUp className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              )}
            </div>
          </button>
          <div className={`transition-[max-height] duration-300 ease-in-out ${
            expandedSections.summary ? 'max-h-[2000px]' : 'max-h-0'
          } overflow-hidden`}>
            <div className="px-8 pb-8">
              <p className="text-gray-600 dark:text-slate-300 mt-6 leading-[1.6]">{data.summary}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [data, expandedSections, toggleSection, RiskCard, getRiskColor, isExporting, isSharing, shareUrl, linkCopied, exportToPdf, exportToDocx, createShareLink, copyShareLink]);

  // Funkcja pomocnicza do kolorowania pogrubionego tekstu zgodnie z motywem
  const highlightAnalysisWithTheme = useCallback((text: string, themeColor: string) => {
    const parts: React.ReactNode[] = [];
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
          <span key={`highlight-${lineIndex}-${partIndex++}`} className={`font-bold ${themeColor}`}>
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
  }, []);

  const renderExperts = useCallback(() => {
    // Tryb "Informacja" - jeden agent
    if (data.mode === 'information' && 'legalExpert' in data.agents && data.agents.legalExpert) {
      return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-h3 font-semibold text-gray-800 dark:text-white dark:text-glow-white mb-2">Szczegóły</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Analiza prawna od {data.agents.legalExpert.title}
            </p>
          </div>
          <AgentCard agent={data.agents.legalExpert} />
        </div>
      );
    }
    
    // Tryb "Problem" - trzy agenty
    if ('legislator' in data.agents && 'practitioner' in data.agents && 'auditor' in data.agents) {
      const { legislator, practitioner, auditor } = data.agents;
      if (legislator && practitioner && auditor) {
        // Scroll to top function
        const scrollToTop = () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        };
        
        return (
          <div className="animate-fade-in w-full max-w-7xl mx-auto relative">
            <div className="mb-6">
              <h3 className="text-h3 font-semibold text-gray-800 dark:text-white dark:text-glow-white mb-2">Opinie 3 Agentów</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Perspektywy: Prawna, Biznesowa, Audytorska
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <AgentCard 
                agent={legislator} 
                isExpanded={false}
                showButton={false}
                showExpandedContent={false}
              />
              <AgentCard 
                agent={practitioner} 
                isExpanded={false}
                showButton={false}
                showExpandedContent={false}
              />
              <AgentCard 
                agent={auditor} 
                isExpanded={false}
                showButton={false}
                showExpandedContent={false}
              />
            </div>
            
            {/* Wspólny Toggle Bar */}
            <button
              onClick={() => setAllCardsExpanded(!allCardsExpanded)}
              className="mt-6 w-full px-8 py-4 bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              {allCardsExpanded ? (
                <>
                  <span>Zwiń wszystkie opinie</span>
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Rozwiń wszystkie opinie</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
            
            {/* Rozwinięta treść - osobny kontener */}
            <div className={`transition-all duration-400 ease-out overflow-hidden ${
              allCardsExpanded ? 'max-h-[10000px] opacity-100 mt-6' : 'max-h-0 opacity-0'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Legislator - Rozwinięta treść */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                      <Scale className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-h4 font-semibold text-blue-800 dark:text-blue-300">
                      {legislator.role}
                    </h4>
                  </div>
                  <div className="prose prose-sm text-gray-700 dark:text-slate-300 mb-4">
                    <div className="leading-[1.6] text-justify whitespace-pre-line">
                      {highlightAnalysisWithTheme(legislator.analysis, 'text-blue-800 dark:text-blue-300')}
                    </div>
                  </div>
                  {legislator.keyPoints.length > 0 && (
                    <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 rounded-lg p-4">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.05em] mb-2 text-blue-700 dark:text-blue-400 opacity-80">
                        Wszystkie kluczowe argumenty:
                      </h5>
                      <ul className="space-y-1.5">
                        {legislator.keyPoints.map((point, idx) => {
                          const IconComponent = idx % 3 === 0 ? AlertCircle : idx % 3 === 1 ? CheckCircle : Lightbulb;
                          return (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300 leading-[1.6]">
                              <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Practitioner - Rozwinięta treść */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-600 dark:bg-emerald-500 rounded-lg">
                      <HardHat className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-h4 font-semibold text-emerald-800 dark:text-emerald-300">
                      {practitioner.role}
                    </h4>
                  </div>
                  <div className="prose prose-sm text-gray-700 dark:text-slate-300 mb-4">
                    <div className="leading-[1.6] text-justify whitespace-pre-line">
                      {highlightAnalysisWithTheme(practitioner.analysis, 'text-emerald-800 dark:text-emerald-300')}
                    </div>
                  </div>
                  {practitioner.keyPoints.length > 0 && (
                    <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 rounded-lg p-4">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.05em] mb-2 text-emerald-700 dark:text-emerald-400 opacity-80">
                        Wszystkie kluczowe argumenty:
                      </h5>
                      <ul className="space-y-1.5">
                        {practitioner.keyPoints.map((point, idx) => {
                          const IconComponent = idx % 3 === 0 ? TrendingUp : idx % 3 === 1 ? Target : CheckCircle;
                          return (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300 leading-[1.6]">
                              <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Auditor - Rozwinięta treść */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-h4 font-semibold text-orange-800 dark:text-orange-300">
                      {auditor.role}
                    </h4>
                  </div>
                  <div className="prose prose-sm text-gray-700 dark:text-slate-300 mb-4">
                    <div className="leading-[1.6] text-justify whitespace-pre-line">
                      {highlightAnalysisWithTheme(auditor.analysis, 'text-orange-800 dark:text-orange-300')}
                    </div>
                  </div>
                  {auditor.keyPoints.length > 0 && (
                    <div className="bg-white/60 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 rounded-lg p-4">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.05em] mb-2 text-orange-700 dark:text-orange-400 opacity-80">
                        Wszystkie kluczowe argumenty:
                      </h5>
                      <ul className="space-y-1.5">
                        {auditor.keyPoints.map((point, idx) => {
                          const IconComponent = idx % 3 === 0 ? AlertCircle : idx % 3 === 1 ? TrendingUp : Target;
                          return (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300 leading-[1.6]">
                              <IconComponent className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Wspólna strzałka przewijania w górę - widoczna tylko gdy rozwinięte */}
            {allCardsExpanded && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-95 z-50"
                title="Przewiń do góry"
                aria-label="Przewiń do góry"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            )}
          </div>
        );
      }
    }
    
    return null;
  }, [data.agents, data.mode, allCardsExpanded, highlightAnalysisWithTheme]);

  const renderCitations = useCallback(() => {
    // Deduplicate citations
    const uniqueCitations: typeof data.citations = [];
    const seenKeys = new Set<string>();
    
    for (const cite of data.citations) {
      const citationKey = cite.chunkId 
        ? `${cite.source?.toLowerCase() || ''}:${cite.chunkId}`
        : `${cite.source?.toLowerCase() || ''}:${cite.snippet?.substring(0, 100).toLowerCase().trim().replace(/\s+/g, ' ') || ''}`;
      
      if (!seenKeys.has(citationKey)) {
        seenKeys.add(citationKey);
        uniqueCitations.push(cite);
      }
    }
    
    // Extract base title (without paragraph/chapter)
    const extractBaseTitle = (source: string): string => {
      if (!source) return 'Nieznane źródło';
      let title = source.trim();
      title = title.replace(/,\s*[§§]\s*\d+\s*\(Rozdział\s+\d+\)\s*$/i, '');
      title = title.replace(/,\s*Art\.\s*\d+\s*\(Rozdział\s+\d+\)\s*$/i, '');
      title = title.replace(/,\s*[§§]\s*\d+\s*$/i, '');
      title = title.replace(/,\s*Art\.\s*\d+\s*$/i, '');
      title = title.replace(/\s*\(Rozdział\s+\d+\)\s*$/i, '');
      return title.trim();
    };

    const extractChapter = (source: string): string | null => {
      if (!source) return null;
      const match = source.match(/\(Rozdział\s+(\d+)\)/i);
      return match ? `Rozdział ${match[1]}` : null;
    };

    // Group citations by title
    const groupedByTitle = uniqueCitations.reduce((acc, cite) => {
      const baseTitle = extractBaseTitle(cite.source || 'Nieznane źródło');
      
      if (!acc[baseTitle]) {
        acc[baseTitle] = {
          title: baseTitle,
          url: cite.url,
          citations: [],
          reliability: cite.reliability,
          chapters: new Map<string, typeof uniqueCitations>(),
        };
      }
      
      acc[baseTitle].citations.push(cite);
      
      const reliabilityOrder: Record<'Wysokie' | 'Średnie' | 'Niskie', number> = { 'Wysokie': 3, 'Średnie': 2, 'Niskie': 1 };
      const currentReliabilityValue = reliabilityOrder[cite.reliability] || 0;
      const existingReliability = acc[baseTitle].reliability as 'Wysokie' | 'Średnie' | 'Niskie';
      const existingReliabilityValue = reliabilityOrder[existingReliability] || 0;
      if (currentReliabilityValue > existingReliabilityValue) {
        acc[baseTitle].reliability = cite.reliability;
      }
      
      if (cite.url && !acc[baseTitle].url) {
        acc[baseTitle].url = cite.url;
      }
      
      return acc;
    }, {} as Record<string, { 
      title: string; 
      url?: string; 
      citations: typeof uniqueCitations; 
      reliability: string;
      chapters: Map<string, typeof uniqueCitations>;
    }>);

    // Group by chapter and article
    const groupedArray = Object.values(groupedByTitle).map(group => {
      const byChapter = new Map<string, Map<string, typeof uniqueCitations>>();
      
      for (const cite of group.citations) {
        const chapter = extractChapter(cite.source || '') || 'Bez rozdziału';
        const articleNumber = cite.articleNumber || 'Bez numeru';
        
        if (!byChapter.has(chapter)) {
          byChapter.set(chapter, new Map());
        }
        
        const chapterMap = byChapter.get(chapter)!;
        if (!chapterMap.has(articleNumber)) {
          chapterMap.set(articleNumber, []);
        }
        
        chapterMap.get(articleNumber)!.push(cite);
      }
      
      return {
        ...group,
        chapters: byChapter,
      };
    });

    const getReliabilityBadge = (reliability: string) => {
      const isHigh = reliability === 'Wysokie';
      const isMedium = reliability === 'Średnie';
      
      return (
        <div className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          ${isHigh 
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700' 
            : isMedium
            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700' 
            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
          }
        `}>
          {isHigh ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : isMedium ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          <span>{reliability}</span>
        </div>
      );
    };
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
            <div className="flex items-start justify-between">
              <div>
                  <h2 className="text-h2 font-semibold text-gray-800 dark:text-white dark:text-glow-white flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Weryfikacja Źródeł i Podstawa Prawna
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 leading-[1.6]">
                  System automatycznie weryfikuje cytowania w bazie aktów prawnych (ISAP, PKN).
                </p>
              </div>
              <Tooltip 
                content="Cytowania prawne są weryfikowane automatycznie. Wysoka wiarygodność oznacza potwierdzenie w oficjalnych źródłach prawnych."
                icon
              />
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {groupedArray.map((group, groupIndex) => {
              const citationId = `citation-${groupIndex}`;
              const isExpanded = expandedCitations.has(citationId);
              const chapters = Array.from(group.chapters.keys());
              const singleChapter = chapters.length === 1 && chapters[0] !== 'Bez rozdziału' ? chapters[0] : null;
              
              return (
                <div key={groupIndex} className="overflow-hidden">
                  {/* Accordion Header - Preview */}
                  <button
                    onClick={() => toggleCitation(citationId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-200 truncate">
                          {group.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getReliabilityBadge(group.reliability)}
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {group.citations.length} {group.citations.length === 1 ? 'cytat' : group.citations.length < 5 ? 'cytaty' : 'cytatów'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {group.url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(group.url, '_blank', 'noopener,noreferrer');
                        }}
                        className="ml-4 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                        title="Otwórz pełny dokument"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Quick view
                      </button>
                    )}
                  </button>
                  
                  {/* Accordion Content - Expanded */}
                  <div className={`transition-all duration-400 ease-out overflow-hidden ${
                    isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-4 pb-4 pt-2">
                      {/* Hierarchical structure: Chapters → Articles → Snippets */}
                      <div className="space-y-6">
                        {Array.from(group.chapters.entries()).map(([chapter, articlesMap]) => (
                          <div key={chapter} className="space-y-4">
                            {!singleChapter && chapter !== 'Bez rozdziału' && (
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-2">
                                {chapter}
                              </h4>
                            )}
                            
                            {Array.from(articlesMap.entries()).map(([articleNumber, citations]) => (
                              <div key={articleNumber} className="ml-4 space-y-3">
                                <h5 className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                  {articleNumber !== 'Bez numeru' ? articleNumber : 'Bez numeru'}
                                </h5>
                                
                                <div className="ml-4 space-y-2">
                                  {citations.map((cite, citeIndex) => (
                                    <div key={citeIndex} className="border-l-4 border-gray-300 dark:border-slate-600 pl-4">
                                      <p className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-md italic font-serif">
                                        "{cite.snippet}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {data.citations.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                Brak bezpośrednich cytowań prawnych dla tego zapytania.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [data.citations, expandedCitations, toggleCitation]);

  const renderExport = useCallback(() => (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg dark:shadow-blue border border-gray-200 dark:border-slate-700 max-w-4xl mx-auto animate-fade-in my-4 min-h-[600px] flex flex-col">
       <div className="bg-gray-100 dark:bg-slate-900/50 p-4 border-b dark:border-slate-700 flex justify-between items-center no-print">
            <div className="flex items-center gap-2">
                 <FileText className="text-gray-600 dark:text-slate-400 w-5 h-5"/>
                 <span className="font-semibold text-gray-700 dark:text-slate-200">Podgląd Raportu</span>
            </div>
            <div className="flex gap-2 flex-wrap">
                <button 
                    onClick={() => window.print()}
                    className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-200 dark:border-slate-600"
                    title="Drukuj raport"
                >
                    <Printer className="w-4 h-4" />
                    Drukuj
                </button>
                <button 
                    onClick={async () => {
                      if (!shareUrl) {
                        const url = await createShareLink(data);
                        if (url) {
                          const copied = await copyShareLink(url);
                          if (copied) {
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          }
                        }
                      } else {
                        const copied = await copyShareLink(shareUrl);
                        if (copied) {
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }
                      }
                    }}
                    disabled={isSharing || isExporting}
                    className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-200 dark:border-slate-600"
                    title="Udostępnij analizę - skopiuj link"
                >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Skopiowano!
                      </>
                    ) : shareUrl ? (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopiuj link
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {isSharing ? 'Tworzenie...' : 'Udostępnij'}
                      </>
                    )}
                </button>
                <button 
                    onClick={() => exportToDocx(data)}
                    disabled={isExporting || isSharing}
                    className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-200 dark:border-slate-600"
                >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'Pobierz DOCX'}
                </button>
                <button 
                    onClick={() => exportToPdf(data)}
                    disabled={isExporting || isSharing}
                    className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-200 dark:border-slate-600"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'Pobierz PDF'}
                </button>
            </div>
            {shareError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                <strong>Błąd udostępniania:</strong> {shareError}
              </div>
            )}
       </div>
       <div className="p-12 font-serif text-gray-800 dark:text-slate-200 overflow-y-auto flex-1">
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold uppercase tracking-wide mb-2 dark:text-white dark:text-glow-white">Raport Analizy PPOŻ</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Data generowania: {new Date().toLocaleDateString()}</p>
                <div className="w-full h-px bg-gray-300 dark:bg-slate-600 mt-6"></div>
            </div>

            {/* 1. Podsumowanie Zarządcze */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-white dark:text-glow-white border-b dark:border-slate-700 pb-1">1. Podsumowanie Zarządcze</h2>
                <div className="text-justify leading-relaxed whitespace-pre-line">
                  {formatMarkdownText(data.finalRecommendation)}
                </div>
            </div>

            {/* 2. Ocena Ryzyka */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-white dark:text-glow-white border-b dark:border-slate-700 pb-1">2. Ocena Ryzyka</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 dark:shadow-blue">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Prawne</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.legalRisk)}`}>
                            {data.riskAssessment.legalRisk}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 dark:shadow-blue">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Finansowe</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.financialRisk)}`}>
                            {data.riskAssessment.financialRisk}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 dark:shadow-blue">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Bezpieczeństwa</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.safetyRisk)}`}>
                            {data.riskAssessment.safetyRisk}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Podsumowanie sytuacji */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-white dark:text-glow-white border-b dark:border-slate-700 pb-1">3. Podsumowanie sytuacji</h2>
                <p className="text-justify leading-relaxed">{data.summary}</p>
            </div>

            {/* 4. Opinie Agentów / Szczegóły */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-white dark:text-glow-white border-b dark:border-slate-700 pb-1">
                    {data.mode === 'information' ? '4. Szczegóły' : '4. Opinie Agentów'}
                </h2>
                
                {data.mode === 'information' && 'legalExpert' in data.agents && data.agents.legalExpert ? (
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200">Analiza Prawna ({data.agents.legalExpert.title})</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 italic">Szczegółowa analiza przepisów prawnych.</p>
                        <div className="text-justify whitespace-pre-line leading-relaxed">
                          {formatMarkdownText(data.agents.legalExpert.analysis)}
                        </div>
                        <div className="mt-3">
                            <p className="font-semibold text-sm mb-2">Kluczowe przepisy:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                {data.agents.legalExpert.keyPoints.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : 'legislator' in data.agents && 'practitioner' in data.agents && 'auditor' in data.agents && data.agents.legislator && data.agents.practitioner && data.agents.auditor ? (
                    <>
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">4.1. Perspektywa Prawna ({data.agents.legislator.title})</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 italic">Zgodność z przepisami prawa i normami.</p>
                            <p className="text-justify">{data.agents.legislator.analysis}</p>
                            <div className="mt-3">
                                <p className="font-semibold text-sm mb-2">Kluczowe argumenty:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                    {data.agents.legislator.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">4.2. Perspektywa Biznesowa ({data.agents.practitioner.title})</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 italic">Optymalizacja kosztów i ciągłość działania.</p>
                            <p className="text-justify">{data.agents.practitioner.analysis}</p>
                            <div className="mt-3">
                                <p className="font-semibold text-sm mb-2">Kluczowe argumenty:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                    {data.agents.practitioner.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">4.3. Analiza Ryzyka ({data.agents.auditor.title})</h3>
                            <p className="text-justify">{data.agents.auditor.analysis}</p>
                            <div className="mt-3">
                                <p className="font-semibold text-sm mb-2">Kluczowe argumenty:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                    {data.agents.auditor.keyPoints.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            {/* 5. Weryfikacja Źródeł i Podstawa Prawna */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-white dark:text-glow-white border-b dark:border-slate-700 pb-1">5. Weryfikacja Źródeł i Podstawa Prawna</h2>
                {data.citations.length > 0 ? (
                    (() => {
                        // Grupuj cytowania według źródła (tak jak w głównym widoku)
                        const groupedCitations = data.citations.reduce((acc, cite) => {
                            const source = cite.source || 'Nieznane źródło';
                            if (!acc[source]) {
                                acc[source] = {
                                    source,
                                    url: cite.url,
                                    citations: [],
                                    reliability: cite.reliability,
                                };
                            }
                            acc[source].citations.push(cite);
                            const reliabilityOrder: Record<'Wysokie' | 'Średnie' | 'Niskie', number> = { 'Wysokie': 3, 'Średnie': 2, 'Niskie': 1 };
                            const currentReliabilityValue = reliabilityOrder[cite.reliability] || 0;
                            const existingReliability = acc[source].reliability as 'Wysokie' | 'Średnie' | 'Niskie';
                            const existingReliabilityValue = reliabilityOrder[existingReliability] || 0;
                            if (currentReliabilityValue > existingReliabilityValue) {
                                acc[source].reliability = cite.reliability;
                            }
                            return acc;
                        }, {} as Record<string, { source: string; url?: string; citations: typeof data.citations; reliability: string }>);

                        const groupedArray = Object.values(groupedCitations);

                        return (
                            <div className="space-y-6">
                                {groupedArray.map((group, groupIndex) => (
                                    <div key={groupIndex} className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 dark:shadow-blue p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white dark:text-glow-white">{group.source}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-medium
                                                ${group.reliability === 'Wysokie' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                                                  group.reliability === 'Średnie' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                                                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                                Wiarygodność: {group.reliability}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {group.citations.map((cite, citeIndex) => (
                                                <p key={citeIndex} className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-md italic font-serif border-l-4 border-gray-300 dark:border-slate-600">
                                                    "{cite.snippet}"
                                                </p>
                                            ))}
                                        </div>
                                        {group.url && (
                                            <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 italic">
                                                Źródło: <a href={group.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{group.url}</a>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()
                ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400 italic">Brak bezpośrednich cytowań prawnych dla tego zapytania.</p>
                )}
            </div>
            
            <div className="mt-12 pt-8 border-t dark:border-slate-700 text-center text-xs text-gray-400 dark:text-slate-500">
                Dokument wygenerowany automatycznie przez system Doradca PPOŻ AI. Wymaga weryfikacji przez uprawnionego rzeczoznawcę.
            </div>
       </div>
    </div>
  ), [data, isExporting, isSharing, shareUrl, shareError, linkCopied, exportToDocx, exportToPdf, createShareLink, copyShareLink, getRiskColor]);

  // Handle smooth tab transitions
  useEffect(() => {
    if (activeTab !== displayTab) {
      setIsTransitioning(true);
      // Short delay for fade-out effect
      const timer = setTimeout(() => {
        setDisplayTab(activeTab);
        // Reset transitioning after animation completes
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeTab, displayTab]);

  const handleTabChange = useCallback((tabId: TabView) => {
    if (tabId !== activeTab && !isTransitioning) {
      setActiveTab(tabId);
    }
  }, [activeTab, isTransitioning]);

  const tabs = useMemo(() => [
    { id: 'SUMMARY', label: 'Podsumowanie', icon: <TrendingUp className="w-4 h-4" /> },
    { 
      id: 'EXPERTS', 
      label: data?.mode === 'information' ? 'Szczegóły' : 'Opinie Agentów', 
      icon: data?.mode === 'information' ? <Info className="w-4 h-4" /> : <Users className="w-4 h-4" />
    },
    { id: 'CITATIONS', label: 'Weryfikacja Prawna', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'EXPORT', label: 'Eksport Raportu', icon: <FileText className="w-4 h-4" /> },
  ], [data?.mode]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Tab Navigation - Sticky przy przewijaniu */}
      <div className="sticky top-[73px] z-40 bg-slate-50 dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 pt-4 pb-2 -mt-4 -mx-4 px-4 mb-6 border-b border-gray-200 dark:border-slate-700 no-print">
        <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabView)}
            disabled={isTransitioning}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 shadow-sm dark:shadow-blue transform scale-105' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }
              ${isTransitioning ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Content Area with smooth transitions */}
      <div className="min-h-[400px] relative overflow-hidden">
        <div 
          key={displayTab}
          className="tab-content-enter"
        >
          {displayTab === 'SUMMARY' && renderSummary()}
          {displayTab === 'EXPERTS' && renderExperts()}
          {displayTab === 'CITATIONS' && renderCitations()}
          {displayTab === 'EXPORT' && renderExport()}
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;