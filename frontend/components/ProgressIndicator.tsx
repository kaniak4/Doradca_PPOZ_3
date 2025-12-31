import React from 'react';
import { 
  CheckCircle2, 
  Users, 
  BookOpen, 
  Database,
  FileText
} from 'lucide-react';

type ProcessingStage = 
  | 'idle' 
  | 'validating' 
  | 'analyzing' 
  | 'generating-experts' 
  | 'verifying-sources' 
  | 'complete';

interface ProgressIndicatorProps {
  stage: ProcessingStage;
  progress: number;
}

interface StageInfo {
  id: ProcessingStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime?: number; // w sekundach
}

const STAGES: StageInfo[] = [
  {
    id: 'validating',
    label: 'Walidacja zapytania',
    description: 'Sprawdzanie poprawności zapytania...',
    icon: <FileText className="w-5 h-5" />,
    estimatedTime: 1,
  },
  {
    id: 'analyzing',
    label: 'Analizowanie problemu',
    description: 'Szukam w bazie 1.2M dokumentów prawnych...',
    icon: <Database className="w-5 h-5" />,
    estimatedTime: 3,
  },
  {
    id: 'generating-experts',
    label: 'Generowanie opinii z 3 perspektyw',
    description: 'Tworzenie szczegółowej analizy...',
    icon: <Users className="w-5 h-5" />,
    estimatedTime: 4,
  },
  {
    id: 'verifying-sources',
    label: 'Weryfikacja źródeł prawnych',
    description: 'Sprawdzanie cytowań w bazach ISAP i PKN...',
    icon: <BookOpen className="w-5 h-5" />,
    estimatedTime: 2,
  },
];

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ stage, progress }) => {
  const currentStageIndex = STAGES.findIndex(s => s.id === stage);
  const currentStage = STAGES[currentStageIndex];
  const isComplete = stage === 'complete';

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-4">
      {/* Main progress indicator */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-6">
        {/* Stage steps */}
        <div className="flex items-center justify-between mb-6">
          {STAGES.map((stageInfo, index) => {
            const isActive = stage === stageInfo.id;
            const isCompleted = currentStageIndex > index || isComplete;

            return (
              <div key={stageInfo.id} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {index < STAGES.length - 1 && (
                  <div className="absolute top-5 left-[60%] right-[-40%] h-0.5 z-0">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-orange-500 dark:bg-orange-400'
                          : 'bg-gray-200 dark:bg-slate-700'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}

                {/* Icon circle */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-orange-500 dark:bg-orange-400 text-white'
                      : isActive
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-2 border-orange-500 dark:border-orange-400'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isActive ? (
                    <div className="animate-spin">
                      {stageInfo.icon}
                    </div>
                  ) : (
                    stageInfo.icon
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive || isCompleted
                        ? 'text-gray-900 dark:text-slate-200'
                        : 'text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    {stageInfo.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current stage info */}
        {currentStage && !isComplete && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <div className="animate-spin text-orange-600 dark:text-orange-400">
                    {currentStage.icon}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">
                  {currentStage.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-500 dark:bg-orange-400 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-400 whitespace-nowrap">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-semibold">Analiza zakończona pomyślnie!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;

