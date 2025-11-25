#!/bin/bash
# Script de build para Render - Instala dependencias de Node.js
# Whisper deshabilitado temporalmente para evitar demoras en builds

set -e

echo "🔧 Instalando dependencias de Node.js..."
npm install

# Whisper deshabilitado temporalmente
# echo "🐍 Verificando Python..."
# python3 --version || python --version
# echo "📦 Instalando dependencias de Python para Whisper..."
# cd integrations/whisper_stt
# pip3 install -r requirements.txt || pip install -r requirements.txt
# cd ../..

echo "✅ Build completado"

