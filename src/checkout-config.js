// StateWatchPro checkout config. Paste each Stripe Payment Link URL (https://buy.stripe.com/...) between the quotes.
// Empty slot = the button falls back to its mailto link. No keys or secrets belong in this file.
window.SWP_CHECKOUT_LINKS = {
  "trial": "https://buy.stripe.com/4gMaEXa1bcqQcx1ay8f3a0Y", // sale $64, regularly $129, one-week (7-day) trial, 1 user
  "per-user-monthly": "https://buy.stripe.com/00w5kD6OZgH68gL21Cf3a10", // sale $99/month per user, regularly $199/month
  "per-user": "https://buy.stripe.com/28E4gzehrfD20Oj9u4f3a11", // annual, sale $999/year per user, regularly $1,999/year
  "foia": "https://buy.stripe.com/5kQ28r0qBeyYaoT0Xyf3a0Z", // $199 per FOIA request. No sale. Annual members use the intake form for their 1 free request per year.
  "foia-5pack": "https://buy.stripe.com/00wdR9gpzbmMeF95dOf3a12", // $899 for 5 FOIA requests. No sale.
  "enterprise": "" // Enterprise, custom 10+ seats. Leave empty so Contact sales stays a mailto link.
};
