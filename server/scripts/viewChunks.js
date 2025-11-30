import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialize, getChunk, getStats } from '../services/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Skrypt do przeglądania zindeksowanych chunków
 * 
 * Użycie:
 *   node server/scripts/viewChunks.js                    # Wszystkie chunki
 *   node server/scripts/viewChunks.js --id <chunkId>     # Konkretny chunk
 *   node server/scripts/viewChunks.js --source "Ustawa"  # Chunki z dokumentu
 *   node server/scripts/viewChunks.js --search "art. 5"   # Wyszukaj tekst
 *   node server/scripts/viewChunks.js --stats             # Statystyki
 *   node server/scripts/viewChunks.js --truncated         # Tylko obcięte chunki
 */
async function viewChunks() {
  await initialize();
  
  const args = process.argv.slice(2);
  const stats = await getStats();
  
  // Wczytaj chunki z pliku
  const storageFile = path.resolve(__dirname, '../../vectorstore/chunks.json');
  if (!fs.existsSync(storageFile)) {
    console.error('❌ Baza danych nie istnieje. Uruchom najpierw: node server/scripts/initializeLegalDatabase.js');
    process.exit(1);
  }
  
  const chunks = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
  
  // --stats: Pokaż statystyki
  if (args.includes('--stats')) {
    console.log('\n📊 Statystyki bazy danych:\n');
    console.log(`   Łączna liczba chunków: ${stats.chunkCount}`);
    
    // Statystyki po dokumentach
    const byDocument = {};
    chunks.forEach(chunk => {
      const title = chunk.metadata?.title || 'Nieznany dokument';
      if (!byDocument[title]) {
        byDocument[title] = { count: 0, truncated: 0, totalLength: 0 };
      }
      byDocument[title].count++;
      if (chunk.rawText && chunk.rawText.length > 6000) {
        byDocument[title].truncated++;
      }
      byDocument[title].totalLength += (chunk.text?.length || 0);
    });
    
    console.log('\n   Chunki po dokumentach:');
    Object.entries(byDocument).forEach(([title, stats]) => {
      console.log(`   - ${title}:`);
      console.log(`     • Liczba chunków: ${stats.count}`);
      console.log(`     • Obcięte: ${stats.truncated}`);
      console.log(`     • Średnia długość: ${Math.round(stats.totalLength / stats.count)} znaków`);
    });
    
    // Statystyki obciętych chunków
    const truncated = chunks.filter(c => c.rawText && c.rawText.length > 6000);
    console.log(`\n   ⚠️  Obcięte chunki: ${truncated.length} (${Math.round(truncated.length / chunks.length * 100)}%)`);
    
    return;
  }
  
  // --truncated: Pokaż tylko obcięte chunki
  if (args.includes('--truncated')) {
    const truncated = chunks.filter(c => c.rawText && c.rawText.length > 6000);
    console.log(`\n⚠️  Znaleziono ${truncated.length} obciętych chunków:\n`);
    
    truncated.forEach((chunk, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[${idx + 1}/${truncated.length}] Chunk ID: ${chunk.chunkId}`);
      console.log(`Dokument: ${chunk.metadata?.title || 'Nieznany'}`);
      console.log(`Długość oryginalna: ${chunk.rawText.length} znaków`);
      console.log(`Długość po obcięciu: ${chunk.text.length} znaków`);
      console.log(`Artykuł: ${chunk.citation?.article || 'Brak'}`);
      console.log(`\n--- Tekst (obcięty) ---`);
      console.log(chunk.text);
      console.log(`\n--- Koniec chunka ---`);
    });
    
    return;
  }
  
  // --id: Pokaż konkretny chunk
  const idIndex = args.indexOf('--id');
  if (idIndex !== -1 && args[idIndex + 1]) {
    const chunkId = args[idIndex + 1];
    const chunk = chunks.find(c => c.chunkId === chunkId);
    
    if (!chunk) {
      console.error(`❌ Nie znaleziono chunka o ID: ${chunkId}`);
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Chunk ID: ${chunk.chunkId}`);
    console.log(`Dokument: ${chunk.metadata?.title || 'Nieznany'}`);
    console.log(`Typ: ${chunk.metadata?.type || 'Brak'}`);
    console.log(`Artykuł: ${chunk.citation?.article || 'Brak'}`);
    console.log(`Kontekst: ${chunk.citation?.context || 'Brak'}`);
    console.log(`Długość tekstu: ${chunk.text.length} znaków`);
    if (chunk.rawText && chunk.rawText.length > chunk.text.length) {
      console.log(`⚠️  Oryginalna długość: ${chunk.rawText.length} znaków (OBCIĘTY)`);
    }
    console.log(`\n--- Tekst chunka ---`);
    console.log(chunk.text);
    if (chunk.rawText && chunk.rawText.length > chunk.text.length) {
      console.log(`\n--- Oryginalny tekst (przed obcięciem) ---`);
      console.log(chunk.rawText);
    }
    console.log(`\n--- Koniec chunka ---\n`);
    
    return;
  }
  
  // --source: Pokaż chunki z konkretnego dokumentu
  const sourceIndex = args.indexOf('--source');
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    const searchTerm = args[sourceIndex + 1].toLowerCase();
    const filtered = chunks.filter(c => 
      (c.metadata?.title || '').toLowerCase().includes(searchTerm)
    );
    
    console.log(`\n📄 Znaleziono ${filtered.length} chunków dla: "${args[sourceIndex + 1]}"\n`);
    
    filtered.forEach((chunk, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[${idx + 1}/${filtered.length}] Chunk ID: ${chunk.chunkId}`);
      console.log(`Artykuł: ${chunk.citation?.article || 'Brak'}`);
      console.log(`Długość: ${chunk.text.length} znaków`);
      if (chunk.rawText && chunk.rawText.length > chunk.text.length) {
        console.log(`⚠️  OBCIĘTY (oryginalnie ${chunk.rawText.length} znaków)`);
      }
      console.log(`\n--- Tekst ---`);
      console.log(chunk.text.substring(0, 500) + (chunk.text.length > 500 ? '...' : ''));
      console.log(`\n--- Koniec ---`);
    });
    
    return;
  }
  
  // --search: Wyszukaj chunki zawierające tekst
  const searchIndex = args.indexOf('--search');
  if (searchIndex !== -1 && args[searchIndex + 1]) {
    const searchTerm = args[searchIndex + 1].toLowerCase();
    const filtered = chunks.filter(c => 
      (c.text || '').toLowerCase().includes(searchTerm) ||
      (c.rawText || '').toLowerCase().includes(searchTerm)
    );
    
    console.log(`\n🔍 Znaleziono ${filtered.length} chunków zawierających: "${args[searchIndex + 1]}"\n`);
    
    filtered.forEach((chunk, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[${idx + 1}/${filtered.length}] Chunk ID: ${chunk.chunkId}`);
      console.log(`Dokument: ${chunk.metadata?.title || 'Nieznany'}`);
      console.log(`Artykuł: ${chunk.citation?.article || 'Brak'}`);
      console.log(`\n--- Tekst (fragment) ---`);
      const text = chunk.text || chunk.rawText || '';
      const index = text.toLowerCase().indexOf(searchTerm);
      const start = Math.max(0, index - 100);
      const end = Math.min(text.length, index + searchTerm.length + 100);
      console.log('...' + text.substring(start, end) + '...');
      console.log(`\n--- Koniec ---`);
    });
    
    return;
  }
  
  // Domyślnie: Pokaż pierwsze 10 chunków
  console.log(`\n📚 Wyświetlanie pierwszych 10 chunków (łącznie: ${chunks.length})\n`);
  console.log('Użyj --help aby zobaczyć wszystkie opcje\n');
  
  chunks.slice(0, 10).forEach((chunk, idx) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${idx + 1}/10] Chunk ID: ${chunk.chunkId}`);
    console.log(`Dokument: ${chunk.metadata?.title || 'Nieznany'}`);
    console.log(`Artykuł: ${chunk.citation?.article || 'Brak'}`);
    console.log(`Długość: ${chunk.text.length} znaków`);
    if (chunk.rawText && chunk.rawText.length > chunk.text.length) {
      console.log(`⚠️  OBCIĘTY (oryginalnie ${chunk.rawText.length} znaków)`);
    }
    console.log(`\n--- Tekst (pierwsze 500 znaków) ---`);
    console.log(chunk.text.substring(0, 500) + (chunk.text.length > 500 ? '...' : ''));
    console.log(`\n--- Koniec ---`);
  });
  
  if (chunks.length > 10) {
    console.log(`\n... i ${chunks.length - 10} więcej chunków.`);
    console.log('Użyj --source, --search lub --id aby zobaczyć więcej.\n');
  }
}

// --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📚 Przeglądarka chunków - Narzędzie do przeglądania zindeksowanych dokumentów prawnych

Użycie:
  node server/scripts/viewChunks.js [opcje]

Opcje:
  --stats                    Pokaż statystyki bazy danych
  --truncated                Pokaż tylko obcięte chunki (dłuższe niż 6000 znaków)
  --id <chunkId>             Pokaż konkretny chunk po ID
  --source "<tytuł>"         Pokaż chunki z konkretnego dokumentu
  --search "<tekst>"         Wyszukaj chunki zawierające tekst
  --help, -h                 Pokaż tę pomoc

Przykłady:
  node server/scripts/viewChunks.js
  node server/scripts/viewChunks.js --stats
  node server/scripts/viewChunks.js --truncated
  node server/scripts/viewChunks.js --id chunk_ustawa_ppoz_001
  node server/scripts/viewChunks.js --source "Ustawa o PPOŻ"
  node server/scripts/viewChunks.js --search "art. 5"

Uwaga:
  Chunki dłuższe niż 6000 znaków są automatycznie obcinane podczas indeksowania.
  Oryginalny tekst jest zachowany w polu 'rawText'.
`);
  process.exit(0);
}

viewChunks().catch(error => {
  console.error('❌ Błąd:', error);
  process.exit(1);
});

