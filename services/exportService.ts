import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { AnalysisResult } from '../types';
import { PDFReport, registerPolishFont } from './pdfReport';

export const exportToDocx = async (data: AnalysisResult) => {
  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'Wysokie':
      case 'High': return 'WYSOKIE';
      case 'Średnie':
      case 'Medium': return 'ŚREDNIE';
      case 'Niskie':
      case 'Low': return 'NISKIE';
      default: return risk.toUpperCase();
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Wysokie':
      case 'High': return 'DC2626'; // red-600
      case 'Średnie':
      case 'Medium': return 'D97706'; // yellow-600
      case 'Niskie':
      case 'Low': return '16A34A'; // green-600
      default: return '4B5563'; // gray-600
    }
  };

  const currentDate = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Nagłówek
          new Paragraph({
            text: "RAPORT ANALIZY PPOŻ",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Data generowania: ${currentDate}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "",
            spacing: { after: 200 },
          }),

          // 1. Podsumowanie Zarządcze
          new Paragraph({
            text: "1. Podsumowanie Zarządcze",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: data.finalRecommendation,
            spacing: { after: 400 },
          }),

          // 2. Ocena Ryzyka
          new Paragraph({
            text: "2. Ocena Ryzyka",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            columnWidths: [4505, 4505],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: "Ryzyko Prawne",
                        bold: true,
                      })],
                    })],
                    width: { size: 4505, type: WidthType.DXA },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: getRiskText(data.riskAssessment.legalRisk),
                        bold: true,
                        color: getRiskColor(data.riskAssessment.legalRisk),
                      })],
                    })],
                    width: { size: 4505, type: WidthType.DXA },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: "Ryzyko Finansowe",
                        bold: true,
                      })],
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: getRiskText(data.riskAssessment.financialRisk),
                        bold: true,
                        color: getRiskColor(data.riskAssessment.financialRisk),
                      })],
                    })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: "Ryzyko Bezpieczeństwa",
                        bold: true,
                      })],
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: getRiskText(data.riskAssessment.safetyRisk),
                        bold: true,
                        color: getRiskColor(data.riskAssessment.safetyRisk),
                      })],
                    })],
                  }),
                ],
              }),
            ],
            width: { size: 9010, type: WidthType.DXA },
          }),
          new Paragraph({
            text: "",
            spacing: { after: 400 },
          }),

          // 3. Podsumowanie sytuacji
          new Paragraph({
            text: "3. Podsumowanie sytuacji",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: data.summary,
            spacing: { after: 400 },
          }),

          // 4. Opinie Ekspertów
          new Paragraph({
            text: "4. Opinie Ekspertów",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // 4.1. Perspektywa Prawna
          new Paragraph({
            text: `4.1. Perspektywa Prawna (${data.agents.legislator.title})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: "Zgodność z przepisami prawa i normami.",
            italics: true,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.agents.legislator.analysis,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Kluczowe argumenty:",
            bold: true,
            spacing: { before: 200, after: 100 },
          }),
          ...data.agents.legislator.keyPoints.map(point => 
            new Paragraph({
              text: `• ${point}`,
              spacing: { after: 100 },
            })
          ),
          new Paragraph({
            text: "",
            spacing: { after: 300 },
          }),

          // 4.2. Perspektywa Biznesowa
          new Paragraph({
            text: `4.2. Perspektywa Biznesowa (${data.agents.practitioner.title})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: "Optymalizacja kosztów i ciągłość działania.",
            italics: true,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.agents.practitioner.analysis,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Kluczowe argumenty:",
            bold: true,
            spacing: { before: 200, after: 100 },
          }),
          ...data.agents.practitioner.keyPoints.map(point => 
            new Paragraph({
              text: `• ${point}`,
              spacing: { after: 100 },
            })
          ),
          new Paragraph({
            text: "",
            spacing: { after: 300 },
          }),

          // 4.3. Analiza Ryzyka
          new Paragraph({
            text: `4.3. Analiza Ryzyka (${data.agents.auditor.title})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: data.agents.auditor.analysis,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Kluczowe argumenty:",
            bold: true,
            spacing: { before: 200, after: 100 },
          }),
          ...data.agents.auditor.keyPoints.map(point => 
            new Paragraph({
              text: `• ${point}`,
              spacing: { after: 100 },
            })
          ),
          new Paragraph({
            text: "",
            spacing: { after: 400 },
          }),

          // 5. Weryfikacja Prawna
          ...(data.citations.length > 0 ? [
            new Paragraph({
              text: "5. Weryfikacja Źródeł i Podstawa Prawna",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...data.citations.flatMap((cite, index) => [
              new Paragraph({
                text: `Źródło ${index + 1}: ${cite.source}`,
                bold: true,
                spacing: { before: index > 0 ? 200 : 0, after: 100 },
              }),
              new Paragraph({
                text: `Wiarygodność: ${cite.reliability}`,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: `"${cite.snippet}"`,
                italics: true,
                spacing: { after: 200 },
              }),
            ]),
          ] : [
            new Paragraph({
              text: "5. Weryfikacja Źródeł i Podstawa Prawna",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "Brak bezpośrednich cytowań prawnych dla tego zapytania.",
              italics: true,
              spacing: { after: 200 },
            }),
          ]),

          // Stopka
          new Paragraph({
            text: "",
            spacing: { before: 800, after: 200 },
          }),
          new Paragraph({
            text: "─────────────────────────────────────────────────────────────",
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Dokument wygenerowany automatycznie przez system Doradca PPOŻ AI. Wymaga weryfikacji przez uprawnionego rzeczoznawcę.",
            alignment: AlignmentType.CENTER,
            size: 18,
            color: '666666',
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const fileName = `Raport_PPOZ_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Błąd podczas eksportu do DOCX:', error);
    throw new Error('Nie udało się wyeksportować raportu. Spróbuj ponownie.');
  }
};

export const exportToPdf = async (data: AnalysisResult) => {
  const currentDate = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    // Używamy wbudowanego fontu Helvetica, który nie wymaga rejestracji
    // Helvetica dobrze obsługuje polskie znaki diakrytyczne
    await registerPolishFont(); // Funkcja jest teraz no-op, ale pozostaje dla kompatybilności
    
    const doc = React.createElement(PDFReport, { data, currentDate });
    const blob = await pdf(doc).toBlob();
    const fileName = `Raport_PPOZ_${new Date().toISOString().split('T')[0]}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Błąd podczas eksportu do PDF:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    console.error('Szczegóły błędu:', errorMessage);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Brak stack trace');
    
    // Użytkownikowi pokazujemy prostszy komunikat
    throw new Error(`Nie udało się wyeksportować raportu do PDF. Sprawdź konsolę przeglądarki (F12) aby zobaczyć szczegóły.`);
  }
};

