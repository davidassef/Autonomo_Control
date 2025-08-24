const fs = require('fs');
const path = require('path');

// Função para corrigir .closest() restantes
function fixRemainingClosest(content) {
  let fixed = content;
  let changes = 0;

  // Padrão: screen.getByTestId("something").closest("div")
  const testIdClosestPattern = /screen\.getByTestId\([^)]+\)\.closest\([^)]+\)/g;
  fixed = fixed.replace(testIdClosestPattern, (match) => {
    changes++;
    // Extrair o testid
    const testIdMatch = match.match(/getByTestId\(["']([^"']+)["']\)/);
    if (testIdMatch) {
      const testId = testIdMatch[1];
      return `screen.getByTestId("${testId}").parentElement`;
    }
    return match;
  });

  // Padrão: screen.getByText(/something/).closest("div")
  const textClosestPattern = /screen\.getByText\([^)]+\)\.closest\([^)]+\)/g;
  fixed = fixed.replace(textClosestPattern, (match) => {
    changes++;
    // Extrair o texto/regex
    const textMatch = match.match(/getByText\(([^)]+)\)/);
    if (textMatch) {
      const textPattern = textMatch[1];
      return `screen.getByText(${textPattern}).parentElement`;
    }
    return match;
  });

  // Padrão: .querySelector(".h-48")
  const querySelectorPattern = /\.querySelector\(["']([^"']+)["']\)/g;
  fixed = fixed.replace(querySelectorPattern, (match, selector) => {
    changes++;
    if (selector.startsWith('.')) {
      // É uma classe CSS
      const className = selector.substring(1);
      return `.querySelector('[class*="${className}"]')`;
    }
    return match;
  });

  return { content: fixed, changes };
}

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixRemainingClosest(content);
    
    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ ${filePath}: ${result.changes} correções aplicadas`);
      return result.changes;
    } else {
      console.log(`⚪ ${filePath}: nenhuma correção necessária`);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

// Função para encontrar arquivos de teste
function findTestFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.test.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Executar o script
const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findTestFiles(srcDir);

console.log(`🔍 Encontrados ${testFiles.length} arquivos de teste`);
console.log('🚀 Iniciando correção de .closest() restantes...\n');

let totalChanges = 0;
let processedFiles = 0;

for (const file of testFiles) {
  const changes = processFile(file);
  totalChanges += changes;
  processedFiles++;
}

console.log(`\n📊 Resumo:`);
console.log(`   Arquivos processados: ${processedFiles}`);
console.log(`   Total de correções: ${totalChanges}`);
console.log(`\n✨ Correção de .closest() restantes concluída!`);