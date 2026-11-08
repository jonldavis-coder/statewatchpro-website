// StateWatchPro checkout config. Paste each Stripe Payment Link URL (https://buy.stripe.com/...) between the quotes.
// Empty slot = the button falls back to its mailto link. No keys or secrets belong in this file.
window.SWP_CHECKOUT_LINKS = {
  "trial": "",       // $129 one-week (7-day) trial (1 user)
  "per-user": "",    // Professional, $1,999 per user per year
  "enterprise": "",  // Enterprise, custom 10+ seats (button reads "Contact sales"; leave empty to keep it as email)
  "foia": ""         // $199 per FOIA request. Empty slot keeps the email fallback. Annual members use the intake form for their 1 free request per year.
};
