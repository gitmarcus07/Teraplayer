# Instagram Reels Downloader — Save Reels & Videos

## Mission
Create implementation-ready, token-driven UI guidance for Instagram Reels Downloader — Save Reels & Videos that is optimized for consistency, accessibility, and fast delivery across documentation site.

## Brand
- Product/brand: Instagram Reels Downloader — Save Reels & Videos
- URL: https://fastvideosave.net/
- Audience: developers and technical teams
- Product surface: documentation site

## Style Foundations
- Visual style: structured, tokenized, content-first
- Main font style: `font.family.primary=Be Vietnam Pro`, `font.family.stack=Be Vietnam Pro, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=18px`, `font.size.xl=20px`, `font.size.2xl=24px`, `font.size.3xl=30px`, `font.size.4xl=48px`
- Color palette: `color.text.primary=#0f172a`, `color.text.secondary=#475569`, `color.text.tertiary=#64748b`, `color.text.inverse=#334155`, `color.surface.base=#000000`, `color.surface.muted=#ffffff`, `color.surface.raised=#f8fafc`, `color.border.default=#e5e7eb`, `color.border.muted=#e2e8f0`
- Spacing scale: `space.1=8px`, `space.2=12px`, `space.3=16px`, `space.4=24px`, `space.5=32px`, `space.6=36px`, `space.7=48px`, `space.8=54.67px`
- Radius/shadow/motion tokens: `radius.xs=9999px` | `shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(99, 102, 241, 0.3) 0px 10px 15px -3px, rgba(99, 102, 241, 0.3) 0px 4px 6px -4px` | `motion.duration.instant=150ms`, `motion.duration.fast=200ms`, `motion.duration.normal=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (16), lists (5), buttons (1), inputs (1), navigation (1).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
