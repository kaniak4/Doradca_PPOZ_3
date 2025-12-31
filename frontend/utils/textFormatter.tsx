import React from 'react';

/**
 * Formatuje tekst z markdown do HTML
 * - Konwertuje **tekst** na <strong>tekst</strong>
 * - Dodaje <br/> przed numerowanymi listami (1., 2., 3., etc.) z lekkim odstępem
 * - Dodaje <br/> przed "**Podsumowując:**"
 * - Używa twardej spacji (non-breaking space) między krótkimi słowami a następnym słowem
 */
export const formatMarkdownText = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Krótkie słowa, które nie powinny kończyć linii (spójniki, przyimki)
  const shortWords = ['i', 'a', 'o', 'z', 'w', 'u', 'oraz', 'ale', 'że', 'na', 'do', 'po', 'od', 'przy', 'nad', 'pod', 'przed', 'za'];
  
  // Krok 1: Zamień spację między krótkim słowem a następnym słowem na twardą spację (non-breaking space)
  // To zapobiegnie łamaniu linii między krótkim słowem a następnym słowem
  let formatted = text;
  shortWords.forEach(word => {
    // Wzorzec: spacja + krótkie słowo (jako całe słowo) + spacja + następne słowo
    // Zamieniamy spację po krótkim słowie na non-breaking space (\u00A0)
    const regex = new RegExp(`(\\s+)(${word}\\b)(\\s+)([^\\s\\n])`, 'gi');
    formatted = formatted.replace(regex, (...args) => {
      const [, space1, wordMatch, , nextChar] = args;
      // Zamień spację po krótkim słowie na twardą spację
      return `${space1}${wordMatch}\u00A0${nextChar}`;
    });
  });
  
  // Krok 2: Dodaj <br/> przed numerowanymi listami (1., 2., 3., etc.) z lekkim odstępem
  // Szukamy wzorca: spacja + cyfra + kropka + spacja (ale nie na początku linii)
  formatted = formatted.replace(/([^\n])(\s+)(\d+\.\s)/g, '$1\n\n$3');
  
  // Krok 3: Dodaj <br/> przed "**Podsumowując:**" (podwójny break dla lepszego odstępu)
  formatted = formatted.replace(/([^\n])(\s+)(\*\*Podsumowując:\*\*)/g, '$1\n\n$3');
  
  // Krok 4: Podziel tekst na linie i przetwórz każdą linię osobno
  const lines = formatted.split('\n');
  const result: React.ReactNode[] = [];
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      result.push(<br key={`br-${lineIndex}`} />);
    }
    
    // Przetwórz markdown bold (**tekst**)
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let partIndex = 0;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // Dodaj tekst przed boldem
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Dodaj pogrubiony tekst
      parts.push(<strong key={`bold-${lineIndex}-${partIndex++}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    // Dodaj resztę linii
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    // Jeśli nie było żadnych boldów, po prostu dodaj całą linię
    if (parts.length === 0) {
      parts.push(line);
    }
    
    result.push(...parts);
  });
  
  return <>{result}</>;
};
