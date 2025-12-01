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
import { FileText, Users, BookOpen, Download, CheckCircle, TrendingUp, FileDown, Share2, Check, Copy, Printer, Info, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
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
  
  // Używamy hooka do zarządzania eksportem
  const { isExporting, exportToDocx, exportToPdf } = useExport(onShowToast, onShowError);
  
  // Hook do zarządzania udostępnianiem
  const { isSharing, shareUrl, shareError, createShareLink, copyShareLink } = useShare(onShowToast, onShowError);
  const [linkCopied, setLinkCopied] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        {/* Tab Navigation - Sticky przy przewijaniu */}
        <div className="sticky top-[73px] z-40 bg-slate-50 dark:bg-slate-900 pt-4 pb-2 -mt-4 -mx-4 px-4 mb-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2">
          {[
            { id: 'SUMMARY', label: 'Podsumowanie', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'EXPERTS', label: 'Opinie Ekspertów', icon: <Users className="w-4 h-4" /> },
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

  const renderSummary = useCallback(() => (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">Ryzyko Prawne</span>
            <Tooltip 
              content="Ocena ryzyka związanego z naruszeniem przepisów prawnych i możliwymi konsekwencjami prawnymi (mandaty, kary, odpowiedzialność karna)."
              icon
            />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.legalRisk)}`}>
            {data.riskAssessment.legalRisk}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">Ryzyko Finansowe</span>
            <Tooltip 
              content="Ocena kosztów wdrożenia rozwiązania oraz potencjalnych strat finansowych w przypadku braku działania."
              icon
            />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.financialRisk)}`}>
            {data.riskAssessment.financialRisk}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">Ryzyko Bezpieczeństwa</span>
            <Tooltip 
              content="Ocena realnego zagrożenia dla życia i zdrowia ludzi oraz mienia w przypadku wystąpienia zdarzenia (pożar, wypadek)."
              icon
            />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.safetyRisk)}`}>
            {data.riskAssessment.safetyRisk}
          </span>
        </div>
      </div>

      {/* Main Rec */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 text-white rounded-xl p-8 shadow-lg">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-orange-400 dark:text-orange-300">
          <CheckCircle className="w-6 h-6" />
          Rekomendacja Końcowa
        </h2>
        <div className="text-lg leading-relaxed text-gray-100 dark:text-slate-200 whitespace-pre-line text-justify">
          {formatMarkdownText(data.finalRecommendation)}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-gray-800 dark:text-slate-200">Podsumowanie sytuacji</h3>
          <Tooltip 
            content="Krótkie streszczenie problemu zidentyfikowanego w zapytaniu użytkownika."
            icon
          />
        </div>
        <p className="text-gray-600 dark:text-slate-300">{data.summary}</p>
      </div>
    </div>
  ), [data, getRiskColor]);

  const renderExperts = useCallback(() => {
    // Tryb "Informacja" - jeden agent
    if (data.mode === 'information' && 'legalExpert' in data.agents && data.agents.legalExpert) {
      return (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <AgentCard agent={data.agents.legalExpert} />
        </div>
      );
    }
    
    // Tryb "Problem" - trzy agenty
    if ('legislator' in data.agents && 'practitioner' in data.agents && 'auditor' in data.agents) {
      const { legislator, practitioner, auditor } = data.agents;
      if (legislator && practitioner && auditor) {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <AgentCard agent={legislator} />
            <AgentCard agent={practitioner} />
            <AgentCard agent={auditor} />
          </div>
        );
      }
    }
    
    return null;
  }, [data.agents, data.mode]);

  const renderCitations = useCallback(() => {
    // Najpierw deduplikuj cytowania - usuń duplikaty na podstawie source + chunkId lub znormalizowanego snippetu
    const uniqueCitations: typeof data.citations = [];
    const seenKeys = new Set<string>();
    
    for (const cite of data.citations) {
      // Stwórz unikalny klucz: source + chunkId (jeśli istnieje) lub znormalizowany snippet
      const citationKey = cite.chunkId 
        ? `${cite.source?.toLowerCase() || ''}:${cite.chunkId}`
        : `${cite.source?.toLowerCase() || ''}:${cite.snippet?.substring(0, 100).toLowerCase().trim().replace(/\s+/g, ' ') || ''}`;
      
      if (!seenKeys.has(citationKey)) {
        seenKeys.add(citationKey);
        uniqueCitations.push(cite);
      }
    }
    
    // Funkcja wyciągająca tytuł aktu prawnego (bez paragrafu/rozdziału)
    const extractBaseTitle = (source: string): string => {
      if (!source) return 'Nieznane źródło';
      // Usuń paragrafy/artykuły i rozdziały z końca
      let title = source.trim();
      // Usuń ", § 242 (Rozdział 4)" lub podobne wzorce z końca
      title = title.replace(/,\s*[§§]\s*\d+\s*\(Rozdział\s+\d+\)\s*$/i, '');
      title = title.replace(/,\s*Art\.\s*\d+\s*\(Rozdział\s+\d+\)\s*$/i, '');
      title = title.replace(/,\s*[§§]\s*\d+\s*$/i, '');
      title = title.replace(/,\s*Art\.\s*\d+\s*$/i, '');
      title = title.replace(/\s*\(Rozdział\s+\d+\)\s*$/i, '');
      return title.trim();
    };

    // Funkcja wyciągająca rozdział z source
    const extractChapter = (source: string): string | null => {
      if (!source) return null;
      const match = source.match(/\(Rozdział\s+(\d+)\)/i);
      return match ? `Rozdział ${match[1]}` : null;
    };

    // Grupuj cytowania według tytułu aktu prawnego (bez paragrafu/rozdziału)
    const groupedByTitle = uniqueCitations.reduce((acc, cite) => {
      const baseTitle = extractBaseTitle(cite.source || 'Nieznane źródło');
      
      if (!acc[baseTitle]) {
        acc[baseTitle] = {
          title: baseTitle,
          url: cite.url,
          citations: [],
          reliability: cite.reliability,
          chapters: new Map<string, typeof uniqueCitations>(), // Map rozdziałów
        };
      }
      
      acc[baseTitle].citations.push(cite);
      
      // Aktualizuj wiarygodność - użyj najwyższej z grupy
      const reliabilityOrder: Record<'Wysokie' | 'Średnie' | 'Niskie', number> = { 'Wysokie': 3, 'Średnie': 2, 'Niskie': 1 };
      const currentReliabilityValue = reliabilityOrder[cite.reliability] || 0;
      const existingReliability = acc[baseTitle].reliability as 'Wysokie' | 'Średnie' | 'Niskie';
      const existingReliabilityValue = reliabilityOrder[existingReliability] || 0;
      if (currentReliabilityValue > existingReliabilityValue) {
        acc[baseTitle].reliability = cite.reliability;
      }
      
      // Zachowaj URL jeśli obecny
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

    // Teraz dla każdego tytułu, zgrupuj cytowania według rozdziału i paragrafu
    const groupedArray = Object.values(groupedByTitle).map(group => {
      // Grupuj cytowania według rozdziału
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

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Weryfikacja Źródeł i Podstawa Prawna
          </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            System automatycznie weryfikuje cytowania w bazie aktów prawnych (ISAP, PKN).
          </p>
            </div>
            <Tooltip 
              content="Cytowania prawne są weryfikowane automatycznie. Wysoka wiarygodność oznacza potwierdzenie w oficjalnych źródłach prawnych. Niska wiarygodność może oznaczać nieaktualne lub niepotwierdzone informacje."
              icon
            />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {groupedArray.map((group, groupIndex) => {
            // Sprawdź czy wszystkie cytowania są z jednego rozdziału
            const chapters = Array.from(group.chapters.keys());
            const singleChapter = chapters.length === 1 && chapters[0] !== 'Bez rozdziału' ? chapters[0] : null;
            
            return (
              <div key={groupIndex} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                {/* Nagłówek źródła - tytuł + rozdział (jeśli jest jeden) */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <h3 className="font-semibold text-gray-900 dark:text-slate-200 flex-1">
                    {group.title}
                    {singleChapter && (
                      <span className="text-gray-600 dark:text-slate-400 font-normal">, ({singleChapter})</span>
                    )}
                  </h3>
                  <Tooltip 
                    content={
                      group.reliability === 'Wysokie' 
                        ? 'Źródło zostało zweryfikowane w oficjalnych bazach prawnych (ISAP, PKN)'
                        : group.reliability === 'Średnie'
                        ? 'Źródło wymaga dodatkowej weryfikacji lub może być częściowo nieaktualne'
                        : 'Źródło nie zostało zweryfikowane lub może być nieaktualne'
                    }
                  >
                    <div className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      transition-all duration-200 cursor-help flex-shrink-0
                      ${group.reliability === 'Wysokie' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 shadow-sm' 
                        : group.reliability === 'Średnie' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 shadow-sm' 
                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 shadow-sm'
                      }
                    `}>
                      {group.reliability === 'Wysokie' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : group.reliability === 'Średnie' ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{group.reliability}</span>
                    </div>
                  </Tooltip>
                </div>
                
                {/* Hierarchiczna struktura: Rozdziały → Paragrafy → Snippety */}
                <div className="space-y-6">
                  {Array.from(group.chapters.entries()).map(([chapter, articlesMap]) => (
                    <div key={chapter} className="space-y-4">
                      {/* Nagłówek rozdziału (tylko jeśli jest więcej niż jeden rozdział) */}
                      {!singleChapter && chapter !== 'Bez rozdziału' && (
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-2">
                          {chapter}
                        </h4>
                      )}
                      
                      {/* Paragrafy/artykuły */}
                      {Array.from(articlesMap.entries()).map(([articleNumber, citations]) => (
                        <div key={articleNumber} className="ml-4 space-y-3">
                          {/* Nagłówek paragrafu/artykułu */}
                          <h5 className="text-sm font-medium text-gray-800 dark:text-slate-200">
                            {articleNumber !== 'Bez numeru' ? articleNumber : 'Bez numeru'}
                          </h5>
                          
                          {/* Snippety pod paragrafem */}
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
                
                {/* Link do źródła - wyświetlany tylko raz na końcu grupy */}
                {group.url && (
                  <a 
                    href={group.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    Zobacz w źródle (ISAP) →
                  </a>
                )}
              </div>
            );
          })}
          {data.citations.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">Brak bezpośrednich cytowań prawnych dla tego zapytania.</div>
          )}
        </div>
      </div>
    );
  }, [data.citations]);

  const renderExport = useCallback(() => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-w-4xl mx-auto animate-fade-in my-4 min-h-[600px] flex flex-col">
       <div className="bg-gray-100 dark:bg-slate-900/50 p-4 border-b dark:border-slate-700 flex justify-between items-center no-print">
            <div className="flex items-center gap-2">
                 <FileText className="text-gray-600 dark:text-slate-400 w-5 h-5"/>
                 <span className="font-semibold text-gray-700 dark:text-slate-200">Podgląd Raportu</span>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => window.print()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
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
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
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
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'DOCX'}
                </button>
                <button 
                    onClick={() => exportToPdf(data)}
                    disabled={isExporting || isSharing}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Eksportowanie...' : 'PDF'}
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
                <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">Raport Analizy PPOŻ</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Data generowania: {new Date().toLocaleDateString()}</p>
                <div className="w-full h-px bg-gray-300 dark:bg-slate-600 mt-6"></div>
            </div>

            {/* 1. Podsumowanie Zarządcze */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">1. Podsumowanie Zarządcze</h2>
                <div className="text-justify leading-relaxed whitespace-pre-line">
                  {formatMarkdownText(data.finalRecommendation)}
                </div>
            </div>

            {/* 2. Ocena Ryzyka */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">2. Ocena Ryzyka</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Prawne</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.legalRisk)}`}>
                            {data.riskAssessment.legalRisk}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Finansowe</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.financialRisk)}`}>
                            {data.riskAssessment.financialRisk}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Ryzyko Bezpieczeństwa</div>
                        <div className={`text-lg font-bold uppercase px-3 py-1 rounded-full ${getRiskColor(data.riskAssessment.safetyRisk)}`}>
                            {data.riskAssessment.safetyRisk}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Podsumowanie sytuacji */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">3. Podsumowanie sytuacji</h2>
                <p className="text-justify leading-relaxed">{data.summary}</p>
            </div>

            {/* 4. Opinie Ekspertów / Szczegóły */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">
                    {data.mode === 'information' ? '4. Szczegóły' : '4. Opinie Ekspertów'}
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
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">5. Weryfikacja Źródeł i Podstawa Prawna</h2>
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
                                    <div key={groupIndex} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-slate-200">{group.source}</h3>
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
      label: data?.mode === 'information' ? 'Szczegóły' : 'Opinie Ekspertów', 
      icon: data?.mode === 'information' ? <Info className="w-4 h-4" /> : <Users className="w-4 h-4" />
    },
    { id: 'CITATIONS', label: 'Weryfikacja Prawna', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'EXPORT', label: 'Eksport Raportu', icon: <FileText className="w-4 h-4" /> },
  ], [data?.mode]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Tab Navigation - Sticky przy przewijaniu */}
      <div className="sticky top-[73px] z-40 bg-slate-50 dark:bg-slate-900 pt-4 pb-2 -mt-4 -mx-4 px-4 mb-6 border-b border-gray-200 dark:border-slate-700 no-print">
        <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabView)}
            disabled={isTransitioning}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 shadow-sm transform scale-105' 
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