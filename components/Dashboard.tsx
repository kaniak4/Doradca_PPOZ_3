import React, { useState } from 'react';
import { AnalysisResult, TabView, ExpertRole } from '../types';
import AgentCard from './AgentCard';
import { FileText, Users, BookOpen, Download, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabView>('SUMMARY');

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderSummary = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Ryzyko Prawne</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.legalRisk)}`}>
            {data.riskAssessment.legalRisk}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Ryzyko Finansowe</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.financialRisk)}`}>
            {data.riskAssessment.financialRisk}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Ryzyko Bezpieczeństwa</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(data.riskAssessment.safetyRisk)}`}>
            {data.riskAssessment.safetyRisk}
          </span>
        </div>
      </div>

      {/* Main Rec */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-8 shadow-lg">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-orange-400">
          <CheckCircle className="w-6 h-6" />
          Rekomendacja Końcowa
        </h2>
        <p className="text-lg leading-relaxed text-gray-100">
          {data.finalRecommendation}
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-2">Podsumowanie sytuacji</h3>
        <p className="text-gray-600">{data.summary}</p>
      </div>
    </div>
  );

  const renderExperts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <AgentCard agent={data.agents.legislator} />
      <AgentCard agent={data.agents.practitioner} />
      <AgentCard agent={data.agents.auditor} />
    </div>
  );

  const renderCitations = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Weryfikacja Źródeł i Podstawa Prawna
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          System automatycznie weryfikuje cytowania w bazie aktów prawnych (ISAP, PKN).
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {data.citations.map((cite, i) => (
          <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{cite.source}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border
                ${cite.reliability === 'High' ? 'bg-green-50 text-green-700 border-green-200' : 
                  cite.reliability === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                  'bg-red-50 text-red-700 border-red-200'}`}>
                Wiarygodność: {cite.reliability}
              </span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic font-serif border-l-4 border-gray-300">
              "{cite.snippet}"
            </p>
            {cite.url && (
              <a href="#" className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Zobacz w źródle (ISAP) →
              </a>
            )}
          </div>
        ))}
        {data.citations.length === 0 && (
          <div className="p-8 text-center text-gray-500">Brak bezpośrednich cytowań prawnych dla tego zapytania.</div>
        )}
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto animate-fade-in my-4 min-h-[600px] flex flex-col">
       <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
                 <FileText className="text-gray-600 w-5 h-5"/>
                 <span className="font-semibold text-gray-700">Podgląd Raportu (.docx)</span>
            </div>
            <button 
                onClick={() => alert("Mock: Rozpoczynanie pobierania pliku .docx...")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
                <Download className="w-4 h-4" />
                Pobierz Raport
            </button>
       </div>
       <div className="p-12 font-serif text-gray-800 overflow-y-auto flex-1">
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">Raport Analizy PPOŻ</h1>
                <p className="text-sm text-gray-500">Data generowania: {new Date().toLocaleDateString()}</p>
                <div className="w-full h-px bg-gray-300 mt-6"></div>
            </div>

            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 border-b pb-1">1. Podsumowanie Zarządcze</h2>
                <p className="text-justify leading-relaxed">{data.finalRecommendation}</p>
            </div>

            <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 uppercase text-gray-900 border-b pb-1">2. Opinie Ekspertów</h2>
                
                <div className="mb-4">
                    <h3 className="font-bold text-gray-800">2.1. Perspektywa Prawna ({data.agents.legislator.title})</h3>
                    <p className="text-sm text-gray-600 mb-2 italic">Zgodność z przepisami prawa i normami.</p>
                    <p className="text-justify">{data.agents.legislator.analysis}</p>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-gray-800">2.2. Perspektywa Biznesowa ({data.agents.practitioner.title})</h3>
                    <p className="text-sm text-gray-600 mb-2 italic">Optymalizacja kosztów i ciągłość działania.</p>
                    <p className="text-justify">{data.agents.practitioner.analysis}</p>
                </div>

                 <div className="mb-4">
                    <h3 className="font-bold text-gray-800">2.3. Analiza Ryzyka ({data.agents.auditor.title})</h3>
                    <p className="text-justify">{data.agents.auditor.analysis}</p>
                </div>
            </div>
            
            <div className="mt-12 pt-8 border-t text-center text-xs text-gray-400">
                Dokument wygenerowany automatycznie przez system Doradca PPOŻ AI. Wymaga weryfikacji przez uprawnionego rzeczoznawcę.
            </div>
       </div>
    </div>
  );

  const tabs = [
    { id: 'SUMMARY', label: 'Podsumowanie', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'EXPERTS', label: 'Opinie Ekspertów', icon: <Users className="w-4 h-4" /> },
    { id: 'CITATIONS', label: 'Weryfikacja Prawna', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'EXPORT', label: 'Eksport Raportu', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabView)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === tab.id 
                ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'SUMMARY' && renderSummary()}
        {activeTab === 'EXPERTS' && renderExperts()}
        {activeTab === 'CITATIONS' && renderCitations()}
        {activeTab === 'EXPORT' && renderExport()}
      </div>
    </div>
  );
};

export default Dashboard;