# 🤝 Contributing Guide

Want to contribute to Chameleon Chat? Awesome! Here's how.

---

## 🎯 Ways to Contribute

1. **Report Bugs** - Found something broken? Let us know!
2. **Suggest Features** - Have an idea? Open an issue!
3. **Improve Docs** - Fix typos, clarify instructions
4. **Write Code** - Fix bugs, add features
5. **Share the App** - Spread the word!

---

## 🐛 Reporting Bugs

**Before reporting:**
- Check if it's already reported (search issues)
- Verify it's actually a bug (not expected behavior)
- Test in latest version

**Good bug report includes:**
```markdown
### Description
Clear description of the bug

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: macOS 14.1
- Browser: Chrome 120
- Version: v1.2.3

### Screenshots
If applicable

### Error Messages
```
Error: ...
```
```

**Label it:** `bug`

---

## 💡 Suggesting Features

**Good feature request:**
```markdown
### Feature Description
Clear description of the feature

### Use Case
Who needs this and why?

### Proposed Solution
How might it work?

### Alternatives Considered
Other approaches you thought of

### Additional Context
Mockups, examples from other apps, etc.
```

**Label it:** `enhancement`

---

## 🏗️ Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git
- Supabase account
- OpenRouter API key

### Clone & Install

```bash
# Fork the repo on GitHub first!

# Clone your fork
git clone https://github.com/YOUR_USERNAME/v0-react-chat-interface.git
cd v0-react-chat-interface

# Install dependencies
pnpm install  # or npm install

# Copy env template
cp .env.example .env.local

# Add your API keys
# Edit .env.local with your Supabase & OpenRouter keys
```

### Run Development Server

```bash
pnpm dev  # or npm run dev

# Open http://localhost:3000
```

### Database Setup

1. Create Supabase project
2. Run migrations in SQL editor (scripts/001-023)
3. Enable RLS on all tables
4. Test auth (signup should auto-create profile)

---

## 📝 Code Standards

### TypeScript

**Use strict mode:**
```typescript
// ✅ Good
interface Props {
  title: string;
  count: number;
}

// ❌ Bad
interface Props {
  title: any;  // Don't use 'any'
  count;       // Missing type
}
```

**Export types:**
```typescript
// types/index.ts
export interface Chat {
  id: string;
  title: string;
  // ...
}
```

### React Components

**Use functional components:**
```typescript
// ✅ Good
export function ChatMessage({ content }: { content: string }) {
  return <div>{content}</div>;
}

// ❌ Bad
class ChatMessage extends React.Component {
  // Don't use class components
}
```

**Hooks best practices:**
```typescript
// ✅ Good
const [count, setCount] = useState(0);

useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [dependency]); // Always include dependencies

// ❌ Bad
useEffect(() => {
  setCount(count + 1);  // Missing dependency
});
```

### File Organization

```
components/
  ui/              # Reusable UI primitives
  feature-name/    # Feature-specific components
  FeatureName.tsx  # Main component
  types.ts         # Component types
  utils.ts         # Component utilities
```

### Naming Conventions

- **Components:** PascalCase (`ChatMessage.tsx`)
- **Functions:** camelCase (`sendMessage()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_TOKENS`)
- **Types/Interfaces:** PascalCase (`interface ChatMessage`)
- **Files:** kebab-case (`chat-message.tsx`) or PascalCase for components

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Debounce search to avoid excessive API calls
const debouncedSearch = useMemo(() =>
  debounce(searchFunction, 300), []);

// ❌ Bad: Obvious comment
// Set count to 0
setCount(0);
```

---

## 🔧 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/add-voice-mode
# or
git checkout -b fix/message-streaming-bug
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests

### 2. Make Changes

- Write clean, documented code
- Follow code standards above
- Add comments where helpful
- Keep commits focused

### 3. Test Locally

```bash
# Run type check
pnpm tsc --noEmit

# Run build
pnpm build

# Test features manually
pnpm dev
```

### 4. Commit

**Good commit messages:**
```bash
# ✅ Good
git commit -m "feat: add voice input support"
git commit -m "fix: resolve streaming bug on mobile"
git commit -m "docs: update API documentation"

