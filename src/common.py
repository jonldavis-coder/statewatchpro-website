"""StateWatchPro shared layout."""
import json
SITE = "StateWatchPro"
import os
BASE = os.environ.get("SWP_BASE", "https://jonldavis-coder.github.io/statewatchpro-website")  # set SWP_BASE=https://statewatchpro.com for domain build
V = "20261107c"
EMAIL_USER, EMAIL_DOMAIN = "hello", "statewatchpro.com"  # PLACEHOLDER — Jonathan to confirm
APP = "https://rfp-intelligence-hub-3ht5.onrender.com"
NAV = [("index.html","Home"),("features.html","Features"),("coverage.html","Coverage"),("use-cases.html","Use cases"),("provenance.html","Data &amp; provenance"),("pricing.html","Pricing"),("faq.html","FAQ"),("support.html","Support")]
def mailto(subject, label, cls="btn btn-primary"):
    return f'<a class="{cls}" href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}?subject={subject.replace(" ","%20")}">{label}</a>'
DEMO = lambda cls="btn btn-primary": mailto("StateWatchPro demo request","Request a demo",cls)
EARLY = lambda cls="btn btn-ghost": mailto("StateWatchPro early access","Join the early-access list",cls)

def header(active):
    li = "".join(f'<li><a href="{h}"{' aria-current=page' if h==active else ''}>{l}</a></li>' for h,l in NAV)
    return f'''<a class="skip" href="#main">Skip to main content</a>
<header class="hdr"><nav class="wrap nav" aria-label="Primary">
<a class="brand" href="index.html"><img src="assets/logo.png" alt="StateWatchPro" width="189" height="60"></a>
<button class="tog" type="button" aria-controls="nav" aria-expanded="false" aria-label="Open menu"><span></span><span></span><span></span></button>
<ul id="nav" class="links">{li}<li>{DEMO("btn btn-primary sm")}</li></ul>
</nav></header>'''

FOOTER = f'''<footer class="ftr"><div class="wrap fgrid">
<div><img src="assets/logo-white.png" alt="StateWatchPro" width="189" height="60" loading="lazy"><p>State government intelligence for consultants, consulting firms, vendors, and state government teams, whether you’re pursuing new state bids, protecting the contracts you hold, or comparing how other states work.</p>
<p>Contact: <a href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}">{EMAIL_USER}@{EMAIL_DOMAIN}</a></p></div>
<div><h2>Product</h2><ul><li><a href="features.html">Features</a></li><li><a href="coverage.html">Coverage &amp; roadmap</a></li><li><a href="provenance.html">Data &amp; provenance</a></li><li><a href="pricing.html">Pricing</a></li></ul></div>
<div><h2>Company</h2><ul><li><a href="use-cases.html">Use cases</a></li><li><a href="faq.html">FAQ</a></li><li><a href="contact.html">Contact / demo</a></li><li><a href="support.html">Customer support</a></li></ul></div>
<div><h2>Legal</h2><ul><li><a href="privacy.html">Privacy</a></li><li><a href="terms.html">Terms</a></li></ul></div>
</div><div class="wrap fbot">&copy; 2026 StateWatchPro. All rights reserved.</div></footer>'''

def page(fname, title, desc, body, ld=None, noindex=False):
    url = BASE + "/" + ("" if fname=="index.html" else fname)
    lds = [ld] if isinstance(ld, dict) else (ld or [])
    if fname not in ("index.html","404.html"):
        lds.append({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":BASE+"/"},{"@type":"ListItem","position":2,"name":title.split(" | ")[0],"item":url}]})
    ldh = "".join(f'<script type="application/ld+json">{json.dumps(x)}</script>\n' for x in lds)
    rob = "noindex,follow" if noindex else "index,follow,max-image-preview:large"
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{rob}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0b1f3a">
<meta property="og:type" content="website"><meta property="og:site_name" content="StateWatchPro">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{BASE}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{BASE}/assets/og-image.png">
<link rel="icon" href="favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="site.webmanifest">
<link rel="stylesheet" href="css/styles.css?v={V}">
{ldh}</head><body>
{header(fname)}
<main id="main">
{body}
</main>
{FOOTER}
{'<script src="assets/js/checkout-config.js?v='+V+'" defer></script>' if fname=="pricing.html" else ""}<script src="js/main.js?v={V}" defer></script>
</body></html>
'''
def hero(eb, h1, lead, extra=""):
    return f'<section class="hero sub"><div class="wrap"><span class="eb">{eb}</span><h1>{h1}</h1><p class="lead">{lead}</p>{extra}</div></section>'
def cards(items, cls="grid3"):
    return f'<div class="{cls}">' + "".join(f'<article class="card"{' id='+i[2] if len(i)>2 else ''}><h3>{i[0]}</h3><p>{i[1]}</p></article>' for i in items) + '</div>'
def sec(h, inner, lead="", dark=False, id_=""):
    i = f' id="{id_}"' if id_ else ""
    return f'<section class="sec{" dark" if dark else ""}"{i}><div class="wrap"><h2>{h}</h2>{"<p class=lead>"+lead+"</p>" if lead else ""}{inner}</div></section>'
def cta(h="See StateWatchPro on your states", p="Arkansas comes first, with all 50 states on the rollout plan. Ask for a walkthrough or get on the early-access list."):
    return f'<section class="sec"><div class="wrap"><div class="cta"><h2>{h}</h2><p>{p}</p><div class="acts">{DEMO()}{EARLY("btn btn-ghost light")}</div></div></div></section>'
def checks(xs): return '<ul class="checks">' + "".join(f"<li>{x}</li>" for x in xs) + "</ul>"
