# ATM — Tap-First User Experience Audit
**Date:** 18 November 2026  
**Reference reviewed:** https://atm-home-list.vercel.app/  
**Target:** https://realtriple-e.github.io/atm-marketplace-demo/

## Design policy
Prefer a tap, selection, reuse of saved information, or contextual default before asking a customer to type. Keep text input when essential to describe something unique or to provide a regulated/verified personal or payment detail. Do not silently assume users consent to payment or booking.

## Delivered in ATM
| Journey | Before | Current implementation |
| --- | --- | --- |
| Dates | Start/end fields requiring keyboard or native picker | Custom calendar grid, visible selected range, quick date pills, disabled illustrative unavailable dates and date-range memory |
| Offer price | Number input | Suggested price chips, +/- stepper and price acceptance hint |
| Duration / group size | Fields or implicit defaults | +/- steppers for days/nights and people/guests |
| Offer submission | Simple instant status | Slide-up sheet, animated simulated host waiting, accept/counter/decline response, retry, accepted-price checkout |
| Booking | Separate date-input form | Reserve action on listing, direct checkout, preserved negotiated dates and price |
| Payment method | Generic inputs | MTN, Airtel, card and bank transfer selectable cards, live fee breakdown and fictional preselected demo number |
| Payment confirmation | Plain demo checkout | Simulated approval animation, confirmation card and Trips |
| Search | Type keyword | Tap popular search suggestions (typing remains available) |
| Chat | Type every question | Tap prewritten common questions (custom text remains available) |
| Reporting | Mandatory report detail text | Choose a reason; extra details are optional |

## Remaining candidates (recommended next)
1. **Listing publication:** Title, descriptive text and prices are legitimately variable, but provide photo-first category identification, editable title/description templates, preset price bands and +/- steppers. Keep optional free typing. Do not publish generated content without owner review.
2. **Account profile:** Use trusted identity providers / OAuth or a one-time code to minimise repeated full-name and email entry once a real backend exists. Do not use fake login credentials or claim authentication in the static demo.
3. **Mobile Money setup:** When a real payment provider is integrated, use consented provider-linked verified numbers, contact picker where available or autofill. Never store PIN, card credentials or full mobile numbers in an unaudited local demo.
4. **City and pickup location:** Allow category chips, recent locations and explicit map-pin selection when a reliable geocoder / location consent is available. Do not silently fetch precise location.
5. **Delivery requirements:** Use toggle chips (pickup, delivery), address selection and quantity steppers instead of a free-form paragraph.
6. **Booking special requests:** Make notes optional; offer common chips like "Morning collection", "Need delivery", and "Invoice required".
7. **Messages:** Extend one-tap replies based on the listing category and current offer status; offer free text only as an escape hatch.
8. **Problem reports:** Radio/chip reason selection, then optional details or photo upload for cases needing evidence.
9. **Accessibility:** Keep numeric/text alternatives for assistive technology and power users. Every tap target must have an accessible name and keyboard operation.

## Distinctions
- ATM is a rental marketplace for **vehicles, equipment, tools, events, properties, and services**, so units are per **day**, except **Property**, which uses **night**. Fee and duration summaries match the unit.
- A selected sample availability block is **illustrative** and must not be represented as a real host's bookings.
- Suggested prices and seller replies are **demo-only**. Status lives in the current browser localStorage and does not synchronise across devices.
- Checkout shows fees (ATM fixed service K80, illustrative processing charges 2% or 3.6%, and any listing deposit) and never charges money.
- The on-screen confirmation is **not a real WhatsApp message, actual self-check-in code, verified booking or live payment**.
- The reference flow inspired interaction patterns; ATM uses independently written source and its own black/orange design rather than importing the other site's proprietary assets.

## End-to-end validation plan
- Home > Listing > Calendar > Offer > Suggested amount > Change days/people > Send > Animated response > Accept > Checkout > Choose MTN/Airtel/card/bank > Approval > Confirmation > Trips.
- Home > Listing > Reserve > Select dates > Payment selection > Confirmation > Trips.
- Offers > Open a saved accepted offer > Checkout using agreed rate.
- Date checks: past dates disabled; illustrative blocked days disabled; both range endpoints chosen; cannot cross disabled dates; 1–90 valid days/nights.
- Responsive checks: 320, 375, 390, 430, 768, 1024 and 1440 CSS pixels, including mobile safe area.
- Regression checks: Explore, Post, Account, Bookings, notifications, saving, chat, listing cards and share flow still work.
