# Onboarding Page (Personalized Entry) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `/` landing step where visitors pick sector "packs" and optionally list personal sources before entering the existing dashboard, which moves to `/app`.

**Architecture:** The existing dashboard (`HomePage.jsx`) is unchanged in content — only its route moves from `/` to `/app`. A new `OnboardingPage.jsx` takes `/`: it renders one selectable card per **pack** — 4 curated packs (`lib/packs.js`), not a raw 1:1 list of the 8 `sector` values: Finance (`Finance`+`Crypto`), Tech & IA (`Tech`+`IA`), Cybersécurité (`Cybersécurité` only), and Généraliste (no sector filter at all — also the only way to reach `Énergie`/`Santé`/`Autre`, which have no dedicated pack). Each pack carries its own icon/color (not derived from `sectorConfig`, since a merged pack like "Tech & IA" has no single matching sector entry) — colors are still picked from the existing palette for visual consistency. Plus a free-text "add a source" form. Selection state is persisted to `localStorage` through a small pure-function module (`lib/onboardingStorage.js`) wrapped by a thin hook (`hooks/useOnboardingSelection.js`) — this mirrors the existing `useFavorites` pattern (pure logic + `useState`/`useEffect`, `tech_watch_*` key naming). `selection.packs` stores pack **ids** (`finance`, `tech-ia`, `cybersecurite`, `generaliste`); `buildCategoriesParam` expands the selected pack ids into their underlying sector list (deduped union) for the `categories` query param — except if `generaliste` is among the selected packs, in which case the param is forced empty (no filter) regardless of what else is checked. Validating navigates to `/app?categories=<expanded sectors>`, which `HomePage.jsx` already knows how to read (`getInitialSectors()`). A discreet bypass link skips straight to `/app`.

**Tech Stack:** React 18, react-router-dom, Tailwind + shadcn/ui (Card, Checkbox, Input, Button, Badge), `sonner` toasts, existing `utils/sanitizer.js` (`sanitizeText`, `sanitizeURL`), Jest (CRACO) for the pure-function tests — no new dependencies.

**Spec:** Decision doc pasted by Nolan on 2026-09-23 (session context; not a separate file — key points reproduced in Global Constraints below).

## Global Constraints

- No user accounts / auth for this step — selection lives in `localStorage` only.
- The `localStorage` JSON shape must use the same keys a future Supabase table would use, so migration is a straight import later: `{ packs: string[], customSources: {url, label, addedAt}[], updatedAt: string }`.
- Never write to `techwatch_sources` (the live n8n ingestion registry) or any table other than `localStorage` — user-added sources are inert in this MVP, not wired to real ingestion.
- Dashboard (`/app`) must remain reachable directly, unfiltered, without going through onboarding.
- Do not touch the separate marketing landing-page project — out of scope, lives in a different repo.
- Env vars stay `REACT_APP_*` via `process.env` (CRA/CRACO) — no `import.meta.env`.
- No paywall/auth work, no changes to `techwatch_sources`/pipeline nodes (per CLAUDE.md "Ce qu'il ne faut PAS toucher").
- Packs (2026-09-23 decision, final — not "to be decided while coding"): **Finance** → `[Finance, Crypto]`, **Tech & IA** → `[Tech, IA]`, **Cybersécurité** → `[Cybersécurité]`, **Généraliste** → no sector filter (empty list), and selecting Généraliste forces an unfiltered feed even if other packs are also checked.
- Pack card colors stay within the existing `sectorConfig` (`frontend/src/lib/config.js`) palette for visual consistency, but are defined directly on each pack in `packs.js` rather than looked up from `sectorConfig`, since a merged pack (e.g. Tech & IA) has no single matching sector entry. The landing repo's design tokens are not accessible from this repo; flag to Nolan if pixel-parity with the marketing site is required later.

## Review Focus

