# Contributing to Chameleon Chat

First off, thank you for considering contributing to Chameleon Chat! 🦎

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- **Be Respectful**: Treat everyone with respect. No harassment, discrimination, or inappropriate behavior.
- **Be Constructive**: Provide helpful feedback. Criticism should be constructive.
- **Be Patient**: Remember that everyone was a beginner once.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Great bug reports include:**
- A clear, descriptive title
- Steps to reproduce the behavior
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node version)

### 💡 Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been suggested
- Provide a clear use case
- Explain why this feature would be useful

### 🔧 Code Contributions

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (see [Commit Messages](#commit-messages))
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Chameleon-LocalAI-Chat.git
cd Chameleon-LocalAI-Chat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
chamloc/
├── app/                # Next.js app router pages
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── ...            # Feature components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
├── docs/              # Documentation
└── public/            # Static assets
```

### Running Tests

```bash
# Type checking
npm run lint

# Build test
npm run build
```

## Pull Request Process

1. **Update documentation** if you're adding/changing features
2. **Follow the style guidelines** below
3. **Test your changes** thoroughly
4. **Update the CHANGELOG.md** with your changes
5. **Request review** from maintainers

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-reviewed my code
- [ ] Added/updated documentation as needed
- [ ] No new warnings or errors
- [ ] Changes work on both light and dark themes
- [ ] Mobile-responsive (if UI changes)

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface UserProps {
  name: string
  age: number
}

function greetUser(user: UserProps): string {
  return `Hello, ${user.name}!`
}

// Avoid
function greetUser(user: any) {
  return `Hello, ${user.name}!`
}
```

### React Components

- Use functional components with hooks
- Use `memo()` for expensive components
- Keep components focused and small
- Extract complex logic into custom hooks

```typescript
// Good
export const UserCard = memo(function UserCard({ user }: UserCardProps) {
  return (
    <div className="...">
      {user.name}
    </div>
  )
})
```

### CSS/Tailwind

- Use Tailwind utility classes
- Use `cn()` for conditional classes
- Keep responsive design in mind
- Follow existing naming patterns

```typescript
<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-primary",
  className
)}>
```

### File Naming

- Components: `kebab-case.tsx` (e.g., `user-card.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-draft.ts`)
- Utils: `kebab-case.ts` (e.g., `search-service.ts`)
- Types: in `types/index.ts` or feature-specific files

## Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code change that neither fixes nor adds
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```
feat(personas): add new Chef Marco persona

fix(chat): resolve message ordering issue on mobile

docs(readme): update installation instructions

refactor(search): extract search logic into service
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🦎
