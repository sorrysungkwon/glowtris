# Glowtris Ecosystem SEO Guidelines

These guidelines apply to both the main `glowtris` game repository and the `glowtris-blog` repository. Follow them strictly to maintain indexation health and rich result eligibility.

1. **English-Only Localization**: Do NOT include Korean (`ko_KR`) `og:locale:alternate` tags, Korean `hreflang` tags, or Korean JSON-LD nodes. The entire ecosystem strictly enforces an English-only canonical structure to prevent duplicate content crawling issues.
2. **Schema Types**: 
   - Use `SoftwareApplication` (with `applicationCategory: "GameApplication"`) instead of `VideoGame` to ensure Google Rich Result eligibility.
   - Include `aggregateRating` visually and in the schema.
   - In blog posts, reference the game as `SoftwareApplication` in the `about` field.
3. **Strict URL Matching**: The `<meta property="og:url">` tag MUST exactly match the `<link rel="canonical">` tag on every page, including identical trailing slash behavior. Do not hardcode `og:url` to the root domain on sub-pages.
4. **No Fake SearchActions**: Do NOT include `potentialAction` / `SearchAction` within the `WebSite` JSON-LD schema unless the site actually contains a functioning sitelinks searchbox.
5. **Trailing Slashes**: Be highly precise with trailing slashes. `https://glowtris.com` and `https://glowtris.com/` are considered different URLs by Google. Match `hreflang`, `canonical`, and `og:url` exactly.
