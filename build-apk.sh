#!/bin/bash

# MPA Mobile App - Production APK Build Script
# Builds APK connected to AWS backend (13.204.65.158)

echo "🔨 Building MPA Mobile App - Production APK"
echo "Backend URL: http://13.204.65.158/api/v1"
echo ""

# Set environment variables
export EXPO_PUBLIC_API_URL="http://13.204.65.158/api/v1"
export NODE_ENV="production"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build APK using EAS
echo "🚀 Building APK with Expo..."
eas build --platform android --non-interactive

echo "✅ APK build complete!"
echo "APK will be available at: https://expo.dev/builds"
