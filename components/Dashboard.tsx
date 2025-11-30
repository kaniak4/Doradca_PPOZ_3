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
import { FileText, Users, BookOpen, Download, CheckCircle, TrendingUp, FileDown, Share2, Check, Copy, Printer } from 'lucide-react';
import { useExport, useShare } from '../hooks';

interface DashboardProps {
  data?: AnalysisResult;
  isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ data, isLoading = false }) => {
  const [activeTab, setActiveTab] = useState<TabView>('SUMMARY');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTab, setDisplayTab] = useState<TabView>('SUMMARY');
  
  // Używamy hooka do zarządzania eksportem
  const { isExporting, exportToDocx, exportToPdf } = useExport();
  
  // Hook do zarządzania udostępnianiem
  const { isSharing, shareUrl, shareError, createShareLink, copyShareLink } = useShare();
  const [linkCopied, setLinkCopied] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 mb-6">
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
        <p className="text-lg leading-relaxed text-gray-100 dark:text-slate-200">
          {data.finalRecommendation}
        </p>
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

  const renderExperts = useCallback(() => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <AgentCard agent={data.agents.legislator} />
      <AgentCard agent={data.agents.practitioner} />
      <AgentCard agent={data.agents.auditor} />
    </div>
  ), [data.agents]);

  const renderCitations = useCallback(() => (
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
        {data.citations.map((cite, i) => (
          <div key={i} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-slate-200">{cite.source}</h3>
              <Tooltip 
                content={
                  cite.reliability === 'Wysokie' 
                    ? 'Źródło zostało zweryfikowane w oficjalnych bazach prawnych (ISAP, PKN)'
                    : cite.reliability === 'Średnie'
                    ? 'Źródło wymaga dodatkowej weryfikacji lub może być częściowo nieaktualne'
                    : 'Źródło nie zostało zweryfikowane lub może być nieaktualne'
                }
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium border cursor-help
                  ${cite.reliability === 'Wysokie' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 
                    cite.reliability === 'Średnie' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' : 
                    'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                Wiarygodność: {cite.reliability}
              </span>
              </Tooltip>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-md italic font-serif border-l-4 border-gray-300 dark:border-slate-600">
              "{cite.snippet}"
            </p>
            {cite.url && (
              <a href="#" className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                Zobacz w źródle (ISAP) →
              </a>
            )}
          </div>
        ))}
        {data.citations.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">Brak bezpośrednich cytowań prawnych dla tego zapytania.</div>
        )}
      </div>
    </div>
  ), [data.citations]);

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
                <p className="text-justify leading-relaxed">{data.finalRecommendation}</p>
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

            {/* 4. Opinie Ekspertów */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">4. Opinie Ekspertów</h2>
                
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
            </div>

            {/* 5. Weryfikacja Źródeł i Podstawa Prawna */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 dark:text-slate-200 border-b dark:border-slate-700 pb-1">5. Weryfikacja Źródeł i Podstawa Prawna</h2>
                {data.citations.length > 0 ? (
                    <div className="space-y-4">
                        {data.citations.map((cite, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-slate-200">Źródło {index + 1}: {cite.source}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-medium
                                        ${cite.reliability === 'Wysokie' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                                          cite.reliability === 'Średnie' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                        Wiarygodność: {cite.reliability}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-md italic font-serif border-l-4 border-gray-300 dark:border-slate-600 mt-2">
                                    "{cite.snippet}"
                                </p>
                            </div>
                        ))}
                    </div>
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
    { id: 'EXPERTS', label: 'Opinie Ekspertów', icon: <Users className="w-4 h-4" /> },
    { id: 'CITATIONS', label: 'Weryfikacja Prawna', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'EXPORT', label: 'Eksport Raportu', icon: <FileText className="w-4 h-4" /> },
  ], []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 mb-6 no-print">
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