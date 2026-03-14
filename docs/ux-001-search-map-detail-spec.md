# UX-001 — Search, map, and place detail UX spec

## Status
- Date: 2026-03-14
- Owner: Maya
- Scope: MVP public read flows only

## 1. Concise UX review of the current web shell

### What is already working well
- The shell is already aligned to the product question: dog policy status is prominent.
- Unknown and provider cache-miss are treated as explicit states instead of being hidden.
- The detail shell already separates **policy content** from **verification/trust metadata**, which is the right mental model.
- The tone is restrained and credible. That fits the product.

### Main UX gaps to close before implementation
1. **Search flow is still hero-first, not task-first.**
   - The landing layout reads like a marketing page.
   - MVP users need immediate search, fast scan, and obvious result selection.

2. **Map/list relationship is undefined.**
   - The placeholder does not yet establish whether the map filters the list, mirrors the list, or only supports orientation.
   - This is the biggest interaction gap in the current shell.

3. **Result cards over-emphasize “confidence” and under-emphasize “rule summary.”**
   - Users need the practical answer first: where the dog can go, leash expectation, and whether the answer is trustworthy.

4. **Place detail hierarchy is close, but the top section still hides the core decision.**
   - The primary takeaway should be a short policy verdict plus 2–3 key rule bullets.
   - Verification should support the decision, not compete with it.

5. **Unknown state needs a stronger action path.**
   - “Unknown” is honest, but currently passive.
   - Users need to know what they can still do: check venue website, treat as unconfirmed, or submit a report later.

6. **Loading and error states exist, but lack behavioral rules.**
   - Skeletons exist for detail, but not yet for search results/map loading.
   - Cache miss needs a recovery path tied to the search experience.

## 2. MVP UX principles

1. **Answer first.** Put the policy verdict before all descriptive content.
2. **Trust is visible.** Every non-unknown answer must show source type and last checked near the verdict.
3. **Unknown is a valid answer.** Never imply permission when evidence is weak.
4. **Map supports discovery; list supports decision.** The list carries the detailed scan information.
5. **One obvious next action per state.** Search, open detail, retry, or go back.
6. **Keep MVP local and simple.** No saved places, no advanced filters, no visual flourish.

## 3. Core information architecture

## 3.1 Search page hierarchy
1. Header
2. Search input block
3. Results summary row
4. Two-pane results area
   - left: result list
   - right: map
5. Inline system state when applicable

### Search page header content
- Product name
- Short utility line only if needed: `Dog policy before you go`
- Optional metro label

Do **not** use a large marketing hero for the default results experience.

## 3.2 Search result card hierarchy
Each result card should show, in order:
1. Place name
2. Status badge
3. One-line practical summary
4. Address/category/meta row
5. Trust row

### Required card content
- `name`
- `dogPolicyStatus`
- short rule summary generated from known fields
  - examples:
    - `Courtyard only · leash required`
    - `Off-leash area available`
    - `Dogs not allowed inside venue`
    - `No trustworthy policy published yet`
- `formattedAddress`
- `category`
- verification cue
  - for known policies: `Official website · checked 2 days ago`
  - for unknown: `No reliable evidence yet`

### Optional secondary content
- distance if location bias is active
- confidence label only as secondary support, not as primary badge

## 3.3 Place detail hierarchy
1. Back to results
2. Place title block
3. Primary decision card
4. Verification card
5. Rule breakdown
6. Notes / caveats
7. Secondary actions

### Primary decision card must contain
- status badge
- verdict sentence
- top 2–4 operational rules
- short trust summary

Example:
- `Rules apply`
- `Dogs are allowed in the courtyard only.`
- bullets:
  - `Indoor seating: no`
  - `Outdoor area: yes`
  - `Leash required: yes`
- support text:
  - `Verified via official website · checked 2 days ago`

### Verification card must contain
- source type label
- last checked date
- source link when present
- plain-language trust explanation for low-trust cases

### Rule breakdown section must contain
- Indoor allowed
- Outdoor allowed
- Leash required
- Service dog only
- Size restriction
- Breed restriction
- Notes

## 4. Search and results flow

## 4.1 Entry flow
Default page behavior:
- Search input is the first focusable primary control in main content.
- Placeholder example: `Search cafes, parks, or an address`
- Search button label: `Search`
- Submit on Enter.

