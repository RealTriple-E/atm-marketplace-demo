# ATM vs ATM Home List — Offer, Reserve and Payment Flow Audit
**Audit date:** 18 November 2026  
**Live reference inspected:** https://atm-home-list.vercel.app/  
**ATM demo:** https://realtriple-e.github.io/atm-marketplace-demo/  
**Scope:** Item detail → calendar → offer → response → reserve/checkout → illustrative payment → confirmation → trip history. No claim of actual availability, seller messaging, money movement, booking, or WhatsApp delivery.

## Source-derived reference findings
The live reference showed five *settled* likelihood bands for a listing priced at K3,800 per night:
| Offer / listed price | Reference text | Reference meter width | Reference settled fill and label |
|---|---|---:|---|
| Below 65% | Unlikely | 10% | red `#F04438` |
| 65%–under 75% | Ambitious | 28% | warm orange `#FD853A` |
| 75%–under 88% | Host may counter | 50% | amber `#F79009` |
| 88%–under 96% | Good chance | 75% | green `#12B76A` |
| 96% and above | Very likely accepted | 95% | deep green `#039855` |

These are **illustrative guide labels**, not probabilities of a real host accepting an offer. They fall in three meaningful colour families—red, orange, and green—with lighter and darker variants. The reference's visible offer amount itself remained dark. At K3,800/night, suggested amounts are K3,050, K3,400 and K3,800. The large 44px price number is flanked by 56px circular minus/plus controls; the 320×8px meter is directly below with a same-colour status label.

**Acceptance:** The reference uses an 80px green-check animation, the text “Offer accepted! 🎉”, and a Book CTA. It does **not** produce actual particle confetti; that addition was explicitly requested for ATM. The counter path uses an orange gavel animation and opens checkout immediately when the user accepts the counter. The waiting state lasts about 4–5 seconds.

**Payment:** MTN Mobile Money uses a `#FFCB05` yellow badge with a dark phone icon; Airtel Money uses `#E40000` with a white phone icon; Visa/Mastercard uses `#1A1F71`; Bank transfer uses `#475467`. Full payment cards show 2% MTN/Airtel, 3.6% cards, 0% bank, plus the K80 example service fee. Reference examples were illustrative, not real payments.

**Reserve:** The reference's Olympia property is Reserve-only. Direct Reserve skips negotiation and opens checkout at the listed rate. For reserve-only accommodation, a 5% long-stay discount was shown at three nights. A negotiated counteroffer was not given an additional long-stay discount.

## ATM implementation reconciliation
| Feature | ATM implementation | Divergence or limitation |
|---|---|---|
| Offer price and chips | Tap-only +/- and three unique suggestions (based on the listing's price), animate in place | Keeps ATM dark buttons and existing typography |
| Likelihood line and words | Five matching bands and settled colours; status changes with the amount | Three hue families; no genuine seller prediction |
| Animated waiting and host replies | Waiting orbit, host avatar, simulated acceptance/counter/decline after 4.2s | Only browser-local fake host responses |
| Accepted offer | Green animated check, heading “Offer accepted! 🎉”, reserve-at-offer CTA and particle confetti | Confetti is an ATM-specific addition; respects reduced-motion preference |
| Counter accepted | Proceeds to checkout at negotiated daily rate with confetti | Same journey as the reference with added celebration |
| Date selection | Calendar grid, crossed-out illustrative blocked days, range selection and quick date pills | ATM *remembers* selected listing dates into Offer to reduce taps; reference Offer defaults independently |
| Reserve-only | Supported by `offersAllowed:false`, with sample Property listing ID 24, plus a seller-side checkbox | Illustrative demo listing, no real host settings backend |
| Pricing | Item/rate × days or nights; K80 sample service fee; method processing and optional demo deposit | ATM supports many rental categories and illustrative listing deposits; discounted direct Reserve applies only to property, not negotiated rates |
| Payment selection | Provider-coloured branded icon badges, method cards with fees and dynamic totals | Demo numbers are fictional; no live cards, PINs, SMS, or mobile-money requests |
| Payment approval | Animated phone/progress and automatic demo confirmation | No actual payment processing |
| Confirmation | Animated success mark, WhatsApp-*style* preview, reservation reference and next actions | No actual WhatsApp message; check-in is illustrative for Property only |
| My Trips | Dates, group size, method, demo status, masked Property check-in cue and details | Browser localStorage only; no accounts or cross-device synchronisation |
| Slide-over | Rounded handle, internal scroll, rise animation and swipe-down dismiss | Additional supported keyboard Escape exit |
| Mobile and accessibility | Sized responsive controls, labels, reduced-motion support, no sheet remount on price/quantity changes | Screen-reader and viewport audits should be rerun after changes |

## Demo acceptance tests to rerun before client handoff
1. K3,800 sample price: K2,400 (Unlikely/red 10%), K2,650 (Ambitious/warm orange 28%), K3,200 (Host may counter/amber 50%), K3,400 (Good chance/green 75%), and K3,800 (Very likely accepted/dark green 95%).
2. Price tap updates *only* amount, label, meter, chips, and total; no modal remount/scroll jump. +/- date and people do the same.
3. Send an accepted offer, wait for accepted state, and verify actual visible confetti, reduced-motion fallback, one-off cleanup, and functional Reserve.
4. Send counteroffer, accept it; confirm confetti and preserved negotiated price in checkout. Use Make new offer and retest.
5. Reserve-only example shows no Offer button; direct Reserve works and does not apply an additional negotiated discount.
6. MTN badge yellow, Airtel badge red, Visa badge blue, bank badge slate; changing methods adjusts fee and total, and Airtel uses the fictional 97-prefixed example.
7. Animated approval produces a labelled fake confirmation, a WhatsApp-style preview that explicitly says **no message sent**, then a saved My Trips entry.
8. Test widths 320, 375, 390, 430, 768, 1024 and 1440px; verify Days and People never overlap the total/CTA.
9. Verify reduced-motion preferences, touch drag handle, keyboard Escape, and availability-date restrictions.

## Boundaries retained intentionally
This remains a **static GitHub Pages concept**: availability is generated illustrative data; payments, approvals, acceptance, authentication, and reservations are simulated. Live host confirmation, inventory calendars, payment gateways, WhatsApp messaging, secure account management and cross-device data require a separate authenticated backend and provider integrations. Do not describe fake notifications or hypothetical check-in codes as real.
