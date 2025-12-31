import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ragService } from '../services/ragService.js';
import { legalDatabaseService } from '../services/legalDatabaseService.js';
import { reinitializeClients } from '../services/embeddingService.js';
reinitializeClients();
/**
 * Skrypt do indeksowania dokumentów prawnych
 * Uruchomienie: node server/scripts/initializeLegalDatabase.js
 */
async function initializeLegalDatabase() {
  console.log('🚀 Inicjalizacja bazy danych dokumentów prawnych...\n');
  
  try {
    // 1. Sprawdź czy baza już istnieje
    const isInitialized = await legalDatabaseService.isDatabaseInitialized();
    if (isInitialized) {
      const { getStats } = await import('../services/vectorStore.js');
      const stats = await getStats();
      console.log(`✅ Baza danych już istnieje. Liczba chunków: ${stats.chunkCount}\n`);
      console.log('Aby zreindeksować, usuń folder server/vectorstore/ i uruchom ponownie.\n');
      return;
    }
    
    // 2. Wczytaj konfigurację dokumentów
    const configPath = path.resolve(__dirname, '../config/legalDocuments.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Plik konfiguracyjny nie istnieje: ${configPath}`);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const documents = config.documents || [];
    
    if (documents.length === 0) {
      console.log('⚠️  Brak dokumentów do indeksowania w konfiguracji.\n');
      console.log('Dodaj dokumenty do server/config/legalDocuments.json\n');
      return;
    }
    
    console.log(`Znaleziono ${documents.length} dokument(ów) do indeksowania.\n`);
    
    // 3. Indeksuj każdy dokument
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docPath = path.resolve(__dirname, '../../', doc.path);
      
      console.log(`[${i + 1}/${documents.length}] Indeksowanie: ${doc.metadata.title}`);
      console.log(`   Ścieżka: ${docPath}`);
      
      // Sprawdź czy plik istnieje
      if (!fs.existsSync(docPath)) {
        console.error(`   ❌ Plik nie istnieje: ${docPath}`);
        errorCount++;
        continue;
      }
      
      try {
        const result = await ragService.indexDocument(docPath, doc.metadata);
        console.log(`   ✅ Zindeksowano: ${result.chunksCount} chunków\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Błąd: ${error.message}\n`);
        errorCount++;
      }}
    
    // 4. Podsumowanie
    console.log('\n' + '='.repeat(50));
    console.log('📊 Podsumowanie:');
    console.log(`   ✅ Sukces: ${successCount}`);
    console.log(`   ❌ Błędy: ${errorCount}`);
    console.log('='.repeat(50) + '\n');
    
    if (successCount > 0) {
      const { getStats } = await import('../services/vectorStore.js');
      const stats = await getStats();
      console.log(`✅ Baza danych zainicjalizowana. Łączna liczba chunków: ${stats.chunkCount}\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Błąd podczas inicjalizacji bazy danych:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Uruchom skrypt
initializeLegalDatabase()
  .then(() => {
    console.log('✅ Skrypt zakończony pomyślnie.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Skrypt zakończony z błędem:', error);
    process.exit(1);
  });

