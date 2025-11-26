#!/bin/bash
# Script de build para Render - Instala dependencias de Node.js y Python

set -e

echo "🔧 Instalando dependencias de Node.js..."
npm install

echo "🐍 Verificando Python..."
python3 --version || python --version || (echo "⚠️ Python no encontrado, intentando continuar..." && exit 0)

echo "📦 Instalando dependencias de Python para modelo de predicción ACV..."
cd models
if [ -f requirements.txt ]; then
    pip3 install -r requirements.txt || pip install -r requirements.txt || (echo "⚠️ Error instalando dependencias Python, continuando..." && cd ..)
else
    echo "⚠️ requirements.txt no encontrado en models/"
fi
cd ..

# Whisper deshabilitado temporalmente
# echo "📦 Instalando dependencias de Python para Whisper..."
# cd integrations/whisper_stt
# pip3 install -r requirements.txt || pip install -r requirements.txt
# cd ../..

echo "✅ Build completado"