- **Stale share/deep-link URLs to `/?article=<id>`.** `ArticleRedirect.jsx`, `HomePage.jsx`'s `seoUrl`, `ArticleModal.jsx`'s share link, and `ShareButton.jsx`'s share link all currently build links assuming the dashboard lives at `/`. Once `/` becomes the onboarding page, an un-updated one of these silently sends users to the pack-selection screen instead of the article. Every one of these four call sites is covered by its own task below.
- **Empty-selection submit.** A visitor who clicks "Voir mon dashboard" without checking any pack should land on the full, unfiltered feed (`/app`), not an empty-results dashboard — `buildCategoriesParam` returning `''` must translate to *no* `categories` param, not `categories=`.
- **Malicious/invalid custom source URL.** A user pastes `javascript:alert(1)` or a 5000-char string into the source field — must be rejected before it ever reaches `localStorage` (validated in `onboardingStorage.js`, not just sanitized at render time), with a toast explaining why, consistent with the project's existing `sanitizeURL`/URL-scheme-validation convention (see `frontend/api/og.js`'s recent scheme-validation fix).
- **Duplicate custom source.** Adding the same URL twice must not create two rows — `addCustomSource` must dedupe on exact URL match.
- **"Généraliste" checked alongside a specific pack.** E.g. `packs: ['finance', 'generaliste']` must still produce an empty `categories` param (full feed) — a pack with an empty `sectors` list overrides the union, it doesn't just get ignored.
- **`localStorage` unavailable (private browsing / quota exceeded).** `saveSelection`/`loadSelection` must not throw and crash the page — the existing `useFavorites` hook's try/catch pattern is the model to follow; selection should still work in-memory for the current visit even if persistence silently fails.

---

## File Structure

- Create: `frontend/src/lib/packs.js` — static list of 4 grouped packs (`id`, `label`, `description`, `sectors[]`, `icon`, `bg`, `text`).
- Create: `frontend/src/lib/onboardingStorage.js` — pure functions: load/save/toggle/add/remove/build-query-param (expands pack ids to sectors via `packs.js`). No React, no DOM APIs beyond `localStorage`/`URL`.
- Create: `frontend/src/lib/__tests__/onboardingStorage.test.js` — Jest tests for the pure functions (mirrors `frontend/src/validation/__tests__/filters.test.js`).
- Create: `frontend/src/hooks/useOnboardingSelection.js` — thin hook wrapping `onboardingStorage.js` with `useState`/`useEffect`, exposing `selection`, `togglePack`, `addCustomSource`, `removeCustomSource`, `categoriesParam`.
- Create: `frontend/src/pages/OnboardingPage.jsx` — the new `/` page.
- Modify: `frontend/src/App.js` — route `/` → `OnboardingPage`, add route `/app` → `HomePage`.
- Modify: `frontend/src/pages/ArticleRedirect.jsx` — redirect target `/app?article=...` (was `/?article=...`), fallback `/app` (was `/`).
- Modify: `frontend/src/pages/HomePage.jsx` — `seoUrl` builds `/app?article=...` (was `/?article=...`).
- Modify: `frontend/src/components/ArticleModal.jsx` — share link builds `/app?article=...` (was `/?article=...`).
- Modify: `frontend/src/components/ShareButton.jsx` — share link builds `/app?article=...` (was `/?article=...`).

---

### Task 1: Packs config + pure onboarding-selection storage module (TDD)

**Files:**
- Create: `frontend/src/lib/packs.js`
- Create: `frontend/src/lib/onboardingStorage.js`
- Create: `frontend/src/lib/__tests__/onboardingStorage.test.js`

**Interfaces:**
- Consumes: `sanitizeText` from `frontend/src/utils/sanitizer.js` (existing); `packs` from `./packs.js` (this task, written first).
- Produces (used by Task 2's hook and Task 3's page): from `packs.js` — `packs` array of `{ id, label, description, sectors, icon, bg, text }`. From `onboardingStorage.js` — `STORAGE_KEY`, `emptySelection()`, `loadSelection()`, `saveSelection(selection)`, `togglePack(selection, packId)`, `validateCustomSourceUrl(url)`, `addCustomSource(selection, {url, label})` → `{ selection, error }`, `removeCustomSource(selection, url)`, `deriveLabelFromUrl(url)`, `buildCategoriesParam(selection)` (expands pack ids to their sector list; a pack with an empty `sectors` array — Généraliste — forces the result to `''`).

- [ ] **Step 1: Write `packs.js`**

