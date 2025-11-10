#!/bin/bash
# Release automation script for Sienn-AI

set -e

VERSION=${1:-"0.1.0"}

echo "🚀 Sienn-AI Release Process"
echo "============================"
echo "Version: v${VERSION}"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "dev" ]; then
    echo -e "${YELLOW}Warning: Not on main or dev branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    git status --short
    exit 1
fi

# Step 1: Run tests
echo -e "${BLUE}Step 1/6: Running tests...${NC}"
./scripts/build_production.sh || { echo -e "${RED}Build failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Tests passed${NC}"

# Step 2: Update version in files
echo ""
echo -e "${BLUE}Step 2/6: Updating version numbers...${NC}"

# Update backend version
sed -i "s/version=\".*\"/version=\"${VERSION}\"/" backend/app/main.py

# Update frontend version
cd frontend
npm version ${VERSION} --no-git-tag-version
cd ..

echo -e "${GREEN}✅ Version updated to ${VERSION}${NC}"

# Step 3: Generate changelog
echo ""
echo -e "${BLUE}Step 3/6: Generating changelog...${NC}"

# Get commit messages since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
    echo "First release - no previous tag found"
    COMMITS=$(git log --pretty=format:"- %s (%h)" --no-merges)
else
    echo "Changes since ${LAST_TAG}"
    COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"- %s (%h)" --no-merges)
fi

CHANGELOG_ENTRY="## [${VERSION}] - $(date +%Y-%m-%d)

### Added
${COMMITS}
"

echo "$CHANGELOG_ENTRY"
echo ""

# Step 4: Commit version changes
echo -e "${BLUE}Step 4/6: Committing version changes...${NC}"
git add backend/app/main.py frontend/package.json frontend/package-lock.json
git commit -m "chore(release): bump version to ${VERSION}" || echo "No changes to commit"
echo -e "${GREEN}✅ Changes committed${NC}"

# Step 5: Create git tag
echo ""
echo -e "${BLUE}Step 5/6: Creating git tag v${VERSION}...${NC}"
git tag -a "v${VERSION}" -m "Release version ${VERSION}

${CHANGELOG_ENTRY}"
echo -e "${GREEN}✅ Tag created${NC}"

# Step 6: Push to remote
echo ""
echo -e "${BLUE}Step 6/6: Pushing to remote...${NC}"
read -p "Push to remote? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin $CURRENT_BRANCH
    git push origin "v${VERSION}"
    echo -e "${GREEN}✅ Pushed to remote${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped push to remote${NC}"
    echo "To push manually:"
    echo "  git push origin $CURRENT_BRANCH"
    echo "  git push origin v${VERSION}"
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Release v${VERSION} Created!${NC}"
echo "======================================"
echo ""
echo "What's next:"
echo "  1. Verify the tag: git tag -l"
echo "  2. Create GitHub Release at:"
echo "     https://github.com/doriansenecot/Sienn-AI/releases/new?tag=v${VERSION}"
echo "  3. Add release notes and attach artifacts"
echo ""
echo "To rollback this release:"
echo "  git tag -d v${VERSION}"
echo "  git push origin :refs/tags/v${VERSION}"
echo "  git reset --hard HEAD~1"
echo ""
