const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para corrigir mockRejectedValue em um arquivo
function fixMockRejectedValueInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Padrão mais específico para encontrar jest.fn().mockRejectedValue com objetos
    const pattern = /(const\s+\w+\s*=\s*)jest\.fn\(\)\.mockRejectedValue\(\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\);?/g;
    
    const newContent = content.replace(pattern, (match, varDeclaration, objectContent) => {
      // Extrair o nome da variável
      const varMatch = varDeclaration.match(/const\s+(\w+)\s*=\s*/);
      if (!varMatch) return match;
      
      const varName = varMatch[1];
      
      // Criar a nova estrutura
      const newCode = `${varDeclaration}jest.fn() as jest.MockedFunction<any>;
      ${varName}.mockRejectedValue({${objectContent}});`;
      
      return newCode;
    });
    
    if (newContent !== content) {
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

// Encontrar todos os arquivos de teste
const testFiles = glob.sync('src/**/*.test.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

console.log(`🔍 Encontrados ${testFiles.length} arquivos de teste`);

let fixedFiles = 0;

testFiles.forEach(file => {
  if (fixMockRejectedValueInFile(file)) {
    fixedFiles++;
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   Arquivos processados: ${testFiles.length}`);
console.log(`   Arquivos corrigidos: ${fixedFiles}`);
console.log(`\n✨ Correção de mockRejectedValue concluída!`);