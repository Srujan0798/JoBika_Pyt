# Contributing to JoBika

Thank you for your interest in contributing to JoBika! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

1. **Report Bugs** - Found a bug? Create an issue
2. **Suggest Features** - Have an idea? Share it!
3. **Fix Issues** - Pick an issue and submit a PR
4. **Improve Documentation** - Help make our docs better
5. **Write Tests** - Increase code coverage

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/JoBika_Py.git
cd JoBika_Py
```

### 2. Set Up Development Environment

```bash
# Run automated setup
./setup.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
cd backend
pip install -r requirements.txt
python3 migrate_db.py
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## 📝 Development Guidelines

### Code Style

**Python**:
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions
- Keep functions focused and small

**JavaScript**:
- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions pure when possible

**CSS**:
- Follow BEM naming convention
- Use CSS variables for colors
- Keep specificity low

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good ✅
git commit -m "Add email validation to registration form"
git commit -m "Fix database connection pooling issue"
git commit -m "Update README with setup instructions"

# Bad ❌
git commit -m "fixes"
git commit -m "update"
git commit -m "work in progress"
```

### Testing

Always add tests for new features:

```bash
# Run tests before committing
cd backend/tests
python3 run_tests.py

# Add tests in appropriate file:
# - test_basic.py for unit tests
# - test_api.py for API tests
```

## 🔧 Project Structure

```
JoBika_Py/
├── app/              # Frontend files
├── backend/          # Backend Python code
│   ├── server.py         # Main server
│   ├── resume_*.py       # Resume processing
│   ├── job_*.py          # Job scraping
│   └── tests/            # Test files
└── docs/             # Documentation
```

## 📋 Pull Request Process

### 1. Before Submitting

- [ ] Run all tests: `python3 backend/tests/run_tests.py`
- [ ] Update documentation if needed
- [ ] Add tests for new features
- [ ] Follow code style guidelines
- [ ] Test manually in browser

### 2. Submit PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR on GitHub with:
# - Clear title
# - Description of changes
# - Screenshots (if UI changes)
# - Issue number (if applicable)
```

### 3. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
How did you test this?

## Screenshots
(if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] All tests passing
```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Python version: [e.g., 3.9.1]
- Browser: [e.g., Chrome, Firefox]

**Additional context**
Any other relevant information.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information, mockups, etc.
```

## 🎨 UI/UX Contributions

When contributing UI changes:

1. **Maintain Consistency**: Use existing color scheme and design patterns
2. **Mobile Responsive**: Test on different screen sizes
3. **Accessibility**: Consider keyboard navigation and screen readers
4. **Performance**: Optimize images and minimize CSS/JS

## 📚 Documentation

Help improve documentation:

1. **Fix Typos**: Even small fixes are appreciated
2. **Add Examples**: Code examples help understanding
3. **Update Guides**: Keep installation and setup guides current
4. **Write Tutorials**: Step-by-step tutorials for common tasks

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated in our community!

## ❓ Questions?

- **General Questions**: Create a discussion on GitHub
- **Bug Reports**: Create an issue
- **Feature Requests**: Create an issue with [Feature] tag
- **Security Issues**: Email privately (don't create public issue)

## 📜 Code of Conduct

### Our Standards

✅ **DO**:
- Be respectful and inclusive
- Provide constructive feedback
- Accept constructive criticism
- Focus on what's best for the community

❌ **DON'T**:
- Harass or discriminate
- Use inappropriate language
- Share private information
- Engage in trolling

## 🎉 Thank You!

Every contribution helps make JoBika better for job seekers worldwide. Thank you for your support!

---

**Questions?** Open an issue or start a discussion!
