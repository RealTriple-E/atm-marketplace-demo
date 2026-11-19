# ATM Product and Service Detail — Vercel Parity Audit and v15 Rebuild
**Reference studied:** https://atm-home-list.vercel.app/  
**Reference measured on:** 390 × 844 mobile and 1280 × 900 desktop  
**ATM review:** https://realtriple-e.github.io/atm-marketplace-demo/client-review-listing-v15.html  
**Status:** Implemented; browser acceptance test and external stock-photo checks must pass before sign-off.

## Reference findings
The reference's villa listing is a mobile-first product-detail presentation:
- Hero: approximately **390 × 351px**, five independently swipeable photos, horizontal snap, and back/share/save round floating buttons
- Content sheet: begins 24px before the image bottom; 28px top corners, 24px horizontal padding. The reference's current inspected theme used a *white* sheet even though the client's screenshot shows a dark one. **ATM follows the supplied screenshot's black design and uses orange accents**, preserving its brand.
- Title: Plus Jakarta Sans around 26px with muted subtitle and second-line facts
- Ratings/verification: three-column bordered strip, around 342 × 72px, rating/stars, ATM verified and review count
- Seller: 56px portrait, Hosted by seller name, short status and history; the reference row itself did not navigate, so ATM adds a working profile route as specifically requested
- Booking bar: price plus Offer and Reserve, fixed to viewport bottom; retains ATM's Offer/Reserve logic and black/orange accents
- Below initial fold: expandable story, two-column features, longer-stay pricing, unavailable-date calendar, city map, review carousel
- The reference tested five touch gallery slides, while ATM gives every one of the 288 **fictional** sample listings **three stock-gallery slides**, and supports swipe, dot/arrow navigation, counter updates
- Reference colours and exact font assets are not copied; the black/orange ATM brand is retained

## Implementation
### Listing detail
- The global topbar is replaced on listing routes with overlay back/share/favorite buttons over a full-width photo hero.
- A responsive dark rounded sheet overlaps the image and contains title, subcategory, city, sample rating/stars, **demo** verification and review count.
- Clicking the seller portrait/name opens `#/seller/<encoded seller name>`, not a chat interface.
- Story text expands/collapses; two-column features, rental date selection, property-specific illustrative discounts, read-only calendar, city-centre map and horizontally scrollable fictional reviews appear below.
- A fixed price + Offer + Reserve control uses the existing date picker, negotiation, simulated checkout and confirmation flow.
- The item gallery is **item/subcategory-specific**; no images are borrowed from arbitrary other listing IDs. The photo data comes from curated stock-photo URLs, and some sources are illustrative rather than photographs of the actual fictional item. Uploaded owner photos stay attached to their user-created listing.

### Demo sellers
- All 46 existing demo seller names map deterministically to 46 distinct example portrait URLs. Never show a blank initial-only avatar in the normal provider rendering path; a stock portrait URL is the fallback.
- Seller profile displays profile image, name, fictional member-since date and years, rating and review count, all available listings for that owner, and read-only example customer comments.
- Seller access is also linked from listing cards and the feed.
- Provider listing IDs, categories, search, Offers and My Trips remain compatible with the original marketplace demo.

### Communication and privacy
- **There is no Chat or Booking chat button on the listing detail**, even after payment.
- The only provider chat link appears on an eligible **My Trips** booking with a `Confirmed (demo)` status and `verified_demo` marker. Cancelling the booking revokes access if no other active paid booking is eligible.
- Provider profile has no private-contact controls. Before payment customers use structured Offers and Reserve; ATM support remains accessible.
- All payment, profile tenure, ratings, reviews, listings and messaging are fictional and local-browser only. Live enforcement requires server-side authentication, payment verification and secure message ACLs.

## Asset review / limitations
- Original synthetic lawnmower SVG is no longer used as a listing image; sample listing images now use stock photography.
- Generic landscape photos were replaced with actual minibus, safari 4×4, Hilux, tractor, excavator, lawnmower, concrete-mixer and other relevant examples found among free stock-photo sources.
- Listings carry three distinct stock image URLs each, across more than 100 distinct image URLs; portraits use separate sample CDN images.
- **Images are representative.** A picture associated with one fictional listing is not proof of its exact make, condition, colour, model, owner, capacity or availability.
- Thumbnail/hero external URLs can change or stop responding. Before production, images should be moderated, downloaded with appropriate rights, stored on an owned CDN and linked to verified seller inventory.

## Acceptance tests
1. Mobile 320/390: hero fill, overlay controls, title untruncated, trust bar, portrait, booking bar visible without horizontal overflow.
2. Swipe gallery left/right, navigate arrows/dots, counter updates, no reload.
3. All 288 demo samples have 3 gallery URLs; 46 named sellers have 46 portrait URLs; all galleries are semantically mapped at least to item title or subcategory.
4. Click listing host or seller on card to reach seller profile and open its listings, rating, member-since date and reviews.
5. No chat on detail/profile, unpaid deep links blocked; chat only accessible via eligible paid demo booking in My Trips and revoked on cancellation.
6. Offer, counteroffer, accepted confetti, Reserve, property discount, calendar and payment provider choice remain functional.
7. Check successful rendering of representative stock images and portraits, no console errors, readable responsive layout.

## Live v15 QA findings and v17 changes (19 November 2026)
A live browser audit at 320px, 390px and desktop confirmed: full-bleed hero geometry (390×351px); rounded black 24px-overlap sheet; no title truncation or horizontal overflow; three-gallery swipe, dot and arrow gestures; seller profile navigation, member date and fictional reviews; absence of seller chat on listing and prepayment surfaces; My Trips-only chat after verified demo payment; cancellation revokes access; and no captured JS errors.

**Image mismatch discovered and corrected:** The 'Garden Party Games — Solwezi' item was incorrectly showing scuba imagery. Recreation & Games, Children's Events and Boats & Watercraft photo sets have been revised to remove the scuba image completely. Garden-party images are now outdoor/event-related; Boats uses a real speedboat image; retailer kiosks get shop imagery. For frequently recognised titles such as Hilux, safari minibuses, farm tractors, lawnmowers, excavators, generators, etc., specific stock-photo overrides take precedence over broad subcategory defaults.

**Cache caveat:** The v15 audit found that stale same-version asset URLs could momentarily serve an older one-slide gallery. A fresh versioned v17 client-review page and asset URLs ensure the browser requests the current three-slide photo data. Source images load externally, so a cold load can show a placeholder briefly. Seller portraits on prominent views are loaded as sample photos with a fallback source.

**Final catalogue invariants:** 288 fictional listings, 60 mapped subcategories, at least 3 slide URLs per demo listing, 46 unique sample seller portrait URLs, zero scuba image URLs. Stock imagery is illustrative of listing types and should not be represented as photographs of the specific nonexistent rental unit.
