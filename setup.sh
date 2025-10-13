#!/bin/bash

echo "🚀 Configurando Dashboard Financeiro..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
    echo ""
    echo "🎉 Setup concluído!"
    echo ""
    echo "Para executar o projeto:"
    echo "  npm run dev"
    echo ""
    echo "Para build de produção:"
    echo "  npm run build"
    echo ""
    echo "📖 Consulte o README.md para mais informações."
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi
