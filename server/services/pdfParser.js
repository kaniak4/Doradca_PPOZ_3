import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';

/**
 * Parsuje PDF i ekstraktuje tekst
 * @param {string} filePath - Ścieżka do pliku PDF
 * @returns {Promise<{text: string, metadata: object}>}
 */
export async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    
    return {
      text: pdfData.text,
      metadata: {
        title: pdfData.info?.Title || extractTitle(pdfData.text, filePath),
        pages: pdfData.numpages,
        author: pdfData.info?.Author,
        creator: pdfData.info?.Creator,
      }
    };
  } catch (error) {
    throw new Error(`Błąd podczas parsowania PDF: ${error.message}`);
  }
}

/**
 * Ekstraktuje tytuł z tekstu (pierwsza linia lub pierwsze zdanie)
 */
function extractTitle(text, filePath = null) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Jeśli pierwsza linia jest za długa, weź pierwsze zdanie
    if (firstLine.length > 100) {
      const firstSentence = firstLine.split(/[.!?]/)[0];
      return firstSentence.trim() || firstLine.substring(0, 100);
    }
    return firstLine;
  }
  return filePath ? path.basename(filePath, '.pdf') : 'Nieznany dokument';
}

/**
 * Flat Parsing with Context Injection
 * Przetwarza dokument jako strumień, wstrzykując kontekst do atomów prawnych
 * @param {string} text - Tekst dokumentu
 * @param {object} metadata - Metadane dokumentu
 * @returns {Array<object>} - Tablica chunków z wstrzykniętym kontekstem
 */
export function chunkLegalDocumentFlat(text, metadata) {
  const chunks = [];
  let currentContext = {
    dzial: null,
    rozdzial: null,
    tytul: null,
  };
  
  // Wzorce do wykrywania struktury dokumentu
  const patterns = {
    dzial: /(?:^|\n)\s*(?:Dział|DZIAŁ)\s+([IVX\d]+)[\.\)]?\s+([^\n]+)/gi,
    rozdzial: /(?:^|\n)\s*(?:Rozdział|ROZDZIAŁ)\s+([IVX\d]+)[\.\)]?\s+([^\n]+)/gi,
    artykul: /(?:^|\n)\s*(?:Art\.|ART\.)\s*(\d+[a-z]?)[\.\)]?\s*/gi,
    paragraf: /(?:^|\n)\s*§\s*(\d+[a-z]?)[\.\)]?\s*/gi,
  };
  
  // Znajdź wszystkie znaczniki w kolejności występowania
  const markers = [];
  
  // Znajdź wszystkie wzorce i zapisz ich pozycje
  for (const [type, regex] of Object.entries(patterns)) {
    let match;
    // Reset regex (global flag wymaga resetu)
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      markers.push({
        type,
        position: match.index,
        match: match[0],
        number: match[1] || null,
        title: match[2] || null,
      });
    }
  }
  
  // Sortuj po pozycji (kolejność w dokumencie)
  markers.sort((a, b) => a.position - b.position);
  
  // Przetwarzaj strumieniowo
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const nextMarker = markers[i + 1];
    
    // Aktualizuj kontekst gdy znajdziemy nagłówek
    if (marker.type === 'dzial') {
      currentContext.dzial = {
        number: marker.number,
        title: marker.title,
      };
      // Reset niższych poziomów
      currentContext.rozdzial = null;
      continue; // Nie wycinamy nagłówka jako chunk
    }
    
    if (marker.type === 'rozdzial') {
      currentContext.rozdzial = {
        number: marker.number,
        title: marker.title,
      };
      continue; // Nie wycinamy nagłówka jako chunk
    }
    
    // Wycinamy atom prawny (Art. lub §)
    if (marker.type === 'artykul' || marker.type === 'paragraf') {
      const start = marker.position;
      const end = nextMarker ? nextMarker.position : text.length;
      const atomText = text.slice(start, end).trim();
      
      // Jeśli atom jest za długi, dziel na paragrafy
      if (atomText.length > 1500) {
        const subChunks = splitLongAtom(atomText, marker);
        for (const subChunk of subChunks) {
          chunks.push(createChunk(subChunk.text, marker, currentContext, metadata, subChunk.number));
        }
      } else {
        chunks.push(createChunk(atomText, marker, currentContext, metadata));
      }
    }
  }
  
  // Obsługa przypadku: dokument zaczyna się od artykułu (bez rozdziału)
  // Sprawdź czy pierwszy marker to artykuł przed jakimkolwiek rozdziałem
  if (markers.length > 0 && 
      (markers[0].type === 'artykul' || markers[0].type === 'paragraf') &&
      !markers.some(m => m.type === 'rozdzial' && m.position < markers[0].position)) {
    // Pierwszy chunk już został dodany z pustym kontekstem - OK
  }
  
  return chunks;
}

