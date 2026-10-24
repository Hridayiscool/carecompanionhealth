<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- LLM calls go to Groq (OpenAI-compatible chat completions) only from server functions in `src/lib/*.functions.ts`, using the `GROQ_API_KEY` secret; why: keeps the key off the browser.
- The medical safety system prompt (no doses, no prescribing, refuse personal decisions) lives in one place in `condition.functions.ts`; why: single source of truth for safety rules.
- Emergency phrase detection runs client-side before any LLM call (`src/lib/emergency.ts`); why: instant, never depends on the network.
- UI strings live in `src/lib/i18n.ts` (en/ar) and direction is set on <html>; why: full RTL support.
