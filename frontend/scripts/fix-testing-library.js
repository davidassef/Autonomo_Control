#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para correção em massa de problemas testing-library/no-node-access
 * Substitui padrões comuns de acesso direto ao DOM por métodos do Testing Library
 */

class TestingLibraryFixer {
  constructor() {
    this.patterns = [
      // Padrão 1: .closest("div") -> container.querySelector ou getByRole
      {
        regex: /\.closest\(["']div["']\)/g,
        replacement: 'container.querySelector("div")',
        description: 'Substituir .closest("div") por container.querySelector'
      },
      // Padrão 2: .closest("button") -> getByRole('button')
      {
        regex: /\.closest\(["']button["']\)/g,
        replacement: 'getByRole("button")',
        description: 'Substituir .closest("button") por getByRole'
      },
      // Padrão 3: .closest("a") -> getByRole('link')
      {
        regex: /\.closest\(["']a["']\)/g,
        replacement: 'getByRole("link")',
        description: 'Substituir .closest("a") por getByRole'
      },
      // Padrão 4: parentElement -> container.firstChild
      {
        regex: /\.parentElement/g,
        replacement: '.container.firstChild',
        description: 'Substituir .parentElement por container.firstChild'
      }
    ];
    
    this.stats = {
      filesProcessed: 0,
      replacements: 0,
      errors: 0
    };
  }

  /**
   * Processa um arquivo aplicando as correções
   */
  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let fileReplacements = 0;

      // Aplica cada padrão de correção
      this.patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
          content = content.replace(pattern.regex, pattern.replacement);
          fileReplacements += matches.length;
          modified = true;
          console.log(`  ✓ ${pattern.description}: ${matches.length} ocorrências`);
        }
      });

      // Salva o arquivo se foi modificado
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        this.stats.replacements += fileReplacements;
        console.log(`✅ ${filePath}: ${fileReplacements} correções aplicadas`);
      }

      this.stats.filesProcessed++;
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Encontra todos os arquivos de teste
   */
  findTestFiles(dir) {
    const testFiles = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.test.tsx') || item.endsWith('.test.ts')) {
          testFiles.push(fullPath);
        }
      });
    };
    
    scanDirectory(dir);
    return testFiles;
  }

  /**
   * Executa a correção em massa
   */
  run() {
    console.log('🔧 Iniciando correção em massa de testing-library/no-node-access\n');
    
    const srcDir = path.join(__dirname, '..', 'src');
    const testFiles = this.findTestFiles(srcDir);
    
    console.log(`📁 Encontrados ${testFiles.length} arquivos de teste\n`);
    
    // Processa cada arquivo
    testFiles.forEach(file => {
      console.log(`🔍 Processando: ${path.relative(srcDir, file)}`);
      this.processFile(file);
      console.log('');
    });
    
    // Exibe estatísticas finais
    console.log('📊 Estatísticas da correção:');
    console.log(`   Arquivos processados: ${this.stats.filesProcessed}`);
    console.log(`   Total de correções: ${this.stats.replacements}`);
    console.log(`   Erros encontrados: ${this.stats.errors}`);
    
    if (this.stats.replacements > 0) {
      console.log('\n✅ Correções aplicadas com sucesso!');
      console.log('💡 Execute "npm run lint" para verificar os resultados.');
    } else {
      console.log('\nℹ️  Nenhuma correção necessária.');
    }
  }
}

// Executa o script
if (require.main === module) {
  const fixer = new TestingLibraryFixer();
  fixer.run();
}

module.exports = TestingLibraryFixer;