```javascript
// frontend/src/lib/packs.js
import { TrendingUp, Cpu, Shield, Layers } from "lucide-react";

// Packs groupés (décision Nolan, 2026-09-23 — liste finale, pas 1 pack par
// secteur). "sectors: []" (Généraliste) = pas de filtre du tout ; c'est aussi
// le seul moyen d'atteindre Énergie/Santé/Autre, qui n'ont pas de pack dédié.
export const packs = [
  {
    id: "finance",
    label: "Finance",
    description: "Marchés, résultats d'entreprises, crypto et macro.",
    sectors: ["Finance", "Crypto"],
    icon: TrendingUp,
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
  },
  {
    id: "tech-ia",
    label: "Tech & IA",
    description: "Produits tech, plateformes et actualité IA.",
    sectors: ["Tech", "IA"],
    icon: Cpu,
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
  {
    id: "cybersecurite",
    label: "Cybersécurité",
    description: "Failles, incidents, outils de défense.",
    sectors: ["Cybersécurité"],
    icon: Shield,
    bg: "bg-red-500/20",
    text: "text-red-400",
  },
  {
    id: "generaliste",
    label: "Généraliste",
    description: "Tous les secteurs, sans filtre — y compris Énergie, Santé et Autre.",
    sectors: [],
    icon: Layers,
    bg: "bg-gray-500/20",
    text: "text-gray-400",
  },
];
```

- [ ] **Step 2: Write the failing tests**

```javascript
// frontend/src/lib/__tests__/onboardingStorage.test.js
import {
  STORAGE_KEY,
  emptySelection,
  loadSelection,
  saveSelection,
  togglePack,
  validateCustomSourceUrl,
  addCustomSource,
  removeCustomSource,
  deriveLabelFromUrl,
  buildCategoriesParam,
} from '../onboardingStorage';

describe('emptySelection', () => {
  it('returns an empty packs/customSources shape', () => {
    expect(emptySelection()).toEqual({ packs: [], customSources: [] });
  });
});

describe('loadSelection / saveSelection', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty selection when nothing stored', () => {
    expect(loadSelection()).toEqual({ packs: [], customSources: [] });
  });

  it('round-trips a saved selection', () => {
    const selection = { packs: ['finance', 'tech-ia'], customSources: [{ url: 'https://example.com', label: 'Example', addedAt: '2026-01-01T00:00:00.000Z' }] };
    saveSelection(selection);
    const loaded = loadSelection();
    expect(loaded.packs).toEqual(['finance', 'tech-ia']);
    expect(loaded.customSources).toEqual(selection.customSources);
  });

  it('ignores corrupted JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSelection()).toEqual({ packs: [], customSources: [] });
  });

  it('does not throw when localStorage.setItem throws (quota/private mode)', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveSelection(emptySelection())).not.toThrow();
    spy.mockRestore();
  });
});

describe('togglePack', () => {
  it('adds a pack id not yet selected', () => {
    const result = togglePack(emptySelection(), 'finance');
    expect(result.packs).toEqual(['finance']);
  });

  it('removes a pack id already selected', () => {
    const result = togglePack({ packs: ['finance', 'tech-ia'], customSources: [] }, 'finance');
    expect(result.packs).toEqual(['tech-ia']);
  });

  it('does not mutate the input selection', () => {
    const input = { packs: [], customSources: [] };
    togglePack(input, 'finance');
    expect(input.packs).toEqual([]);
  });
});

describe('validateCustomSourceUrl', () => {
  it('accepts http and https URLs', () => {
    expect(validateCustomSourceUrl('https://example.com/feed').isValid).toBe(true);
    expect(validateCustomSourceUrl('http://example.com/feed').isValid).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    const result = validateCustomSourceUrl('javascript:alert(1)');
    expect(result.isValid).toBe(false);
  });

  it('rejects empty/missing URLs', () => {
    expect(validateCustomSourceUrl('').isValid).toBe(false);
    expect(validateCustomSourceUrl(undefined).isValid).toBe(false);
  });

  it('rejects URLs over 500 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(500);
    expect(validateCustomSourceUrl(longUrl).isValid).toBe(false);
  });
});

describe('addCustomSource', () => {
  it('adds a valid source with a derived label when none given', () => {
    const { selection, error } = addCustomSource(emptySelection(), { url: 'https://example.com/feed', label: '' });
    expect(error).toBeNull();
    expect(selection.customSources).toHaveLength(1);
    expect(selection.customSources[0].url).toBe('https://example.com/feed');
    expect(selection.customSources[0].label).toBe('example.com');
    expect(typeof selection.customSources[0].addedAt).toBe('string');
  });

  it('sanitizes an explicit label', () => {
    const { selection } = addCustomSource(emptySelection(), { url: 'https://example.com', label: '<script>x</script>My Feed' });
    expect(selection.customSources[0].label).not.toContain('<script>');
  });

  it('rejects an invalid URL and returns the original selection unchanged', () => {
    const input = emptySelection();
    const { selection, error } = addCustomSource(input, { url: 'javascript:alert(1)', label: '' });
    expect(error).toBeTruthy();
    expect(selection).toBe(input);
  });

  it('rejects a duplicate URL', () => {
    const withOne = addCustomSource(emptySelection(), { url: 'https://example.com', label: '' }).selection;
    const { error } = addCustomSource(withOne, { url: 'https://example.com', label: '' });
    expect(error).toBeTruthy();
  });
});

describe('removeCustomSource', () => {
  it('removes the matching URL only', () => {
    const selection = {
      packs: [],
      customSources: [
        { url: 'https://a.com', label: 'A', addedAt: '2026-01-01T00:00:00.000Z' },
        { url: 'https://b.com', label: 'B', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
    };
    const result = removeCustomSource(selection, 'https://a.com');
    expect(result.customSources.map(s => s.url)).toEqual(['https://b.com']);
  });
});

describe('deriveLabelFromUrl', () => {
  it('strips protocol and www', () => {
    expect(deriveLabelFromUrl('https://www.example.com/feed')).toBe('example.com');
  });

  it('falls back to the raw string on unparsable input', () => {
    expect(deriveLabelFromUrl('not a url')).toBe('not a url');
  });
});

describe('buildCategoriesParam', () => {
  it('returns an empty string when no packs selected', () => {
    expect(buildCategoriesParam(emptySelection())).toBe('');
  });

  it('expands a single pack into its sector list', () => {
    expect(buildCategoriesParam({ packs: ['finance'], customSources: [] })).toBe('Finance,Crypto');
  });

  it('a single-sector pack expands to just that sector', () => {
    expect(buildCategoriesParam({ packs: ['cybersecurite'], customSources: [] })).toBe('Cybersécurité');
  });

  it('unions sectors across multiple selected packs, deduped', () => {
    const result = buildCategoriesParam({ packs: ['finance', 'tech-ia'], customSources: [] });
    expect(result.split(',').sort()).toEqual(['Crypto', 'Finance', 'IA', 'Tech'].sort());
  });

  it('treats "généraliste" as an override: forces no filter even with other packs selected', () => {
    expect(buildCategoriesParam({ packs: ['finance', 'generaliste'], customSources: [] })).toBe('');
  });

  it('ignores unknown pack ids', () => {
    expect(buildCategoriesParam({ packs: ['does-not-exist'], customSources: [] })).toBe('');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx craco test src/lib/__tests__/onboardingStorage.test.js --watchAll=false`
