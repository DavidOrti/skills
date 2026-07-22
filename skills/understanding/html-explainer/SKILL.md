---
name: html-explainer
description: Create annotatable HTML explainers and decode pasted `review v1` feedback blocks. Use when (a) generating a standalone HTML explainer document, or (b) the user pastes feedback starting with a `review v1` header line.
---

# html-explainer

A lean feedback loop for AI-generated HTML explainers: the reader clicks blocks in the rendered page, attaches comments, and pastes one compact block back into the chat.

## Creating an explainer

1. Write the standalone HTML file normally.
2. Copy `assets/annotator.js` (from this skill's directory) into the same directory as the HTML file. Do not read, inline, modify, or regenerate it — it is a fixed asset.
3. Add `<script src="annotator.js"></script>` just before `</body>`.

That is the entire per-document cost.

## Decoding feedback

The user pastes a block like:

```
review v1 · auth-flow.html
b17 p "Quite often these explainers aren't..." → simplify, too wordy
b23 h2 "Architecture" → why JWT here instead of sessions?
```

Format:
- **Header**: `review v1 · <filename>`. Locate that file; if multiple files share the basename, confirm the path with the user before editing.
- **Comment lines**: `<ref> <tag> "<quote>" → <comment>`. Inside the quote, `"` and `\` are escaped with `\`.

Resolving a reference:
- The **quote is the primary locator**. It is the element's *rendered* text — Unicode-normalized, whitespace collapsed, truncated to ~120 chars. It may span inline markup (`<strong>`, entities, line breaks), so match it against the element's text content, not literal source bytes.
- **ref** disambiguates duplicate quotes: refs number every element matching `h1,h2,h3,h4,h5,h6,p,li,figcaption,td` in document order, starting at `b1`. **tag** is the element's tag name — use it as a sanity check.
- If a quote cannot be found, or resolution stays ambiguous after using ref and tag: report the candidates to the user. Never guess silently. (A mismatch usually means the file changed since it was reviewed.)

Acting on comments:
- **Questions** (interrogative comments) → answer in the chat, referencing the located element.
- **Edit requests** → apply to the HTML file.
- Comments asking both → do both.
- Finish with a one-line-per-ref summary of what was **answered**, **applied**, or **skipped** — nothing drops silently.
