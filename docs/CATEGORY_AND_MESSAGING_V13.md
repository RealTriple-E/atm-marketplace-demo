# ATM v13 — Category Taxonomy and Post-Payment Communication
**Implementation:** 18 November 2026  
**Repository:** https://github.com/RealTriple-E/atm-marketplace-demo  
**Preview:** https://realtriple-e.github.io/atm-marketplace-demo/client-review-categories-v13.html

## 1. Marketplace hierarchy
The primary classification is **one category → one subcategory per listing**. Each listing may also have filterable features, location and descriptive tags. It is discoverable by general search without duplication.

| Main category | Subcategories |
| --- | --- |
| Transport | Sedans & Hatchbacks; SUVs & 4×4s; Safari & Tour Vehicles; Motorbikes & Scooters; Buses & Minibuses; Pickups & Vans; Trucks & Haulage; Bicycles & E-bikes; Boats & Watercraft; Aircraft & Helicopters; Campers & Motorhomes; Specialised Vehicles |
| Hardware | Hand & Power Tools; Construction Machinery; Agricultural Equipment; Gardening & Landscaping; Power & Electrical; Cleaning Equipment; Industrial & Workshop; Lifting & Access; Cameras & Electronics; Specialist Equipment |
| Events | Tents & Marquees; Chairs & Tables; Sound & DJ Equipment; Lighting & Stage; Decor & Accessories; Catering Equipment; Photography Booths; Children’s Events; Screens & Displays; Event Packages |
| Spaces & Property | Houses & Apartments; Lodges & Accommodation; Event Venues; Offices & Workspaces; Warehouses & Storage; Retail & Commercial; Studios & Creative Spaces; Outdoor & Agricultural Land; Parking & Garages; Sports Facilities |
| Lifestyle | Fashion & Formal Wear; Sports & Fitness; Outdoor & Camping; Recreation & Games; Household & Furniture; Baby & Family; Travel Accessories; Costumes & Cultural Wear |
| Services | Photography & Videography; Drivers & Transport Services; Cleaning & Maintenance; Construction & Repairs; Event Professionals; Beauty & Personal Care; Agricultural Services; Tutors & Trainers; Moving & Delivery; Business & Technical |

**Inventory:** Exactly 288 fictional sample listings, with 48 in each category. The first 40 original listing IDs remain stable. Every subcategory has representative sample listings. Prices are shown in K; property is priced by night, other listing types currently use day-based examples until service-specific booking units are designed.

**Trending:** No global Trending section on Home. Each category has its own trending carousel ranked by illustrative `trendScore`, scoped to that category and selected subcategory, feature and city. Current metrics are sample data, not real visitor analytics.

**Filters:** Each category exposes five category-specific feature chips; these match sample `features` arrays. Search, city, sort and subcategory filters also work. Result lists render 24 items initially and a functional Load more button.

## 2. Payment-gated messaging policy

| State | Customer-provider direct chat |
| --- | --- |
| Viewing listing, FAQs, saved item | Locked |
| Submitting or changing offers | Locked |
| Seller simulation accepts / counters | Locked |
| Offer accepted but checkout unpaid | Locked |
| Completed **simulated** payment and confirmed demo booking | Unlocked for that listing |
| Demo booking cancelled with no other paid active booking of that listing | Locked |
| ATM demo support | Available at all times, separate from seller chat |

The browser demonstration enforces this consistently in the listing, My Trips, Messages list, direct chat routes, Quick Reply handler, Chat submit action, and public Comments route. Preloaded old host conversations are absent from the default state, and historical browser conversations are not displayed when ineligible. Free-form offer messages are discarded by the offer submission path. The posting form blocks telephone numbers, email addresses, and direct contact links from public title/description fields.

**Important security boundary:** A static client cannot provide enforceable authorisation. The `paymentStatus==='verified_demo'` flag is localStorage-backed, generated only by completing the simulated checkout animation. A user with developer tools can edit localStorage. In a production system, server-side checks must verify signed payment gateway webhooks and prevent client-set paymentStatus; use authenticated identities, booking-specific access policies, contact masking, moderated listings and secure message storage.

## 3. Owner and buyer workflows
- Buyer: Home → Transport category → SUV & 4×4s subcategory → select a listing → choose dates → Make Offer or Reserve → complete **fake** checkout → My Trips → booking chat unlocked.
- Provider: Post → choose Hardware → select Power & Electrical → set features, price, description and offer toggle → publish a browser-local sample listing → searchable in Hardware and general Explore.
- Before payment: users can read listing descriptions and structured FAQs, view reviews, use offer/counteroffer price buttons, and reach ATM Demo Support or report concerns. They cannot directly send messages to a listing owner.

## 4. Smoke test matrix
1. Category totals: six categories × 48 listings; 288 unique IDs and titles.
2. Each category has its own Trending and full subcategory navigation.
3. Filtering by subcategory, city, price sort and category-specific feature flags works.
4. Explore initially shows 24 results with working Load more pagination.
5. Deep links to original `#/listing/2` (Transport) and `#/listing/24` (Spaces & Property) remain valid.
6. Unpaid direct `#/chat/:id`, chat buttons, quick replies and public comments are blocked.
7. Demo payment creates `paymentStatus='verified_demo'`, allowing booking-specific chat; cancellation revokes the permission when no active paid booking remains.
8. Posting and editing a listing preserves category, subcategory and filter attributes; public contact strings are rejected.
9. Date picker, offer states, confetti and Reserve-to-confirmation journey remain functional.
10. Responsive checks: category tiles, subcategory rails, filters and bottom navigation at 320px, 390px, 768px and desktop widths; no useless buttons or dead ends.

## Known next steps for production
- Verify all generated listing images and swap generic photographic placeholders for accurate licensed photos per subcategory.
- Add hourly, weekly, per-trip, per-job and per-session rates; especially for Services.
- Connect a real taxonomy database, robust location/geocoder, dynamic seller-managed availability, real popularity signals and searchable metadata.
- Server-side message authorisation, fraud checks, dispute and refund workflows, payment confirmations and moderation are mandatory for any real use.

## v14 Release QA corrections
The live v13 browser audit identified three regressions that have been corrected before final client delivery:
- **Broken bicycle images:** The failing road-bicycle Unsplash asset was replaced with the working bicycle asset already used by the catalogue.
- **Pagination state leakage:** Each route change, including browser Back/Forward, resets the number of displayed results to 24; Load more continues to show the next 24 only within the current page.
- **New listing discovery:** Newly published or updated owner listings are prioritised at the top of category and Explore grids under the default Trending sort, without falsely adding them to a category's popularity-based Trending carousel.

A targeted JavaScript interaction regression verified: Explore 24 → Load more 48 → Hardware 24 → Load more 48 → Explore 24; publishing a Hardware / Power & Electrical listing; the listing appears as the first Hardware grid tile; and the bicycle image URL now refers to the known working asset. A separate live browser audit is used to verify rendering and payment-gated messaging.