### Empty/default state
Before a search:
- Show input at top.
- Below it, show either:
  - 3 recent/example places, or
  - a quiet empty state explaining what can be searched.

Recommended MVP approach:
- Keep 3 example/result cards under the search bar for now, but style them as sample results rather than featured marketing content.

## 4.2 Search submit behavior
On submit:
- Keep the query visible in the field.
- Show loading skeletons in list and map areas.
- Freeze prior results only if response is very fast; otherwise replace with explicit loading state.
- Announce result count in a live region once loaded.

## 4.3 Search results layout
Desktop/tablet:
- Two-pane split
  - list: 45–55%
  - map: 45–55%
- List scrolls independently.
- Map remains sticky within viewport.

Mobile:
- Default to list first.
- Show a segmented toggle above results:
  - `List`
  - `Map`
- Preserve selection when switching.

## 4.4 Map/list relationship rules
This needs to be deterministic.

### Recommended MVP model
- Hovering a list item highlights the matching map pin.
- Clicking a list item selects the map pin and opens the place detail route.
- Clicking a map pin highlights the matching list item and reveals its summary card.
- The map does **not** apply hidden filtering rules in MVP.
- If viewport-driven search is added later, it must use an explicit control such as `Search this area`.

### Why
Users should not have to guess whether the map changed the results set.

## 4.5 Selected result behavior
When a result is selected:
- result card gets a visible selected border/background state
- map pin gets selected styling
- if selection started from map, scroll list item into view
- Enter/Space on selected card opens detail page

## 5. Detailed state specs

## 5.1 Known policy state
Applies when `dogPolicyStatus` is `allowed`, `restricted`, or `not_allowed`.

### Result card copy rules
- `allowed`: emphasize where dogs are welcome
- `restricted`: emphasize the restriction first
- `not_allowed`: state the restriction directly

Examples:
- `Dogs allowed in signed off-leash area`
- `Dogs allowed outdoors only · leash required`
- `Dogs not allowed, except service dogs if applicable`

### Detail page rules
- Show verdict immediately.
- Show trust summary directly beneath verdict.
- Show rule list in plain language, not raw enum labels.

## 5.2 Unknown state
Applies when public status must remain `unknown`.

### Result card
- Badge: `Policy unknown`
- Summary line: `No trustworthy public policy published yet`
- Trust row: `No reliable evidence yet`

### Detail page
Primary panel text:
- headline: `No trustworthy public answer yet`
- body: `PawMap has not verified this place with a reliable source. Treat dog access as unconfirmed before visiting.`

Secondary guidance:
- if `websiteUrl` exists, show `Check venue website`
- show subdued note: `User reports may exist but are not published until reviewed`

### Unknown state behavior notes
- Do not render rule rows as if they are false.
- Use `Unknown` only where individual fields are shown.
- Avoid amber/red warning styling that implies failure; this is a valid informational state.

## 5.3 Loading state

### Search loading
List pane:
- 6 skeleton cards
- each card should reserve space for:
  - name
  - badge
  - summary line
  - meta row

Map pane:
- neutral map skeleton box
- small label: `Loading places…`

Behavior:
- disable duplicate submit while request is in flight
- keep focus in the search field or move to results heading only if requested via keyboard shortcut pattern later
- announce `Loading results` in screen-reader-only live region

### Detail loading
Current skeleton direction is fine, but the real loading spec should reserve:
- place title block
- verdict card
- verification card
- rule section

Avoid layout shift between loading and loaded states.

## 5.4 Provider/cache-miss error state
Applies to `GET /places/resolve/google/{googlePlaceId}` returning `404 PLACE_CACHE_MISS`.

### User meaning
This is **not** the same as unknown policy.
The place reference exists upstream, but PawMap has no canonical cached record yet.

### Screen content
- title: `This place is not in PawMap yet`
- body: `We found the provider reference, but PawMap has not cached this place yet, so we cannot show a trusted policy page.`
- actions:
  1. `Back to results`
  2. optional secondary link: `Search again`

### Supporting note
- `This is different from “Policy unknown.” Unknown means the place exists in PawMap but its dog policy is not verified.`

