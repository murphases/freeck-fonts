# Contributing to FreeckFonts

Thank you for your interest in contributing! This document explains how you can help improve FreeckFonts.

---

## Table of Contents

- [Code Contributions](#code-contributions)
- [Translation Contributions](#translation-contributions)
- [Guidelines](#guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Pull Requests](#pull-requests)
- [License](#license)

---

## Code Contributions

### Requirements

- Node.js 20+
- npm 10+

### Environment setup

```bash
git clone https://github.com/freeckfonts/freeckfonts.git
cd freeckfonts
npm install
npm run dev
```

### Project structure

```
src/
  main/      # Electron main process (Node.js)
  preload/   # Secure bridge between main and renderer
  renderer/  # React UI (TypeScript + Tailwind)
  shared/    # Types shared between processes
```

### Code standards

- **TypeScript** required — no explicit `any`
- **React components** as `React.FC` with typed props
- **Global state** via Zustand (`src/renderer/src/store/`)
- **IPC** via `bridge.ts` (never call `window.api` directly from components)
- **UI strings** always via `t()` from `react-i18next` — see the translation section below
- **Formatting** with Prettier (project default config)

### Creating a branch

```bash
git checkout -b feat/my-feature
# or
git checkout -b fix/bug-description
```

---

## Translation Contributions

FreeckFonts uses **i18next** for internationalisation. Adding a new language is straightforward — follow the 4 steps below.

### Step 1 — Copy the reference file

Create a folder with the IETF language code and copy the English translation file as a starting point:

```bash
# Example: adding Spanish (Spain)
cp -r src/renderer/src/locales/en-US src/renderer/src/locales/es-ES
```

The reference file is at:

```
src/renderer/src/locales/en-US/translation.json
```

### Step 2 — Translate the file

Edit `src/renderer/src/locales/es-ES/translation.json` translating all **values** (do not change the keys).

Pay attention to i18next special syntax:

| Feature          | Example                                 | Description                    |
| ---------------- | --------------------------------------- | ------------------------------ |
| Plural           | `"fontCount_one"` / `"fontCount_other"` | Singular/plural forms          |
| Interpolation    | `"{{count}} fonts"`                     | Variable replaced at runtime   |
| Do not translate | Keys like `"AIzaSy..."`, URLs           | Technical values — leave as-is |

### Step 3 — Register the language in `i18n.ts`

Open `src/renderer/src/i18n.ts` and make **two** additions:

**a) Import the translation file:**

```typescript
import esES from "./locales/es-ES/translation.json";
```

**b) Add to the `SUPPORTED_LANGUAGES` list:**

```typescript
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "pt-BR",
    label: "Portuguese (Brazil)",
    nativeLabel: "Português (Brasil)",
  },
  { code: "en-US", label: "English (US)", nativeLabel: "English (US)" },
  { code: "es-ES", label: "Spanish (Spain)", nativeLabel: "Español (España)" }, // ← new
];
```

**c) Register the resource in `i18n.init()`:**

```typescript
resources: {
  "pt-BR": { translation: ptBR },
  "en-US": { translation: enUS },
  "es-ES": { translation: esES }, // ← new
},
```

### Step 4 — Test

Run the app and go to **Settings → Language** to verify the new language appears and works correctly.

```bash
npm run dev
```

---

## Guidelines

- Keep source code comments in English
- New font source services must extend `BaseSourceService`
- Never expose Node.js APIs directly to the renderer — use the bridge
- All contributions are automatically licensed under the same terms as [MIT + Commons Clause](LICENSE)

---

## Reporting Bugs

Open an [Issue](https://github.com/freeckfonts/freeckfonts/issues) with:

- FreeckFonts version
- Operating system and version
- Steps to reproduce the bug
- Expected vs. observed behaviour
- Relevant logs (available via DevTools or the Electron console)

---

## Pull Requests

1. Ensure there are no TypeScript errors (`npm run build`)
2. Clearly describe what was added or fixed
3. For translations, mention the language and the reference file used
4. Incomplete translation PRs are welcome — indicate which keys still need review

---

## License

By contributing to this project, you agree that your contributions will be
licensed under the **MIT License + Commons Clause**.

Summary:

- ✅ Anyone can use FreeckFonts as a tool, including in commercial work
- ✅ Free modifications and redistribution with attribution
- ❌ Selling the software, offering it as a paid service, or embedding the code
  in a commercial product is not permitted without prior written authorisation

See [LICENSE](./LICENSE) for the full text.
