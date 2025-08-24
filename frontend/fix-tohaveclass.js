const fs = require('fs');
const path = require('path');

// Função para buscar arquivos .test.tsx recursivamente
function findTestFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (item.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Função para corrigir toHaveClass com múltiplos argumentos
function fixToHaveClass(content) {
  // Regex para encontrar toHaveClass com múltiplos argumentos
  const regex = /toHaveClass\(\s*([^)]+)\s*\)/g;
  
  return content.replace(regex, (match, args) => {
    // Se contém vírgulas, precisa ser corrigido
    if (args.includes(',')) {
      // Divide os argumentos e remove espaços/quebras de linha
      const argArray = args.split(',').map(arg => 
        arg.trim().replace(/^['"`]|['"`]$/g, '')
      );
      
      // Junta todos os argumentos em uma única string
      const joinedClasses = argArray.join(' ');
      return `toHaveClass('${joinedClasses}')`;
    }
    
    return match;
  });
}

// Função principal
function main() {
  const srcDir = path.join(__dirname, 'src');
  const testFiles = findTestFiles(srcDir);
  
  console.log(`Encontrados ${testFiles.length} arquivos de teste`);
  
  let totalFixed = 0;
  
  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fixedContent = fixToHaveClass(content);
      
      if (content !== fixedContent) {
        fs.writeFileSync(file, fixedContent, 'utf8');
        console.log(`Corrigido: ${path.relative(srcDir, file)}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`Erro ao processar ${file}:`, error.message);
    }
  }
  
  console.log(`\nTotal de arquivos corrigidos: ${totalFixed}`);
}

main();