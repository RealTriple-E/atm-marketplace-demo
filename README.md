# ATM — Anything to Hire (Zambia) · Interactive Concept

Responsive, mobile-first rental marketplace prototype based on an Uber-inspired layout. The app runs on static hosting and has no runtime build step.

## Run locally

Open `index.html` in a browser or serve the directory:

```sh
python3 -m http.server 8080
```

Visit http://localhost:8080/.

## Included journeys

- Home screen with 20 swipeable trending hire cards and 20 vertically scrolling social-style hire posts.
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

## Publish to GitHub Pages

1. Create a **new public repository** named `atm-marketplace-demo` (or another name) on GitHub.
2. Add all repository files (including `.nojekyll`) to its `main` branch.
3. In **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. The site URL will follow `https://YOUR-USERNAME.github.io/REPO-NAME/` once GitHub confirms successful publication.

Because all paths are relative and routing is via `#/...`, it works as a GitHub Pages project site without a framework or GitHub Actions.

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
