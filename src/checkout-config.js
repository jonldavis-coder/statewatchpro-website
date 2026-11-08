// StateWatchPro checkout config. Paste each Stripe Payment Link URL (https://buy.stripe.com/...) between the quotes.
// Empty slot = the button falls back to its mailto link. No keys or secrets belong in this file.
window.SWP_CHECKOUT_LINKS = {
  "trial": "",       // $399 30-day trial (1 user)
  "per-user": "",    // $3,000 per user per year
  "5-user": "",      // $10,000 per year, 5-user bundle
  "10-user": "",     // $25,000 per year, 10-user bundle
  "enterprise": "",  // $35,000 per year, Enterprise up to 30 users (button reads "Contact sales"; leave empty to keep it as email)
  "foia": ""         // $150 per FOIA request. Empty slot keeps the email fallback. Annual members use the intake form for their 1 free request per year.
};
