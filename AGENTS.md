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

- Live data flows through one server function (src/lib/pulse.functions.ts) that fetches Polymarket + 3 Nansen streams with 2.5s timeouts; each stream falls back to src/services/snapshot.ts independently. Why: never blank UI when an API fails.