/**
 * Tworzy chunk z wstrzykniętym kontekstem
 */
function createChunk(atomText, marker, context, metadata, paragraphNumber = null) {
  // Buduj pełny tekst z kontekstem
  const contextPrefix = buildContextPrefix(context);
  const fullText = contextPrefix ? `${contextPrefix}\n\n${atomText}` : atomText;
  
  return {
    text: fullText,
    rawText: atomText, // Oryginalny tekst bez kontekstu (dla cytowań)
    metadata: {
      ...metadata,
      dzial: context.dzial,
      rozdzial: context.rozdzial,
      type: marker.type === 'artykul' ? 'article' : 'paragraph',
      number: marker.number,
      paragraphNumber: paragraphNumber,
    },
    chunkId: generateChunkId(metadata, context, marker, paragraphNumber),
    // Informacje do precyzyjnych cytowań
    citation: {
      source: metadata.title,
      article: marker.type === 'artykul' ? `Art. ${marker.number}` : `§ ${marker.number}`,
      context: context.rozdzial ? `Rozdział ${context.rozdzial.number}` : null,
      paragraph: paragraphNumber ? paragraphNumber : null,
    }
  };
}

/**
 * Buduje prefix kontekstu (np. "Rozdział 2. Wymagania techniczne")
 */
function buildContextPrefix(context) {
  const parts = [];
  
  if (context.dzial) {
    parts.push(`Dział ${context.dzial.number}${context.dzial.title ? `. ${context.dzial.title}` : ''}`);
  }
  
  if (context.rozdzial) {
    parts.push(`Rozdział ${context.rozdzial.number}${context.rozdzial.title ? `. ${context.rozdzial.title}` : ''}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : null;
}

/**
 * Dzieli długi atom (art. lub §) na paragrafy
 */
function splitLongAtom(atomText, marker) {
  // Wzorzec: "1. tekst", "2. tekst", etc.
  const paraRegex = /(?:^|\n)\s*(\d+)\.\s+/g;
  const paraMatches = [...atomText.matchAll(paraRegex)];
  
  if (paraMatches.length === 0) {
    // Jeśli nie ma paragrafów, dziel na zdania (fallback)
    return splitBySentences(atomText, 1000);
  }
  
  const subChunks = [];
  for (let i = 0; i < paraMatches.length; i++) {
    const start = paraMatches[i].index;
    const end = i < paraMatches.length - 1 ? paraMatches[i + 1].index : atomText.length;
    const paraText = atomText.slice(start, end).trim();
    
    subChunks.push({
      text: paraText,
      number: paraMatches[i][1],
      isSubChunk: true,
    });
  }
  
  return subChunks;
}

/**
 * Fallback: dzieli na zdania jeśli brak struktury
 */
function splitBySentences(text, maxLength) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push({ text: currentChunk.trim() });
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push({ text: currentChunk.trim() });
  }
  
  return chunks;
}

/**
 * Generuje unikalny ID chunka
 */
function generateChunkId(metadata, context, marker, paragraphNumber = null) {
  const parts = [
    metadata.title?.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, ''),
    context.dzial ? `dzial-${context.dzial.number}` : null,
    context.rozdzial ? `rozdzial-${context.rozdzial.number}` : null,
    marker.type === 'artykul' ? `art-${marker.number}` : `para-${marker.number}`,
    paragraphNumber ? `p-${paragraphNumber}` : null,
  ].filter(Boolean);
  
  return parts.join('--');
}

