import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AnalysisResult } from '../types';

// Używamy wbudowanego fontu Helvetica, który jest zawsze dostępny w @react-pdf/renderer
// i dobrze obsługuje polskie znaki diakrytyczne
const FONT_FAMILY = 'Helvetica';

// Funkcja do rejestracji fontu - zachowana dla kompatybilności, ale nie jest już potrzebna
// ponieważ używamy wbudowanego fontu Helvetica
export const registerPolishFont = async (): Promise<void> => {
  // Helvetica jest wbudowanym fontem, nie wymaga rejestracji
  // Funkcja pozostaje dla kompatybilności z exportService.ts
  return Promise.resolve();
};

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
    case 'High': return '#DC2626';
    case 'Średnie':
    case 'Medium': return '#D97706';
    case 'Niskie':
    case 'Low': return '#16A34A';
    default: return '#4B5563';
  }
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    // Helvetica jest wbudowanym fontem w @react-pdf/renderer i dobrze obsługuje polskie znaki
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  heading1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    borderBottom: '1pt solid #ddd',
    paddingBottom: 5,
  },
  heading2: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  italic: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  bullet: {
    marginLeft: 20,
    marginBottom: 5,
  },
  table: {
    marginBottom: 20,
    border: '1pt solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ddd',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRight: '1pt solid #ddd',
  },
  tableCellLast: {
    flex: 1,
    padding: 8,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1pt solid #ddd',
    fontSize: 9,
    textAlign: 'center',
    color: '#666',
  },
  separator: {
    borderTop: '1pt solid #ddd',
    marginTop: 20,
    marginBottom: 10,
  },
});

interface PDFReportProps {
  data: AnalysisResult;
  currentDate: string;
}

export const PDFReport: React.FC<PDFReportProps> = ({ data, currentDate }: PDFReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>RAPORT ANALIZY PPOŻ</Text>
      <Text style={styles.date}>Data generowania: {currentDate}</Text>
      
      <View style={styles.separator} />

      <Text style={styles.heading1}>1. Podsumowanie Zarządcze</Text>
      <Text style={styles.paragraph}>{data.finalRecommendation}</Text>

      <Text style={styles.heading1}>2. Ocena Ryzyka</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCell}>
            <Text style={styles.bold}>Ryzyko Prawne</Text>
          </View>
          <View style={styles.tableCellLast}>
            <Text style={[styles.bold, { color: getRiskColor(data.riskAssessment.legalRisk) }]}>
              {getRiskText(data.riskAssessment.legalRisk)}
            </Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCell}>
            <Text style={styles.bold}>Ryzyko Finansowe</Text>
          </View>
          <View style={styles.tableCellLast}>
            <Text style={[styles.bold, { color: getRiskColor(data.riskAssessment.financialRisk) }]}>
              {getRiskText(data.riskAssessment.financialRisk)}
            </Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCell}>
            <Text style={styles.bold}>Ryzyko Bezpieczeństwa</Text>
          </View>
          <View style={styles.tableCellLast}>
            <Text style={[styles.bold, { color: getRiskColor(data.riskAssessment.safetyRisk) }]}>
              {getRiskText(data.riskAssessment.safetyRisk)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.heading1}>3. Podsumowanie sytuacji</Text>
      <Text style={styles.paragraph}>{data.summary}</Text>

      <Text style={styles.heading1}>4. Opinie Agentów</Text>

      <Text style={styles.heading2}>4.1. Perspektywa Prawna ({data.agents.legislator.title})</Text>
      <Text style={styles.italic}>Zgodność z przepisami prawa i normami.</Text>
      <Text style={styles.paragraph}>{data.agents.legislator.analysis}</Text>
      <Text style={styles.bold}>Kluczowe argumenty:</Text>
      {data.agents.legislator.keyPoints.map((point: string, idx: number) => (
        <Text key={idx} style={styles.bullet}>• {point}</Text>
      ))}

      <Text style={styles.heading2}>4.2. Perspektywa Biznesowa ({data.agents.practitioner.title})</Text>
      <Text style={styles.italic}>Optymalizacja kosztów i ciągłość działania.</Text>
      <Text style={styles.paragraph}>{data.agents.practitioner.analysis}</Text>
      <Text style={styles.bold}>Kluczowe argumenty:</Text>
      {data.agents.practitioner.keyPoints.map((point: string, idx: number) => (
        <Text key={idx} style={styles.bullet}>• {point}</Text>
      ))}

      <Text style={styles.heading2}>4.3. Analiza Ryzyka ({data.agents.auditor.title})</Text>
      <Text style={styles.paragraph}>{data.agents.auditor.analysis}</Text>
      <Text style={styles.bold}>Kluczowe argumenty:</Text>
      {data.agents.auditor.keyPoints.map((point: string, idx: number) => (
        <Text key={idx} style={styles.bullet}>• {point}</Text>
      ))}

      <Text style={styles.heading1}>5. Weryfikacja Źródeł i Podstawa Prawna</Text>
      {data.citations.length > 0 ? (
        data.citations.map((cite: { source: string; reliability: string; snippet: string; url?: string }, index: number) => (
          <View key={index} style={{ marginBottom: 15 }}>
            <Text style={[styles.bold, { marginBottom: 5 }]}>
              Źródło {index + 1}: {cite.source}
            </Text>
            <Text style={{ marginBottom: 5 }}>Wiarygodność: {cite.reliability}</Text>
            <Text style={[styles.italic, { marginBottom: 10 }]}>"{cite.snippet}"</Text>
          </View>
        ))
      ) : (
        <Text style={styles.italic}>Brak bezpośrednich cytowań prawnych dla tego zapytania.</Text>
      )}

      <View style={styles.footer}>
        <Text>─────────────────────────────────────────────────────────────</Text>
        <Text style={{ marginTop: 10 }}>
          Dokument wygenerowany automatycznie przez system Doradca PPOŻ AI. Wymaga weryfikacji przez uprawnionego rzeczoznawcę.
        </Text>
      </View>
    </Page>
  </Document>
);
