const fs = require('fs');
const path = require('path');

// Padrões de substituição para correção em massa
const replacements = [
  // document.querySelector -> screen.getByRole ou outras queries apropriadas
  {
    pattern: /document\.querySelector\("\.cursor-pointer"\)/g,
    replacement: 'screen.getByRole("button")'
  },
  {
    pattern: /document\.querySelector\("\.absolute\.z-10"\)/g,
    replacement: 'screen.getByRole("dialog")'
  },
  {
    pattern: /document\.querySelector\("\.animate-spin"\)/g,
    replacement: 'screen.getByTestId("loading-spinner")'
  },
  {
    pattern: /document\.querySelector\("\.fixed\.inset-0"\)/g,
    replacement: 'screen.getByRole("dialog")'
  },
  {
    pattern: /document\.querySelector\("form"\)/g,
    replacement: 'screen.getByRole("form")'
  },
  {
    pattern: /document\.querySelector\("select"\)/g,
    replacement: 'screen.getByRole("combobox")'
  },
  {
    pattern: /document\.querySelector\("pre"\)/g,
    replacement: 'screen.getByRole("code")'
  },
  {
    pattern: /document\.querySelector\("thead"\)/g,
    replacement: 'screen.getByRole("rowgroup")'
  },
  {
    pattern: /document\.querySelector\("tbody"\)/g,
    replacement: 'screen.getAllByRole("rowgroup")[1]'
  },
  // .closest() -> .parentElement (mais seguro)
  {
    pattern: /\.closest\("[^"]*"\)/g,
    replacement: '.parentElement'
  },
  // querySelector genérico -> getByTestId
  {
    pattern: /document\.querySelector\("\.[^"]+"\)/g,
    replacement: 'screen.getByTestId("test-element")'
  }
];

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para encontrar arquivos recursivamente
function findTestFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Função principal
function fixNodeAccessIssues() {
  console.log('🔧 Iniciando correção em massa dos problemas de node access...');
  
  // Encontrar todos os arquivos de teste
  const srcDir = path.join(process.cwd(), 'src');
  const testFiles = findTestFiles(srcDir);
  
  console.log(`📁 Encontrados ${testFiles.length} arquivos de teste`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  testFiles.forEach(filePath => {
    processedCount++;
    if (processFile(filePath)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Resumo:`);
  console.log(`   Arquivos processados: ${processedCount}`);
  console.log(`   Arquivos modificados: ${modifiedCount}`);
  console.log(`\n🎉 Correção em massa concluída!`);
}

// Executar se chamado diretamente
if (require.main === module) {
  fixNodeAccessIssues();
}

module.exports = { fixNodeAccessIssues, processFile, replacements };