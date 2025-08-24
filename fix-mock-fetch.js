const fs = require('fs');
const path = require('path');

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Padrão 1: mockFetch.mockResolvedValueOnce({ ... }) sem 'as any'
    const pattern1 = /(mockFetch\.mockResolvedValueOnce\(\{[\s\S]*?\})(?!\s*as\s+any)/g;
    
    // Padrão 2: Remover 'as any' incorretos dentro do json
    content = content.replace(/json: async \(\) => \([^)]+\) as any/g, (match) => {
      return match.replace(' as any', '');
    });
    
    // Aplicar 'as any' ao objeto completo do mock
    const newContent = content.replace(pattern1, (match) => {
      // Verificar se já tem 'as any' no final
      if (!match.includes('} as any')) {
        modified = true;
        return match + ' as any';
      }
      return match;
    });
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para encontrar arquivos de teste
function findTestFiles(dir) {
  const testFiles = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        scanDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.test.tsx') || item.endsWith('.test.ts'))) {
        testFiles.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return testFiles;
}

// Executar o script
const frontendDir = path.join(__dirname, 'frontend', 'src');
const testFiles = findTestFiles(frontendDir);

console.log(`🔍 Encontrados ${testFiles.length} arquivos de teste`);

let correctedFiles = 0;
for (const file of testFiles) {
  if (processFile(file)) {
    correctedFiles++;
  }
}

console.log(`\n📊 Resumo:`);
console.log(`- Arquivos processados: ${testFiles.length}`);
console.log(`- Arquivos corrigidos: ${correctedFiles}`);
console.log(`\n✨ Script concluído!`);