Expected: FAIL with "Cannot find module '../onboardingStorage'"

- [ ] **Step 4: Implement `onboardingStorage.js`**

```javascript
// frontend/src/lib/onboardingStorage.js
import { sanitizeText } from '../utils/sanitizer';
import { packs } from './packs';

export const STORAGE_KEY = 'tech_watch_onboarding_v1';

const URL_RE = /^https?:\/\/.+/i;
const MAX_URL_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;

export function emptySelection() {
  return { packs: [], customSources: [] };
}

export function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySelection();
    const parsed = JSON.parse(raw);
    return {
      packs: Array.isArray(parsed.packs) ? parsed.packs : [],
      customSources: Array.isArray(parsed.customSources) ? parsed.customSources : [],
    };
  } catch (e) {
    return emptySelection();
  }
}

export function saveSelection(selection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      packs: selection.packs,
      customSources: selection.customSources,
      updatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Erreur sauvegarde sélection onboarding:', e);
  }
}

export function togglePack(selection, packId) {
  const has = selection.packs.includes(packId);
  return {
    ...selection,
    packs: has ? selection.packs.filter(id => id !== packId) : [...selection.packs, packId],
  };
}

export function validateCustomSourceUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL requise', value: null };
  }
  const trimmed = url.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return { isValid: false, error: 'URL trop longue', value: null };
  }
  if (!URL_RE.test(trimmed)) {
    return { isValid: false, error: "URL invalide (doit commencer par http:// ou https://)", value: null };
  }
  return { isValid: true, error: null, value: trimmed };
}

export function deriveLabelFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function addCustomSource(selection, { url, label }) {
  const validation = validateCustomSourceUrl(url);
  if (!validation.isValid) {
    return { selection, error: validation.error };
  }
  if (selection.customSources.some(s => s.url === validation.value)) {
    return { selection, error: 'Cette source est déjà ajoutée' };
  }
  const cleanLabel = sanitizeText(label || '').trim().slice(0, MAX_LABEL_LENGTH) || deriveLabelFromUrl(validation.value);
  const entry = { url: validation.value, label: cleanLabel, addedAt: new Date().toISOString() };
  return { selection: { ...selection, customSources: [...selection.customSources, entry] }, error: null };
}

export function removeCustomSource(selection, url) {
  return { ...selection, customSources: selection.customSources.filter(s => s.url !== url) };
}

export function buildCategoriesParam(selection) {
  if (selection.packs.length === 0) return '';
  const selectedPacks = packs.filter(p => selection.packs.includes(p.id));
  const hasUnfilteredPack = selectedPacks.some(p => p.sectors.length === 0);
  if (hasUnfilteredPack) return '';
  const sectors = new Set();
  selectedPacks.forEach(p => p.sectors.forEach(s => sectors.add(s)));
  return Array.from(sectors).join(',');
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx craco test src/lib/__tests__/onboardingStorage.test.js --watchAll=false`
Expected: PASS, all suites green

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/packs.js frontend/src/lib/onboardingStorage.js frontend/src/lib/__tests__/onboardingStorage.test.js
git commit -m "feat: add sector packs config and pure onboarding-selection storage module"
```

---

### Task 2: Onboarding selection hook

**Files:**
- Create: `frontend/src/hooks/useOnboardingSelection.js`

**Interfaces:**
- Consumes: everything from Task 1's `onboardingStorage.js` (`loadSelection`, `saveSelection`, `togglePack`, `addCustomSource`, `removeCustomSource`, `buildCategoriesParam`).
- Produces (used by Task 3's `OnboardingPage.jsx`): `useOnboardingSelection()` → `{ selection, togglePack(packId), addCustomSource({url, label}) → {error}, removeCustomSource(url), categoriesParam }`. `selection.packs` holds pack **ids** (`finance`, `tech-ia`, `cybersecurite`, `generaliste`), not sector names.

- [ ] **Step 1: Write `useOnboardingSelection.js`**

```javascript
// frontend/src/hooks/useOnboardingSelection.js
import { useState, useEffect } from 'react';
import {
  loadSelection,
  saveSelection,
  togglePack as togglePackPure,
  addCustomSource as addCustomSourcePure,
  removeCustomSource as removeCustomSourcePure,
  buildCategoriesParam,
} from '../lib/onboardingStorage';

