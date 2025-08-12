#!/usr/bin/env python3
"""
Script para execução de testes automatizados do backend.

Este script facilita a execução de diferentes tipos de testes e geração de relatórios.

Uso:
    python run_tests.py [opções]

Opções:
    --unit          Executa apenas testes unitários
    --integration   Executa apenas testes de integração
    --coverage      Gera relatório de cobertura (padrão: ativado)
    --no-coverage   Desabilita relatório de cobertura
    --html          Gera relatório HTML de cobertura
    --verbose       Execução verbosa
    --fast          Execução rápida (sem relatórios detalhados)
    --help          Mostra esta ajuda

Exemplos:
    python run_tests.py                    # Todos os testes com cobertura
    python run_tests.py --unit             # Apenas testes unitários
    python run_tests.py --integration      # Apenas testes de integração
    python run_tests.py --html             # Com relatório HTML
    python run_tests.py --fast             # Execução rápida
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description=""):
    """Executa um comando e retorna o código de saída."""
    if description:
        print(f"\n🔄 {description}")
    
    print(f"Executando: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    
    if result.returncode == 0:
        print(f"✅ {description or 'Comando'} executado com sucesso")
    else:
        print(f"❌ {description or 'Comando'} falhou com código {result.returncode}")
    
    return result.returncode


def main():
    parser = argparse.ArgumentParser(
        description="Script para execução de testes automatizados",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument('--unit', action='store_true', 
                       help='Executa apenas testes unitários')
    parser.add_argument('--integration', action='store_true', 
                       help='Executa apenas testes de integração')
    parser.add_argument('--coverage', action='store_true', default=True,
                       help='Gera relatório de cobertura (padrão)')
    parser.add_argument('--no-coverage', action='store_true',
                       help='Desabilita relatório de cobertura')
    parser.add_argument('--html', action='store_true',
                       help='Gera relatório HTML de cobertura')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Execução verbosa')
    parser.add_argument('--fast', action='store_true',
                       help='Execução rápida (sem relatórios detalhados)')
    
    args = parser.parse_args()
    
    # Configurar comando base
    cmd = ['pytest']
    
    # Definir diretório de testes
    if args.unit:
        cmd.append('app/tests/unit')
        test_type = "unitários"
    elif args.integration:
        cmd.append('app/tests/integration')
        test_type = "de integração"
    else:
        cmd.append('app/tests')
        test_type = "todos"
    
    # Configurar cobertura
    if not args.no_coverage and not args.fast:
        cmd.extend(['--cov=app'])
        
        if args.html:
            cmd.extend(['--cov-report=html'])
        
        if not args.fast:
            cmd.extend(['--cov-report=term-missing'])
    
    # Configurar verbosidade
    if args.verbose:
        cmd.append('-v')
    elif args.fast:
        cmd.append('-q')
    
    # Executar testes
    print(f"\n🧪 Executando testes {test_type}...")
    print(f"Diretório: {Path.cwd()}")
    
    exit_code = run_command(cmd, f"Testes {test_type}")
    
    # Relatório final
    if exit_code == 0:
        print("\n🎉 Todos os testes passaram!")
        if args.html and not args.no_coverage:
            print("📊 Relatório HTML de cobertura disponível em: htmlcov/index.html")
    else:
        print("\n💥 Alguns testes falharam. Verifique a saída acima.")
    
    return exit_code


if __name__ == '__main__':
    sys.exit(main())