### Styling
- Use warning styling, but keep tone calm.
- No blame language.
- No raw error code in primary UI.
- Raw code can appear in developer-only notes or logs, not user-facing copy.

## 5.5 Not found state
Applies when slug/route does not exist.

Copy:
- title: `Place page not found`
- body: `That PawMap page does not exist or is no longer available.`
- action: `Back to search`

Differentiate this from cache miss.

## 6. Trust and verification cues

Trust is a core product feature, not supporting metadata.

## 6.1 Trust display requirements
For every non-unknown public policy, show near the verdict:
- source type
- last checked date

Recommended format:
- `Verified via Official website · checked 2 days ago`
- `Verified via On-site signage · checked today`

## 6.2 Trust label guidance
Use human labels:
- `Official website`
- `Direct contact`
- `On-site signage`
- `User report`
- `Third-party listing`
- `Other source`

Do not expose raw enum strings.

## 6.3 Confidence score guidance
Confidence score should not be a loud primary UX element in MVP.

Recommendation:
- Keep score internal or translate to a small supporting label only.
- If shown, use labels:
  - `High confidence`
  - `Verified`
  - `Needs verification`

Do not show `82/100` in the main UI for MVP.

## 6.4 When trust is weak
If source type is low trust or old:
- keep public status only if product rules permit
- surface a quiet caution line such as:
  - `Based on user-submitted evidence`
  - `Checked 6 months ago`

In MVP, stale low-trust answers should likely be uncommon. If they exist, make that visible.

## 7. Content and copy rules

## 7.1 Status badge labels
- `allowed` → `Dogs allowed`
- `restricted` → `Rules apply`
- `not_allowed` → `Dogs not allowed`
- `unknown` → `Policy unknown`

Current labels are acceptable.

## 7.2 Rule row copy
Prefer short natural language values:
- `Yes`
- `No`
- `Unknown`
- `Not published`

For restrictions, prefer descriptive phrases over null-heavy rows where possible.

## 7.3 Primary verdict sentence templates
- Allowed: `Dogs are allowed here.`
- Restricted: `Dogs are allowed with restrictions.`
- Not allowed: `Dogs are not allowed here.`
- Unknown: `PawMap does not have a trustworthy public answer yet.`

Then refine with known specifics.

## 8. Accessibility notes

## 8.1 Search and results
- Search input must have a persistent visible label, not placeholder-only labeling.
- Search button must remain keyboard reachable and have a clear disabled/loading state.
- Result count updates should use `aria-live="polite"`.
- Result cards should be full clickable targets with visible focus rings.

## 8.2 Map interaction
- Map cannot be the only path to a result.
- Every pin-selectable place must also be available in the keyboard-accessible list.
- If a pin is selected from the map, sync that state to the list for screen-reader and keyboard users.

## 8.3 Color and status
- Do not rely on badge color alone.
- Every status needs text.
- Unknown state contrast should remain readable, not washed out.

## 8.4 Detail page
- The place name should be the only H1.
- Use semantic lists/description lists for rule breakdown.
- External source links should announce that they open the venue/source page.

## 8.5 Loading and errors
- Loading announcements should be exposed to assistive tech.
- Error and empty states should have heading structure and clear recovery actions.

## 9. Wireframe-level layout spec

## 9.1 Search page wireframe
```text
-------------------------------------------------------------
Header: PawMap | Dog policy before you go | Melbourne MVP
-------------------------------------------------------------
[ Search places, parks, or an address                  ][Search]
Optional helper: Search by venue name or suburb

Results summary row:
12 results for "cafe"                         [status/filter later]

-------------------------------------------------------------
| LIST PANE                            | MAP PANE             |
| ------------------------------------ | -------------------- |
| [Selected result card]               | [interactive map]    |
|  Royal Bark Cafe   [Rules apply]     |  pins mirror list    |
|  Courtyard only · leash required     |                      |
|  Fitzroy VIC · Cafe                  |                      |
|  Official website · checked 2d ago   |                      |
|                                      |                      |
| [Result card]                        |                      |
|  Pawsome Park      [Dogs allowed]    |                      |
|  Off-leash area available            |                      |
|  Richmond VIC · Park                 |                      |
|  On-site signage · checked today     |                      |
|                                      |                      |
| [Result card]                        |                      |
|  Market Hall Grocer [Policy unknown] |                      |
|  No trustworthy policy published yet |
|  Collingwood VIC · Retail            |
|  No reliable evidence yet            |
-------------------------------------------------------------
```

