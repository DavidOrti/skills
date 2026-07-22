# skills

A collection of Claude Code skills I've found useful and custom made, packaged as plugins.

## Plugins

- **style** — how replies are written: tone, length, delivery. Skills: `brevity`.
- **understanding** — making complex material and codebases easier to understand. Skills: `html-explainer`, `gaps`.

## Install

Plugins are never auto-loaded from a folder — they must be installed explicitly. Add this repo as a marketplace, then install what you want:

```
/plugin marketplace add DavidOrti/skills
/plugin install style@davidorti-skills
/plugin install understanding@davidorti-skills
```

Working from a local clone? Add it by path instead, so your edits apply without pushing:

```
/plugin marketplace add /path/to/skills
```

Installed skills invoke as `/style:brevity`, `/understanding:gaps`, etc., and trigger automatically when a request matches their description.

## Referencing a skill from CLAUDE.md

Skills load on demand. To make one always-on, import its file from CLAUDE.md:

```markdown
Apply the style:brevity skill: @skills/style/brevity/SKILL.md
```

The `@path` token inlines the file's content into context every session. A markdown link would not — only the literal `@path` triggers the import.