# ❌ Bad
git commit -m "changes"
git commit -m "fix"
git commit -m "update stuff"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code change)
- `refactor:` - Code refactoring
- `test:` - Add tests
- `chore:` - Maintenance

### 5. Push & Create PR

```bash
git push origin feature/add-voice-mode
```

**Then on GitHub:**
1. Click "Compare & pull request"
2. Fill out PR template
3. Link related issues (#123)
4. Request review

---

## 🧪 Testing

### Manual Testing

**Before submitting PR, test:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Works on mobile
- [ ] Works with different personas
- [ ] Doesn't break existing features

### Automated Testing (Future)

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run type check
pnpm type-check

# Run linter
pnpm lint
```

---

## 📦 Adding Dependencies

**Ask first:**
- Open issue discussing new dependency
- Explain why existing solution doesn't work
- Consider bundle size impact

**If approved:**
```bash
pnpm add package-name
# or
pnpm add -D package-name  # dev dependency
```

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Simple & Clean** - No clutter
2. **Fast & Responsive** - Instant feedback
3. **Accessible** - Keyboard navigation, screen readers
4. **Consistent** - Reuse components, follow patterns

### Using shadcn/ui

**Always use existing components:**
```typescript
// ✅ Good
import { Button } from "@/components/ui/button"

<Button variant="outline" size="sm">
  Click me
</Button>

// ❌ Bad
<button className="px-4 py-2 rounded...">
  Click me
</button>
```

**Add new shadcn components:**
```bash
npx shadcn-ui@latest add badge
```

### Accessibility

```typescript
// ✅ Good
<Button aria-label="Send message">
  <SendIcon />
</Button>

// ❌ Bad
<div onClick={send}>  {/* Not keyboard accessible */}
  <SendIcon />
</div>
```

**Test:**
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader (macOS VoiceOver, NVDA)
- Color contrast (4.5:1 minimum)

---

## 🔍 Code Review Process

### For Contributors

**Before requesting review:**
- [ ] Self-review your changes
- [ ] Test thoroughly
- [ ] Write clear PR description
- [ ] Link related issues

**During review:**
- Respond to feedback promptly
- Be open to suggestions
- Discuss disagreements respectfully
- Make requested changes

### For Reviewers

**Review for:**
- Code quality & standards
- Functionality & correctness
- Performance implications
- Security considerations
- Documentation updates needed

**Review tone:**
```markdown
# ✅ Good
"Consider using `useMemo` here to avoid recalculation on every render."
"Great solution! One minor suggestion: ..."

# ❌ Bad
"This is wrong."
"Did you even test this?"
```

---

## 🚀 Release Process

### Version Numbers

**Semantic Versioning (SemVer):**
- `1.0.0` → `1.0.1` - Patch (bug fixes)
- `1.0.0` → `1.1.0` - Minor (new features, backward-compatible)
- `1.0.0` → `2.0.0` - Major (breaking changes)

### Creating a Release

**Maintainers only:**

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag:
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```
4. Create GitHub Release
5. Deploy to production

---

## 📄 Documentation

### When to Update Docs

**Always update docs when:**
- Adding new feature
- Changing API
- Modifying configuration
- Fixing docs errors/typos

**Where to update:**
- `README.md` - Overview & quick start
- `docs/user-guide.md` - User features
- `docs/api.md` - API changes
- `docs/architecture.md` - Technical changes
- Code comments - Complex logic

### Writing Good Docs

```markdown
# ✅ Good
## Feature Name

Brief description of what it does.

### How to Use

1. Step one
2. Step two
3. Step three

### Example

\`\`\`typescript
const example = "Clear code example";
\`\`\`

# ❌ Bad
## Feature

It does stuff. Figure it out.
```

---

## 🏆 Recognition

**Contributors will be:**
- Listed in README contributors section
- Mentioned in release notes
- Given credit in commit history

**Top contributors may:**
- Get maintainer access
- Help guide project direction
- Be featured on project website

---

## ❓ Questions?

- **General questions:** Open a discussion
- **Bug reports:** Open an issue
- **Feature ideas:** Open an issue
- **Security issues:** Email (don't open public issue!)

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🎉**

Every contribution makes this project better for everyone.
