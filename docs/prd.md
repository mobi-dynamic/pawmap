# PawMap PRD

## 1. Problem

Dog owners often cannot tell whether a venue or destination is dog-friendly until they arrive, and rules are frequently inconsistent, unclear, or outdated.

## 2. Product vision

PawMap helps users search a place and quickly understand whether dogs are allowed, what rules apply, and how trustworthy that information is before they go.

## 3. Primary user

- Dog owners planning visits to places outside the home, especially cafes, restaurants, shops, parks, and similar destinations

## 4. Core user story

- As a dog owner, when I search for a place, I want to know whether I can bring my dog and under what rules, so I can plan with confidence before I go.

## 5. MVP goal

Deliver a web MVP that answers the question “Can I bring my dog there, and under what rules?” quickly and credibly for a single launch geography.

## 6. Launch geography assumption

- MVP launches in **one defined metro area** only.
- The goal is dense, trustworthy coverage in that area rather than broad low-confidence coverage across multiple cities or nationwide.
- **Assumption:** the exact launch metro is still to be confirmed.

## 7. MVP scope

### In scope
- Search places by keyword
- View place results in list and map context
- Open a place detail page
- Show dog policy status:
  - allowed
  - restricted
  - not allowed
  - unknown
- Show structured rule fields where known:
  - indoor allowed
  - outdoor allowed
  - leash required
  - size restrictions
  - breed restrictions
  - service dog only
  - notes
- Show verification metadata:
  - source type
  - source link when available
  - last checked date
- Allow users to submit updates or corrections
- Require admin moderation before publishing submitted changes

### Out of scope for MVP
- General pet support beyond dogs
- Social feed / community features
- Bookings or reservations
- Full trip planning
- Native mobile apps
- Favorites / saved places

## 8. Place and coverage strategy

- PawMap may search a broad set of places using an external places provider.
- Verification effort for MVP should prioritize the launch geography first.
- If operational capacity is limited, verification should prioritize the most common user-relevant categories first.
- If additional scope tightening is needed, prioritize hospitality and public leisure categories first:
  - cafes / restaurants with outdoor seating
  - parks

## 9. Verification model

PawMap must clearly communicate not just the dog policy, but how that policy was verified.

### Source hierarchy
Highest to lowest trust:

1. Official venue source
   - official website
   - official social profile
   - direct venue confirmation
2. On-site evidence
   - signage or other dated on-site proof
3. Admin-verified manual confirmation
4. User-submitted report with supporting evidence
5. No reliable evidence

### Public display rules
- Every public non-unknown policy must show:
  - source type
  - last checked date
- If evidence is insufficient or conflicting without a clear higher-trust source, the public status should remain **unknown**.
- User submissions do not publish automatically in MVP.
- If sources conflict, prefer the **highest-trust, most recent** valid source.

## 10. Moderation policy

- All user-submitted updates require admin review before publication.
- Target moderation SLA for MVP: **review within 72 hours**.
- Submissions with strong evidence may be prioritized.
- If evidence is weak, conflicting, or unverifiable, existing published data remains unchanged until a moderator resolves it.

## 11. Success metrics

### Primary
- A user can reach a place policy answer from search in **under 10 seconds** for common flows.
- PawMap reaches **100 verified places** in the launch geography.
- **90%** of user-submitted reports are reviewed within the moderation SLA.
- **100%** of public non-unknown rule records display source type and last checked date.

### Secondary
- Increase the share of viewed place detail pages with a known policy status versus unknown over time.

## 12. Open questions

- Which specific metro area is the launch geography?
- Which places provider offers the best cost/quality trade-off for MVP?
- What admin workflow is sufficient for moderation in v1?
- What seed categories should be verified first within the launch geography?
