# 🤝 Contributing to UMKM Mahasiswa Backend

Terima kasih atas minat Anda untuk berkontribusi pada platform UMKM Mahasiswa! Panduan ini akan membantu Anda memulai kontribusi.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)

## 📜 Code of Conduct

Proyek ini mengikuti [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Dengan berpartisipasi, Anda diharapkan menjunjung tinggi kode etik ini.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Git
- Docker (optional)

### Setup Development Environment

1. **Fork repository**
```bash
# Fork di GitHub, lalu clone fork Anda
git clone https://github.com/YOUR_USERNAME/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend
```

2. **Add upstream remote**
```bash
git remote add upstream https://github.com/HaikalE/umkm-mahasiswa-backend.git
```

3. **Setup development environment**
```bash
./scripts/setup.sh
```

4. **Start development server**
```bash
npm run dev
```

## 🔄 Development Process

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes

### Workflow

1. **Sync dengan upstream**
```bash
git checkout develop
git fetch upstream
git merge upstream/develop
```

2. **Buat feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Develop dan test**
```bash
# Buat perubahan
npm run dev
npm test
```

4. **Commit changes**
```bash
git add .
git commit -m "feat: add amazing feature"
```

5. **Push dan create PR**
```bash
git push origin feature/amazing-feature
```

## 🎨 Code Style

### JavaScript Style Guide

- Gunakan **ES6+** syntax
- **2 spaces** untuk indentation
- **Semicolons** untuk statement termination
- **camelCase** untuk variables dan functions
- **PascalCase** untuk classes
- **UPPER_CASE** untuk constants

### Naming Conventions

```javascript
// ✅ Good
const userProfile = await getUserProfile(userId);
const API_BASE_URL = 'https://api.example.com';
class UserController {}

// ❌ Bad
const user_profile = await get_user_profile(user_id);
const api_base_url = 'https://api.example.com';
class userController {}
```

### File Structure

```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
├── config/         # Configuration files
└── database/       # Database scripts
```

### Documentation

```javascript
/**
 * Create new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.user_type - Type of user (umkm|student)
 * @returns {Promise<Object>} Created user object
 */
const createUser = async (userData) => {
  // Implementation
};
```

## 🧪 Testing

### Test Types

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test API endpoints
3. **Security Tests** - Test authentication/authorization

### Writing Tests

```javascript
// tests/controllers/user.test.js
describe('User Controller', () => {
  describe('POST /api/users/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        user_type: 'student'
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/controllers/user.test.js

# Run tests with coverage
npm run test:coverage

# Run integration tests
./scripts/test.sh
```

## 📝 Commit Guidelines

### Conventional Commits

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
# ✅ Good commits
git commit -m "feat: add user profile upload feature"
git commit -m "fix: resolve authentication token expiry issue"
git commit -m "docs: update API documentation for chat endpoints"
git commit -m "test: add unit tests for product controller"

# ❌ Bad commits
git commit -m "update stuff"
git commit -m "fix bug"
git commit -m "changes"
```

## 🔄 Submitting Changes

### Pull Request Process

1. **Ensure tests pass**
```bash
npm test
./scripts/test.sh
```

2. **Update documentation** jika diperlukan

3. **Create PR dengan template**
   - Gunakan PR template yang tersedia
   - Berikan deskripsi yang jelas
   - Link ke issue yang terkait
   - Tambahkan screenshots jika UI changes

4. **Respond to review feedback**
   - Alamat semua feedback reviewer
   - Update PR sesuai saran
   - Request re-review setelah changes

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated

## Related Issues
Closes #123
```

## 🐛 Issue Guidelines

### Bug Reports

Gunakan template issue untuk bug reports:

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should have happened.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- Database: [e.g. PostgreSQL 15.3]

**Additional Context**
Any other relevant information.
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Detailed description of the solution.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other relevant information.
```

## 🏷️ Labels

- `bug` - Bug reports
- `enhancement` - New features
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: low` - Low priority
- `wontfix` - Will not be fixed

## 🎯 Areas for Contribution

### 🚀 High Priority
- API optimization
- Security improvements
- Test coverage increase
- Performance enhancements

### 📖 Documentation
- API documentation improvements
- Code comments
- Tutorial creation
- Translation (Indonesian/English)

### 🧪 Testing
- Unit test coverage
- Integration test scenarios
- Performance testing
- Security testing

### 🐛 Bug Fixes
- Check open issues
- Fix reported bugs
- Improve error handling

### ✨ New Features
- Chat improvements
- Notification system
- Analytics features
- Mobile API optimizations

## 📞 Getting Help

- **GitHub Discussions** - General questions
- **Issues** - Bug reports dan feature requests
- **Email** - dev@umkm-mahasiswa.id
- **Discord** - [Link to Discord server]

## 🙏 Recognition

Kontributor akan diakui di:
- README.md contributors section
- Release notes
- Project website (future)

## 📄 License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah MIT License.

---

**Terima kasih telah berkontribusi untuk platform UMKM Mahasiswa! 🚀**

*Setiap kontribusi, sekecil apapun, sangat berarti untuk komunitas.*