export function useOnboardingSelection() {
  const [selection, setSelection] = useState(() => loadSelection());

  useEffect(() => {
    saveSelection(selection);
  }, [selection]);

  const togglePack = (sector) => setSelection(s => togglePackPure(s, sector));

  const addCustomSource = (input) => {
    const { selection: next, error } = addCustomSourcePure(selection, input);
    if (error) return { error };
    setSelection(next);
    return { error: null };
  };

  const removeCustomSource = (url) => setSelection(s => removeCustomSourcePure(s, url));

  return {
    selection,
    togglePack,
    addCustomSource,
    removeCustomSource,
    categoriesParam: buildCategoriesParam(selection),
  };
}
```

- [ ] **Step 2: Sanity-check with a scratch render (no automated test — this hook has no branching logic beyond what Task 1 already covers; matches the untested-hook convention already used by `useFavorites`)**

Run: `cd frontend && npx craco test src/lib/__tests__/onboardingStorage.test.js --watchAll=false` (still green — confirms nothing in Task 2 broke the underlying module import graph)
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useOnboardingSelection.js
git commit -m "feat: add onboarding selection hook"
```

---

### Task 3: OnboardingPage UI

**Files:**
- Create: `frontend/src/pages/OnboardingPage.jsx`

**Interfaces:**
- Consumes: `useOnboardingSelection()` (Task 2), `packs` (Task 1's `lib/packs.js` — each pack is self-describing: `{ id, label, description, sectors, icon, bg, text }`, no `sectorConfig` lookup needed here), `useSEO` (`frontend/src/hooks/useSEO.js`), `useNavigate`/`Link` (`react-router-dom`), `toast` (`sonner`), UI primitives `Card`/`CardContent`, `Checkbox`, `Input`, `Label`, `Button`, `Badge` (`frontend/src/components/ui/*`).
- Produces: default-exported `OnboardingPage` component, mounted at `/` in Task 4.

- [ ] **Step 1: Write `OnboardingPage.jsx`**

```jsx
// frontend/src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { useOnboardingSelection } from "../hooks/useOnboardingSelection";
import { packs } from "../lib/packs";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const OnboardingPage = () => {
  const seo = useSEO({
    title: "Personnalisez votre veille",
    description: "Choisissez vos secteurs d'intérêt et ajoutez vos sources pour un dashboard Tech Watch personnalisé.",
  });
  const navigate = useNavigate();
  const { selection, togglePack, addCustomSource, removeCustomSource, categoriesParam } = useOnboardingSelection();
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  const handleAddSource = (e) => {
    e.preventDefault();
    const { error } = addCustomSource({ url: urlInput, label: labelInput });
    if (error) {
      toast.error(error);
      return;
    }
    setUrlInput("");
    setLabelInput("");
    toast.success("Source ajoutée");
  };

  const handleValidate = () => {
    navigate(categoriesParam ? `/app?categories=${encodeURIComponent(categoriesParam)}` : "/app");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {seo}
      <div className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Personnalisez votre veille</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choisissez les secteurs qui vous intéressent et ajoutez vos propres sources.
          Vous pourrez tout changer plus tard depuis le dashboard.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Vos packs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map(({ id, label, description, icon: Icon, bg, text }) => {
            const checked = selection.packs.includes(id);
            return (
              <Card
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => togglePack(id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePack(id); } }}
                className={`cursor-pointer transition-colors ${checked ? "border-primary" : "border-border"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${text}`} />
                    </div>
                    <Checkbox checked={checked} onCheckedChange={() => togglePack(id)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Vos sources perso (optionnel)</h2>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleAddSource} className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <Label htmlFor="source-url" className="sr-only">URL de la source</Label>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://exemple.com/flux"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <div className="sm:w-56">
                <Label htmlFor="source-label" className="sr-only">Nom (optionnel)</Label>
                <Input
                  id="source-label"
                  type="text"
                  placeholder="Nom (optionnel)"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  maxLength={80}
                />
              </div>
              <Button type="submit" disabled={!urlInput.trim()}>
                <Plus className="w-4 h-4" /> Ajouter
              </Button>
            </form>

            {selection.customSources.length > 0 ? (
              <ul className="space-y-2">
                {selection.customSources.map((source) => (
                  <li key={source.url} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50">
                    <Badge variant="secondary" className="truncate max-w-[70%]">{source.label}</Badge>
                    <button
                      type="button"
                      onClick={() => removeCustomSource(source.url)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Retirer ${source.label}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune source ajoutée pour l'instant.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Ces sources sont enregistrées sur cet appareil uniquement — elles n'alimentent pas encore le dashboard automatiquement.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handleValidate} className="px-10">
          <Check className="w-4 h-4" /> Voir mon dashboard
        </Button>
        <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
          Accéder directement au dashboard
        </Link>
      </div>
    </div>
  );
};

export default OnboardingPage;
```

- [ ] **Step 2: Manual smoke test**

Run: `cd frontend && npm start`, open `http://localhost:3000/`
Expected: page renders 4 pack cards (Finance, Tech & IA, Cybersécurité, Généraliste) with their own icon/color; clicking a card toggles its checkbox; adding `javascript:alert(1)` as a source shows an error toast and is not added; adding `https://example.com` shows a success toast and appears in the list with a working remove (✕) button; "Voir mon dashboard" with only "Finance" selected navigates to `/app?categories=Finance,Crypto`; with "Finance" + "Cybersécurité" selected navigates to `/app?categories=Finance,Crypto,Cybersécurité`; with "Finance" + "Généraliste" both selected navigates to `/app` with **no** `categories` param (Généraliste overrides); "Accéder directement au dashboard" navigates to `/app` with no query params regardless of what's checked above.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/OnboardingPage.jsx
git commit -m "feat: add onboarding page for pack selection and custom sources"
```

---

### Task 4: Route wiring — `/` becomes onboarding, dashboard moves to `/app`

**Files:**
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/pages/ArticleRedirect.jsx`

**Interfaces:**
- Consumes: `OnboardingPage` (Task 3), existing `HomePage`.
- Produces: n/a (terminal wiring task).

- [ ] **Step 1: Update `App.js` routes**

In `frontend/src/App.js`, add the import near the other page imports:

```javascript
import OnboardingPage from './pages/OnboardingPage';
```

Replace the `/` route and add `/app`:

```javascript
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/app" element={<HomePage />} />
```

(This replaces the current single `<Route path="/" element={<HomePage />} />` at [App.js:37](frontend/src/App.js#L37).)

- [ ] **Step 2: Update `ArticleRedirect.jsx` targets**

In `frontend/src/pages/ArticleRedirect.jsx`, change both `navigate` calls:

```javascript
    fetchArticleBySlug(slug).then((article) => {
      if (article?.id) {
        navigate(`/app?article=${article.id}`, { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    });
```

- [ ] **Step 3: Manual verification**

Run: `cd frontend && npm start`
Expected: `http://localhost:3000/` shows the onboarding page; `http://localhost:3000/app` shows the existing dashboard unchanged; `http://localhost:3000/article/<a-real-slug>` redirects to `/app?article=<id>` and opens that article's modal (not the onboarding page).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.js frontend/src/pages/ArticleRedirect.jsx
git commit -m "feat: move dashboard to /app, mount onboarding page at /"
```

---

### Task 5: Fix remaining `/`-based article links

**Files:**
- Modify: `frontend/src/pages/HomePage.jsx`
- Modify: `frontend/src/components/ArticleModal.jsx`
- Modify: `frontend/src/components/ShareButton.jsx`

**Interfaces:**
- Consumes: none new.
- Produces: n/a.

- [ ] **Step 1: Fix `HomePage.jsx`'s `seoUrl`**

At [HomePage.jsx:65](frontend/src/pages/HomePage.jsx#L65), change:

```javascript
    : `${window.location.origin}/?article=${selectedArticle.id}`;
```

to:

```javascript
    : `${window.location.origin}/app?article=${selectedArticle.id}`;
```

- [ ] **Step 2: Fix `ArticleModal.jsx`'s share link**

At [ArticleModal.jsx:118](frontend/src/components/ArticleModal.jsx#L118), change:

```javascript
              const link = `${window.location.origin}/?article=${article.id}`;
```

to:

```javascript
              const link = `${window.location.origin}/app?article=${article.id}`;
```

- [ ] **Step 3: Fix `ShareButton.jsx`'s share link**

At [ShareButton.jsx:39](frontend/src/components/ShareButton.jsx#L39), change:

```javascript
      return `${window.location.origin}/?article=${article.id}`;
```

to:

```javascript
      return `${window.location.origin}/app?article=${article.id}`;
```

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm start`, open `http://localhost:3000/app`, open any article, click "Share" (or copy-link icon)
Expected: the copied/shared URL starts with `http://localhost:3000/app?article=`, and pasting it into a new tab reopens the same article on the dashboard (not the onboarding page).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/HomePage.jsx frontend/src/components/ArticleModal.jsx frontend/src/components/ShareButton.jsx
git commit -m "fix: point article share/OG links at /app instead of /"
```

---

### Task 6: Full-flow verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: all suites pass, including `filters.test.js` and the new `onboardingStorage.test.js`.

- [ ] **Step 2: Run the production build**

Run: `cd frontend && npm run build`
Expected: build succeeds with no new errors/warnings referencing `OnboardingPage`, `onboardingStorage`, or `packs`.

- [ ] **Step 3: Manual end-to-end walkthrough**

Run: `cd frontend && npm start`
Expected, in order:
1. `/` shows the onboarding page, no packs pre-selected on first visit (clear `localStorage` first if testing repeatedly).
2. Select "Finance" and "Cybersécurité", add a custom source `https://example.com/feed`, click "Voir mon dashboard".
3. Land on `/app?categories=Finance,Crypto,Cybersécurité` with the sector filter chips already showing Finance + Crypto + Cybersécurité active in `FiltersBar`.
4. Reload `/` directly — the Finance/Cybersécurité packs and the custom source are still pre-checked/listed (persisted via `localStorage`).
5. From `/`, also check "Généraliste" (alongside Finance/Cybersécurité) and click "Voir mon dashboard" — lands on `/app` with **no** sector filter applied (full feed), confirming Généraliste overrides the other packs. Then, separately, click "Accéder directement au dashboard" from `/` — same unfiltered result, without touching the saved selection.
6. From `/app`, open an article, copy its share link, open that link in a new private/incognito tab — the article modal opens directly on `/app`, not on the onboarding page.

- [ ] **Step 4: Report status to Nolan**

No commit for this task — it's verification only. Summarize pass/fail for each of the 6 walkthrough points before considering the feature done.
