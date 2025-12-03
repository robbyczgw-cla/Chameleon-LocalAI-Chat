#!/bin/bash

# ===================================
# Chameleon Chat - Quick Install Script
# ===================================
# Usage: curl -fsSL https://raw.githubusercontent.com/robbyczgw-cla/Chameleon-LocalAI-Chat/main/scripts/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "  🦎 Chameleon Chat Installer"
echo "  ============================"
echo -e "${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo ""
    echo "Please install Node.js 18+ first:"
    echo "  - macOS: brew install node"
    echo "  - Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  - Windows: https://nodejs.org/en/download/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# Clone repository
INSTALL_DIR="${1:-chameleon-chat}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠ Directory '$INSTALL_DIR' already exists${NC}"
    read -p "Remove and reinstall? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Installation cancelled"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📦 Cloning repository...${NC}"
git clone --depth 1 https://github.com/robbyczgw-cla/Chameleon-LocalAI-Chat.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "  To start Chameleon Chat:"
echo -e "  ${YELLOW}cd $INSTALL_DIR${NC}"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo -e "${BLUE}💡 Tip: Install LM Studio for free local AI models${NC}"
echo "  https://lmstudio.ai/"
echo ""
echo -e "${GREEN}🦎 Happy chatting!${NC}"
