#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para correção automática de variáveis não utilizadas e outros problemas menores
 */

class UnusedVarsFixer {
  constructor() {
    this.patterns = [
      // Padrão 1: Remove variável initialChart não utilizada
      {
        regex: /^\s*const initialChart = \{[\s\S]*?\};\s*$/gm,
        replacement: '',
        description: 'Remover variável initialChart não utilizada'
      },
      // Padrão 2: Remove imports não utilizados relacionados a initialChart
      {
        regex: /^\s*const initialChart = .*?;\s*$/gm,
        replacement: '',
        description: 'Remover declaração initialChart simples'
      }
    ];
    
    this.accessibilityPatterns = [
      // Corrige headings sem conteúdo
      {
        regex: /<CardTitle([^>]*)>\s*<\/CardTitle>/g,
        replacement: '<CardTitle$1>{title || "Título"}</CardTitle>',
        description: 'Adicionar conteúdo padrão para CardTitle'
      },
      {
        regex: /<AlertTitle([^>]*)>\s*<\/AlertTitle>/g,
        replacement: '<AlertTitle$1>{title || "Alerta"}</AlertTitle>',
        description: 'Adicionar conteúdo padrão para AlertTitle'
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

      // Aplica correções de variáveis não utilizadas
      this.patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
          content = content.replace(pattern.regex, pattern.replacement);
          fileReplacements += matches.length;
          modified = true;
          console.log(`  ✓ ${pattern.description}: ${matches.length} ocorrências`);
        }
      });

      // Aplica correções de acessibilidade apenas em arquivos UI
      if (filePath.includes('/ui/')) {
        this.accessibilityPatterns.forEach(pattern => {
          const matches = content.match(pattern.regex);
          if (matches) {
            content = content.replace(pattern.regex, pattern.replacement);
            fileReplacements += matches.length;
            modified = true;
            console.log(`  ✓ ${pattern.description}: ${matches.length} ocorrências`);
          }
        });
      }

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
   * Encontra arquivos relevantes
   */
  findRelevantFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (
          item.endsWith('.test.tsx') || 
          item.endsWith('.test.ts') ||
          (item.endsWith('.tsx') && fullPath.includes('/ui/'))
        ) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory(dir);
    return files;
  }

  /**
   * Corrige dependências do React Hook
   */
  fixReactHookDeps() {
    const hookFile = path.join(__dirname, '..', 'src', 'hooks', 'useEntries.ts');
    
    if (fs.existsSync(hookFile)) {
      console.log('🔍 Corrigindo dependências do React Hook em useEntries.ts');
      
      let content = fs.readFileSync(hookFile, 'utf8');
      
      // Corrige a dependência missing no useMemo
      const hookPattern = /useMemo\(\(\) => \{[\s\S]*?\}, \[([^\]]*?)\]\)/g;
      const match = content.match(hookPattern);
      
      if (match) {
        content = content.replace(
          /useMemo\(\(\) => \{[\s\S]*?\}, \[([^\]]*?)\]\)/g,
          (match, deps) => {
            if (!deps.includes('options')) {
              const newDeps = deps.trim() ? `${deps.trim()}, options` : 'options';
              return match.replace(`[${deps}]`, `[${newDeps}]`);
            }
            return match;
          }
        );
        
        fs.writeFileSync(hookFile, content, 'utf8');
        console.log('✅ Dependência "options" adicionada ao useMemo');
        this.stats.replacements++;
      }
    }
  }

  /**
   * Executa a correção
   */
  run() {
    console.log('🔧 Iniciando correção de variáveis não utilizadas e problemas menores\n');
    
    const srcDir = path.join(__dirname, '..', 'src');
    const files = this.findRelevantFiles(srcDir);
    
    console.log(`📁 Encontrados ${files.length} arquivos relevantes\n`);
    
    // Processa cada arquivo
    files.forEach(file => {
      console.log(`🔍 Processando: ${path.relative(srcDir, file)}`);
      this.processFile(file);
      console.log('');
    });
    
    // Corrige dependências do React Hook
    this.fixReactHookDeps();
    
    // Exibe estatísticas finais
    console.log('\n📊 Estatísticas da correção:');
    console.log(`   Arquivos processados: ${this.stats.filesProcessed}`);
    console.log(`   Total de correções: ${this.stats.replacements}`);
    console.log(`   Erros encontrados: ${this.stats.errors}`);
    
    if (this.stats.replacements > 0) {
      console.log('\n✅ Correções aplicadas com sucesso!');
    } else {
      console.log('\nℹ️  Nenhuma correção necessária.');
    }
  }
}

// Executa o script
if (require.main === module) {
  const fixer = new UnusedVarsFixer();
  fixer.run();
}

module.exports = UnusedVarsFixer;