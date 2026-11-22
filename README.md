# ATM — Anything to Hire (Zambia) · Interactive Concept

Responsive, mobile-first rental marketplace prototype based on an Uber-inspired layout. The app runs on static hosting and has no runtime build step.

## Current release: frontend concept only (22 November 2026)

ATM is an **interactive buyer-and-seller UI concept**, not a live rental service.
**Do not configure a database, real login, payment provider or seller messaging server.**
The working demo is [ATM Marketplace on GitHub Pages](https://realtriple-e.github.io/atm-marketplace-demo/#/home).

- **Home:** six **circular** categories, demonstration auctions, a discovery grid and **20 social-style fictional rental posts**, each with a seller portrait, sharing, saving and a full listing detail.
- **Categories:** Transport, Hardware, Events, Spaces & Property, Lifestyle and Services. Each has its own Trending carousel, subcategories, filters and pagination across 288 fictional examples.
- **Product detail:** swipeable, dot/arrow-controlled galleries, seller profiles, reviews, sample availability, city information and functional Offer or Reserve actions.
- **Seller:** dashboard, listing management, create/edit/delete, fixed or negotiable prices, timed auctions, configurable rewards and three image URL slots (the cover can also be uploaded).
- **Buyer:** bids, sample competitor bids, sample notifications, saved listings, offers and counteroffers, reservations, simulated MTN/Airtel/card/bank checkout, My Trips and messaging after fictional payment.
- **Auction checkout:** a winning bid represents the **entire rental period**, not the rate per day. Dates are locked to the auction award and fees/deposits appear once.
- **No live beta exposure:** the unconfigured ATM Live entry is removed from Account. Direct visitors to live.html are redirected to the concept. Optional Live/SQL source remains in GitHub but is not activated.

### Automated checks

The project has frontend syntax/domain checks plus a real Chromium regression suite covering buyer navigation, mobile widths, custom seller galleries, reservations, postpayment chat, and auction totals. The browser workflow is at .github/workflows/atm-visual-qa.yml, and screenshots are attached to its GitHub Actions runs. It serves only static files, without Supabase or a payment processor.

To run the browser tests locally, serve this directory on port 4173, install the pinned Playwright 1.57.0 package and its Chromium browser in a test environment, and run node tests/ui/concept-smoke.cjs.

## Run locally

Open `index.html` in a browser or serve the directory:

```sh
python3 -m http.server 8080
```

Visit http://localhost:8080/.

## Included journeys

- Home screen with six circular category choices, rental-auction previews and 20 social-style sample hire posts. Trending carousels are inside their respective category pages.
- Explore/search with category and city filters, price/rating/newest sorting, and detailed rental pages.
- Saved items, like/comment/share, image galleries, reporting.
- Select booking dates, calculate total including deposit, select simulated payment and complete a demo booking.
- Account, profile editing, notifications, booking history/cancellation, local chat, payment preferences, payout settings, help, and settings.
- Create/edit/delete local listings and see new items immediately in Explore.
- Mobile-first floating pill navigation on phones, tablets and desktops.
- Local browser persistence via `localStorage`; demo activity can be reset from Settings.

## Demonstration safeguards

**This is an interactive prototype, not a production marketplace.** All starter owner names, star ratings, prices and listings are invented examples set in Zambia. They are not verified offers. The application has **no server, identity verification, payment processor, real booking availability checks, remote messaging or cloud persistence**. No real seller is contacted or money collected. This distinction is shown throughout booking, chat and account flows.

Photos use public Unsplash-hosted images for illustrative purposes, with locally styled fallbacks if images are unavailable. Font is open-licensed Figtree (a geometric substitute for the proprietary Uber Move font); no Uber font assets or logo are bundled. The project is independent of Uber.

## Publishing this concept

This repository is already configured to publish from the GitHub Pages branch, **gh-pages**, at [ATM Marketplace](https://realtriple-e.github.io/atm-marketplace-demo/#/home). Do not change the Pages deployment source to main without updating the repository's hosting configuration.

The source of truth is main. After a verified frontend pull request is merged, fast-forward gh-pages to the new main commit. GitHub Actions must show a successful Pages deployment. This is static-file hosting and requires no database.

## Production roadmap

Backend with authentication and role permissions; PostgreSQL and secure media storage; real availability/inventory, booking statuses and cancellations; payment provider, split payments/refunds/deposits; listing moderation, identity verification, fraud controls, Terms and Privacy; notification/email/SMS provider, real-time chats and admin dashboard. Validate listing categories against local law before allowing regulated items.

## Client feedback update — 4 November 2026

- Owner headers are aligned; redundant three-dot post menus removed.
- Like and Comment actions removed from the home feed; Share uses a recognised share symbol, with Save retained.
- Review stars and clearly illustrative review counts replace the previous bottom action row.
- Entire listing cards open detail pages (including via keyboard Enter/Space).
- Listing details now have Make an offer, simulated seller decisions and negotiation history in Account → My offers.
- Accepted offers carry the agreed daily rate into checkout and booking calculations.
- Electric lawn mower uses an accurate original product illustration.

All starter listings, reviews, messages, offers and transactions remain simulated and browser-local.


## Client revision — Offers navigation (4 November 2026)

- The floating nav uses **Home / Offers / Post / Account**. Browse/search remains available via Home search and category cards.
- On a listing details screen, the nav is replaced by a fixed, near-edge-to-edge **Make Offer** CTA.
- Customers can select dates and propose a daily rental rate. Offers first appear as **Pending** in My Offers.
- For demonstrations, use **Simulate seller reply** on Pending offers to show Accepted, Counteroffer, or Declined; accepted offers can continue to the existing booking simulation. Withdraw pending offers as needed.
- All offer statuses and history are stored only in the local browser, not synced to any server or real seller.


## Tap-first offer and reservation UX (18 November 2026)
- The individual listing has **Offer** and **Reserve** buttons, both interactive. The fixed bottom controls retain ATM's black/orange styling.
- Tap-first 7-column calendar with demonstrative blocked dates and range highlighting; selected dates carry into offers and reservation.
- Offer sheet has suggested prices, +/- price controls, dates and days/people steppers, chance indicator and live total (no compulsory typing).
- Sending an offer shows animated waiting then a simulated seller response; counteroffers can be accepted or revised. All states persist to browser My Offers.
- Reserve opens animated Confirm and pay directly. MTN, Airtel, card and bank transfer are selectable; fees and totals update immediately. Demo mobile number is fictional and preselected. No real payment is processed.
- Simulated approval transitions to confirmation and My Trips. All starter listings and payments are fictional; availability blocks are illustrative, not sourced from real sellers.
- Review the connected [ATM Home List reference](https://atm-home-list.vercel.app/) for the interaction inspiration. The ATM implementation uses independently written code and retains ATM styling.


## Verified reference parity audit — 18 November 2026
See [the detailed Vercel offer and Reserve parity audit](docs/VERCEL_OFFER_RESERVE_PARITY_AUDIT.md) for exact likelihood colours, statuses, fees, branding, the new confetti animation, representative source comparisons, intentional demo-only differences, and v10 mobile/checkout regression evidence. The demo is a fictional local-browser marketplace, not a live booking or money-transfer service.


## ATM v13 — Six-category marketplace (18 November 2026)
- The catalogue is organised into **Transport, Hardware, Events, Spaces & Property, Lifestyle and Services**, each with dedicated subcategories and working category-specific features and location filters.
- Six category cards replace global Trending on the Home screen. Each category has a **Trending in [category]** carousel ranking sample listings inside that category/subcategory and a sortable listing grid.
- The catalogue contains **288 fictional listings (48 per category)** with distinct IDs/titles, subcategory labels, images, Zambian cities, K prices, ratings and demo availability. The original listing IDs 1–40 are preserved.
- Search spans categories; Explore and category results use interactive **Load more** pagination (24 at a time), keeping mobile rendering manageable.
- Post/Edit includes mandatory category and subcategory selection, optional category features, and public-contact suppression. A new listing appears in its chosen category.
- **Messaging rule:** There is no direct customer-provider chat, seller contact number, offer note or public comment before a booking has been marked **verified_demo** by the simulated payment-completion step. The booking Chat button then unlocks for that listing. Previously stored chat URLs are also gated. ATM Demo Support and reporting remain available at any time.
- **Security limitation:** This is static JavaScript/localStorage. The payment-status and messaging checks are **demonstration UX only** and cannot securely authorise real users or protect against tampered localStorage. Live enforcement requires authenticated server-side policies, verified payment webhooks, row-level access control and message permissions.

## ATM v16 — Product gallery and seller profile redesign (19 November 2026)
The product-detail page uses a full-bleed swipeable photo carousel, Vercel-reference-inspired overlapping dark panel, three-column reviews/verification, seller photo link, story, features, calendar, city map, sample reviews and fixed price + Offer + Reserve bar. All 288 fictional sample listings carry three curated stock-photo slides; 46 demo providers have distinct stock-portrait URLs. Every seller profile lists the owner's rentals, fictional account-creation date and tenure, aggregate ratings, and clearly fictional customer reviews. There is **never a direct Chat button on product or seller pages**; messages are accessible through My Trips after simulated paid-booking verification only. Images remain representative stock assets, not photos of actual rental inventory. See [source-grounded detail audit](docs/PRODUCT_VIEW_V15_AUDIT.md).

## ATM v21 — Buyer/Seller workspaces and timed auctions (22 November 2026)

### What is available in the browser demo
- One local sample account with two distinct workspaces. Switch between **Buyer** and **Seller** under Account. The bottom navigation changes with the active mode.
- **Buyer**: circular home categories, listings, auction discovery, watchlist, live bid-countdown display, bid history, negotiations, accepted bookings, notifications and My Bids.
- **Seller**: overview dashboard, manage own listings, create/edit listings, choose fixed/negotiable vs auction pricing, manage own auctions, configure minimum increments, optional reserve, rental dates, durations (6 hours–7 days), and three optional perk thresholds.
- Seller can enable/disable **Make Offer** individually for standard listings. Auction listings have neither direct Reserve nor Make Offer.
- Four fictional starter auctions provide simulated competing bids. Increase a bid using the slider and see which seller-defined rewards would become eligible **if the bid wins**.
- Explicit **Confirm bid** is required; moving the slider does not place a bid or charge any money. Bids below the minimum/increment are rejected, current top bidders cannot increase their own leading bid, and a bid placed in the last two minutes extends the auction by two minutes.
- The buyer may add an illustrative competing bidder to test outbid notifications; a seller may add a clearly labelled sample customer bid to test seller-side monitoring.
- Auction close determines a winner only if the reserve is met. A winner may complete ATM's existing **simulated** booking/payment flow; earned perks are then recorded in My Trips. Provider chat remains locked until simulated payment has been verified.
- A seller cannot bid on their own listings or alter important auction terms after bids are recorded. Reset demo data through Settings.
- The six circular homepage categories, existing swipeable listing image galleries and seller portraits are retained.

### Smoke-test checklist
1. Open Account, switch Seller, create a listing using **Timed auction**, select future rental dates, increment, reserve, duration and a reward.
2. Open Seller Auctions, view your listing and click **Simulate buyer bid**. Check bid count and confirm that pricing cannot be changed after the bid.
3. Switch Buyer; open an original sample auction on Home. Move the slider and verify eligible perks change. Confirm a demo bid and test **Simulate a competing bidder**, followed by My Bids.
4. Open a normal listing: an enabled negotiation shows Offer and Reserve; disabling negotiation for your own standard listing removes Offer.
5. Confirm that a listing auction does not offer an ordinary fixed-price reservation or a pre-payment Chat button.

### Technical scope and limitations

This release remains **a static frontend prototype** using the existing `localStorage` namespace. Modes, identity, bids, bidder counts, countdowns, winners, rewards and bookings are **not shared between browsers or devices**. Sample bidders are fabricated and explicitly labelled. Date availability, identity checks, reserve, anti-sniping, auction settlement, seller ownership, payment and messaging permissions have **no trusted backend enforcement**. No real money is charged, and this demo must not be used for binding rental auctions.

To make genuine multi-user bidding possible, implement authenticated buyer/seller identities, an authoritative transactional database with idempotent bids and concurrency control, server-generated auction times and settlement, real-time bidder updates, secure payment confirmation/webhooks, availability locks, notification delivery, fraud/shill bidding controls, and server-side chat permissions.

No new runtime dependencies or build tools are required for the demo. Validate the auction domain with:
```sh
node --check atm-auctions.js
node --check app.js
node --test tests/auction-model.test.cjs
```
