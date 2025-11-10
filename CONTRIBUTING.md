# Contributing to Sienn-AI

First off, thank you for considering contributing to Sienn-AI! 🎉

This document provides guidelines for contributing to the project. Following these guidelines helps maintain code quality and makes the review process smoother.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** (3.11 recommended)
- **Node.js 20+** (for frontend)
- **Docker & Docker Compose**
- **Git**
- Optional: NVIDIA GPU with CUDA 11.8+ for faster training

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Sienn-AI.git
   cd Sienn-AI
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/doriansenecot/Sienn-AI.git
   ```

### Setup Development Environment

#### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov ruff black
```

#### Frontend Setup

```bash
cd frontend
npm install
```

#### Docker Setup

```bash
# From project root
docker-compose up -d
```

---

## 🔄 Development Workflow

### Branch Strategy

We use a simplified Git Flow:

- `main` - Production-ready code
- `dev` - Development branch (default target for PRs)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `chore/*` - Maintenance tasks (docs, deps, CI)
- `hotfix/*` - Urgent production fixes

### Creating a Branch

```bash
# Update your local dev branch
git checkout dev
git pull upstream dev

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Naming Conventions

**Branches:**
- `feature/add-model-comparison`
- `bugfix/fix-upload-timeout`
- `chore/update-dependencies`

**Files/Folders:**
- Use `snake_case` for Python files: `finetuning_service.py`
- Use `PascalCase` for React components: `ModelCard.tsx`
- Use lowercase with hyphens for directories: `model-browser/`

---

## 🎨 Coding Standards

### Python (Backend)

We use **Ruff** for linting and **Black** for formatting.

#### Style Guidelines

- Follow PEP 8
- Maximum line length: 120 characters
- Use type hints for function signatures
- Write docstrings for all public functions/classes

#### Example

```python
from typing import Optional

def process_dataset(
    dataset_path: str,
    batch_size: int = 32,
    max_length: Optional[int] = None,
) -> dict:
    """
    Process a dataset for fine-tuning.

    Args:
        dataset_path: Path to the dataset file
        batch_size: Number of samples per batch
        max_length: Maximum sequence length (None = auto-detect)

    Returns:
        Dictionary with processing statistics
    """
    # Implementation
    pass
```

#### Run Linting

```bash
cd backend
ruff check app/
black app/
```

### TypeScript/React (Frontend)

We use **ESLint** for linting and **Prettier** for formatting.

#### Style Guidelines

- Use functional components with hooks
- Prefer TypeScript interfaces over types
- Use proper TypeScript types (avoid `any`)
- Follow React best practices (keys, memoization, etc.)

#### Example

```typescript
interface ModelCardProps {
  modelId: string;
  modelName: string;
  status: 'training' | 'completed' | 'failed';
  onTest?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  modelId,
  modelName,
  status,
  onTest,
}) => {
  // Implementation
};
```

#### Run Linting

```bash
cd frontend
npm run lint
npm run format
npm run type-check
```

---

## 📝 Commit Guidelines

We follow **Conventional Commits** for clear and semantic commit messages.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature/fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (deps, CI, build)
- `revert`: Reverting a previous commit

### Examples

```bash
# Good commits
git commit -m "feat(api): add model comparison endpoint"
git commit -m "fix(upload): handle CSV with special characters"
git commit -m "docs(readme): update installation instructions"
git commit -m "chore(deps): upgrade transformers to 4.46.0"

# Bad commits (avoid these)
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "update"
```

### Scope Examples

- `api`, `worker`, `db`, `models` (backend)
- `ui`, `components`, `pages`, `hooks` (frontend)
- `docker`, `ci`, `scripts` (infrastructure)
- `docs`, `tests` (general)

---

## 🔍 Pull Request Process

### Before Submitting

1. **Update from upstream:**
   ```bash
   git checkout dev
   git pull upstream dev
   git checkout your-feature-branch
   git rebase dev
   ```

2. **Run tests:**
   ```bash
   # Backend
   cd backend && pytest tests/unit/ -v

   # Frontend
   cd frontend && npm run lint && npm run type-check
   ```

3. **Ensure linting passes:**
   ```bash
   # Backend
   cd backend && ruff check app/ && black app/

   # Frontend
   cd frontend && npm run lint:fix && npm run format
   ```

4. **Update documentation if needed**

### Creating the PR

1. Push your branch:
   ```bash
   git push origin your-feature-branch
   ```

2. Go to GitHub and create a Pull Request to `dev` branch

3. Fill out the PR template:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated tests
- [ ] Added/updated documentation
- [ ] All tests passing
- [ ] No new warnings
```

### Review Process

- At least 1 approval required before merging
- CI must pass (linting, tests, build)
- Resolve all review comments
- Keep the PR focused (one feature/fix per PR)
- Squash commits if necessary

---

## 🧪 Testing Guidelines

### Backend Tests

We use **pytest** for backend testing.

#### Writing Tests

```python
# tests/unit/test_dataset_service.py
import pytest
from app.services.dataset_service import DatasetService

@pytest.mark.asyncio
async def test_upload_csv():
    """Test CSV upload functionality"""
    service = DatasetService()
    result = await service.upload_dataset(
        file_path="test_data.csv",
        filename="test.csv"
    )
    assert result["status"] == "success"
    assert "dataset_id" in result
```

#### Run Tests

```bash
cd backend
pytest tests/unit/ -v --cov=app --cov-report=term
```

### Frontend Tests

We use **Vitest** for frontend testing (to be added).

```typescript
// src/components/__tests__/ModelCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ModelCard } from '../ModelCard';

describe('ModelCard', () => {
  it('renders model name', () => {
    render(<ModelCard modelId="123" modelName="GPT-2" status="completed" />);
    expect(screen.getByText('GPT-2')).toBeInTheDocument();
  });
});
```

---

## 📚 Documentation

### When to Update Documentation

- Adding new features → Update `docs/USER_GUIDE.md`
- Changing API → Update `docs/API_DOCUMENTATION.md`
- Architectural changes → Update `docs/contexte/ARCHITECTURE.md`
- New configuration → Update README or relevant docs

### Documentation Style

- Use clear, concise language
- Include code examples with syntax highlighting
- Add screenshots for UI changes
- Keep examples up-to-date with code

---

## 🐛 Reporting Bugs

When reporting bugs, include:

1. **Description**: What happened vs. what you expected
2. **Steps to Reproduce**: Minimal steps to trigger the bug
3. **Environment**: OS, Python version, Docker version, etc.
4. **Logs**: Relevant error messages or stack traces
5. **Screenshots**: If UI-related

Use the GitHub issue template when available.

---

## 💡 Suggesting Features

Feature suggestions are welcome! Please:

1. Check existing issues first
2. Describe the use case clearly
3. Explain why it's valuable
4. Consider implementation complexity
5. Be open to discussion

---

## 🤝 Getting Help

- **GitHub Discussions**: Ask questions or discuss ideas
- **GitHub Issues**: Report bugs or request features
- **Pull Requests**: Review code and provide feedback

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🎉 Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- Special thanks in README (for major features)

---

**Thank you for contributing to Sienn-AI!** 🚀

Every contribution, no matter how small, makes a difference.