## 9.2 Detail page wireframe
```text
Back to results

Royal Bark Cafe                           [Rules apply]
12 Napier St, Fitzroy VIC
Cafe

-------------------------------------------------------------
| Primary decision card                 | Verification card   |
| Dogs are allowed with restrictions.   | Source              |
| - Indoor: no                          | Official website    |
| - Outdoor: yes                        | Last checked        |
| - Leash required                      | 2 days ago          |
| Verified via official website         | [View source]       |
-------------------------------------------------------------

-------------------------------------------------------------
| Rule breakdown                                           |
| Dog policy          Rules apply                          |
| Indoor allowed      No                                   |
| Outdoor allowed     Yes                                  |
| Leash required      Yes                                  |
| Service dog only    No                                   |
| Size restriction    Not published                        |
| Breed restriction   Not published                        |
-------------------------------------------------------------

-------------------------------------------------------------
| Notes                                                    |
| Dogs are welcome in the courtyard. Staff may pause      |
| access during busy brunch periods.                      |
-------------------------------------------------------------
```

## 9.3 Unknown detail wireframe
```text
Back to results

Market Hall Grocer                         [Policy unknown]
40 Smith St, Collingwood VIC
Retail

-------------------------------------------------------------
| No trustworthy public answer yet                        |
| PawMap has not verified this place with a reliable      |
| source. Treat dog access as unconfirmed before visiting.|
| [Check venue website] if available                      |
-------------------------------------------------------------

-------------------------------------------------------------
| Verification snapshot                                   |
| No reliable evidence yet                                |
| Last checked: Unknown                                   |
-------------------------------------------------------------
```

## 9.4 Cache-miss wireframe
```text
-------------------------------------------------------------
| This place is not in PawMap yet                         |
| We found the provider reference, but PawMap has not     |
| cached this place yet, so we cannot show a trusted page.|
|                                                         |
| [Back to results]   [Search again]                      |
|                                                         |
| Small note: This is different from “Policy unknown”.    |
-------------------------------------------------------------
```

## 10. Specific implementation follow-ups for Nova

## Priority 1 — structure and routing
1. Replace the homepage hero treatment with a task-first search/results layout.
2. Keep sample/mock data, but present it as search results.
3. Preserve explicit dedicated routes/states for:
   - ready detail
   - unknown detail
   - cache miss
   - not found

## Priority 2 — view model shaping
4. Add a UI formatter that derives a short result summary from `petRules` fields.
5. Add a trust summary formatter:
   - `Official website · checked 2 days ago`
   - `No reliable evidence yet`
6. Hide raw confidence numbers from primary cards/detail unless intentionally used as small helper text.

## Priority 3 — map/list interaction scaffolding
7. Implement local selected-state syncing between result cards and map placeholder/pins.
8. On mobile, add a `List / Map` toggle rather than forcing a small split-screen.
9. On desktop, make the map pane sticky and the list independently scrollable.

## Priority 4 — state completion
10. Add search loading skeletons for both list and map panes.
11. Tighten cache-miss copy so it is user-facing, not API-facing.
12. Strengthen unknown state with a guidance action if `websiteUrl` exists.
13. Differentiate `not found` from `cache miss` in wording and visuals.

## Priority 5 — accessibility
14. Add visible focus states to all full-card links and action buttons.
15. Add live-region support for loading and result counts.
16. Ensure map interactions always sync to an accessible list selection state.

## 11. Implementation notes / non-goals
- Do not build complex filters in this slice.
- Do not add favorites or auth-dependent reporting UI.
- Do not surface provider-native mental models in the UI.
- Do not make the map the primary decision surface; it is secondary to the list and detail page.

## 12. Recommendation
Recommended next UI increment for FE-001:
- first, reshape home into a real search/results shell
- second, add list/map selected-state behavior with mock data
- third, refine detail page hierarchy around verdict → trust → rules

That is enough to make the MVP UX implementation-ready without over-designing the product.
