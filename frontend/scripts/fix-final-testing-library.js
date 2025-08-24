const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos .test.tsx
function findTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (item.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Função para aplicar correções
function applyFixes(content) {
  let fixed = content;
  let changes = 0;
  
  // Substituir container.querySelector(...).parentElement por screen.getByTestId
  const containerParentPattern = /const\s+(\w+)\s*=\s*container\.querySelector\(['"](.*?)['"]\)\?\.parentElement;/g;
  fixed = fixed.replace(containerParentPattern, (match, varName, selector) => {
    changes++;
    if (selector.includes('data-testid')) {
      const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
      if (testId) {
        return `const ${varName} = screen.getByTestId("${testId}").parentElement;`;
      }
    }
    if (selector.includes('animate-pulse')) {
      return `const ${varName} = screen.getByTestId("loading-spinner").parentElement;`;
    }
    return match;
  });
  
  // Substituir container.querySelector por screen.getByTestId quando possível
  const containerQueryPattern = /container\.querySelector\(['"](.*?)['"]\)/g;
  fixed = fixed.replace(containerQueryPattern, (match, selector) => {
    if (selector.includes('data-testid')) {
      const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
      if (testId) {
        changes++;
        return `screen.getByTestId("${testId}")`;
      }
    }
    if (selector.includes('animate-pulse')) {
      changes++;
      return `screen.getByTestId("loading-spinner")`;
    }
    return match;
  });
  
  // Remover .parentElement quando não necessário
  const unnecessaryParentPattern = /screen\.getByTestId\([^)]+\)\.parentElement/g;
  fixed = fixed.replace(unnecessaryParentPattern, (match) => {
    changes++;
    return match.replace('.parentElement', '');
  });
  
  return { content: fixed, changes };
}

// Processar arquivos
const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findTestFiles(srcDir);

console.log(`Encontrados ${testFiles.length} arquivos de teste`);

let totalChanges = 0;
let processedFiles = 0;

for (const file of testFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const { content: fixedContent, changes } = applyFixes(content);
    
    if (changes > 0) {
      fs.writeFileSync(file, fixedContent, 'utf8');
      console.log(`✅ ${path.relative(srcDir, file)}: ${changes} correções aplicadas`);
      totalChanges += changes;
    }
    
    processedFiles++;
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
  }
}

console.log(`\n📊 Resumo:`);
console.log(`- Arquivos processados: ${processedFiles}`);
console.log(`- Total de correções: ${totalChanges}`);
console.log(`\n✨ Correção final concluída!`);