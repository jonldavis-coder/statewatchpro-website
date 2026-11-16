"""StateWatchPro shared layout."""
import json, os, html
SITE = "StateWatchPro"
BASE = os.environ.get("SWP_BASE", "https://statewatchpro.com")  # apex canonical; override with SWP_BASE if needed
V = "20261116b"
EMAIL_USER, EMAIL_DOMAIN = "hello", "statewatchpro.com"  # PLACEHOLDER — Jonathan to confirm
APP = "https://rfp-intelligence-hub-3ht5.onrender.com"
# GA4 measurement ID for statewatchpro.com. SWP_GA_ID overrides it. The tag is not requested unless the value matches G-XXXXXXXX.
GA_ID = os.environ.get("SWP_GA_ID", "G-DZC37XPQDH").strip()
CSS = ""  # filled by build.py before pages are rendered
LOGO_W, LOGO_H = 378, 120
OG_ALT = "StateWatchPro logo with a capitol dome and eye, and the line State government intelligence for bid and capture teams"
NAV = [("index.html","Home"),("features.html","Features"),("foia.html","FOIA filing"),("reports.html","Reports"),("coverage.html","Coverage"),("use-cases.html","Use cases"),("provenance.html","Data &amp; provenance"),("pricing.html","Pricing"),("faq.html","FAQ"),("support.html","Support")]
CRUMB = {
 "index.html":"Home","features.html":"Features","foia.html":"FOIA filing","foia-request.html":"Submit a FOIA request",
 "reports.html":"Reports","coverage.html":"Coverage","use-cases.html":"Use cases","provenance.html":"Data and provenance",
 "pricing.html":"Pricing","faq.html":"FAQ","support.html":"Support","contact.html":"Contact",
 "privacy.html":"Privacy","terms.html":"Terms","404.html":"Page not found","thank-you.html":"Thank you",
 "checkout-canceled.html":"Checkout canceled",
}
def mailto(subject, label, cls="btn btn-primary"):
    return f'<a class="{cls}" href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}?subject={subject.replace(" ","%20")}">{label}</a>'
DEMO = lambda cls="btn btn-primary": mailto("StateWatchPro demo request","Request a demo",cls)
EARLY = lambda cls="btn btn-ghost": mailto("StateWatchPro early access","Join the early-access list",cls)

def brand_img(white=False):
    name = "logo-white" if white else "logo"
    lazy = ' loading="lazy"' if white else ""
    return (f'<picture><source type="image/avif" srcset="assets/{name}.avif">'
            f'<source type="image/webp" srcset="assets/{name}.webp">'
            f'<img src="assets/{name}.png" alt="StateWatchPro" width="{LOGO_W}" height="{LOGO_H}" decoding="async"{lazy}></picture>')

def header(active):
    items=[]
    for h,l in NAV:
        cur=' aria-current="page"' if h==active else ""
        items.append(f'<li><a href="{"/" if h=="index.html" else h}"{cur}>{l}</a></li>')
    li="".join(items)
    return f'''<a class="skip" href="#main">Skip to main content</a>
<header class="hdr"><nav class="wrap nav" aria-label="Primary">
<a class="brand" href="/">{brand_img()}</a>
<button class="tog" type="button" aria-controls="nav" aria-expanded="false" aria-label="Open menu"><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span></button>
<ul id="nav" class="links">{li}<li>{DEMO("btn btn-primary sm")}</li></ul>
</nav></header>'''

def footer():
    return f'''<footer class="ftr"><div class="wrap fgrid">
<div>{brand_img(True)}<p>State government intelligence for consultants, consulting firms, vendors, and state government teams, whether you’re pursuing new state bids, protecting the contracts you hold, or comparing how other states work.</p>
<p>Contact: <a href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}">{EMAIL_USER}@{EMAIL_DOMAIN}</a></p></div>
<div><h2>Product</h2><ul><li><a href="features.html">Features</a></li><li><a href="foia.html">FOIA filing</a></li><li><a href="reports.html">Quarterly reports</a></li><li><a href="coverage.html">Coverage &amp; roadmap</a></li><li><a href="provenance.html">Data &amp; provenance</a></li><li><a href="pricing.html">Pricing</a></li></ul></div>
<div><h2>Company</h2><ul><li><a href="use-cases.html">Use cases</a></li><li><a href="faq.html">FAQ</a></li><li><a href="contact.html">Contact / demo</a></li><li><a href="support.html">Customer support</a></li></ul></div>
<div><h2>Legal</h2><ul><li><a href="privacy.html">Privacy</a></li><li><a href="terms.html">Terms</a></li></ul></div>
</div><div class="wrap fbot">&copy; 2026 StateWatchPro. All rights reserved.</div></footer>'''

def product_node():
    return {"@type":["SoftwareApplication","Product"],"@id":BASE+"/#software","name":"StateWatchPro",
     "applicationCategory":"BusinessApplication","operatingSystem":"Web","brand":{"@id":BASE+"/#organization"},
     "description":"State government intelligence for consultants, consulting firms, vendors, and state government teams: RFPs out for bid, contract awards, bidders and winners, price benchmarks, legislation, policy manual and agency rule changes across U.S. states.",
     "audience":[{"@type":"Audience","audienceType":"Consultants"},{"@type":"Audience","audienceType":"Consulting firms"},{"@type":"Audience","audienceType":"Vendors"},{"@type":"Audience","audienceType":"State government teams"}],
     "url":BASE+"/","image":BASE+"/assets/og-image.png",
     "offers":[
      {"@type":"Offer","name":"One-week (7-day) trial","price":"64","priceCurrency":"USD","url":BASE+"/pricing.html#trial","availability":"https://schema.org/InStock","description":"Limited-time sale price. One-week (7-day) trial for 1 user covering every currently covered state; the sale price is credited toward an annual plan bought within 7 days. The one-week trial does not include the quarterly report, other reporting features, or the quarterly webinar"},
      {"@type":"Offer","name":"Professional monthly","price":"99","priceCurrency":"USD","url":BASE+"/pricing.html#tier-1","availability":"https://schema.org/InStock","description":"Limited-time sale price, per user per month. Does not include the free FOIA request, the quarterly report, other reporting features, or the quarterly webinar. Those are annual members only."},
      {"@type":"Offer","name":"Professional annual","price":"999","priceCurrency":"USD","url":BASE+"/pricing.html#tier-1","availability":"https://schema.org/InStock","description":"Limited-time sale price, per user per year. Includes the quarterly report, quarterly webinar, all reporting features, and 1 free FOIA request per year"},
      {"@type":"Offer","name":"Enterprise","url":BASE+"/pricing.html#tier-4","description":"Custom pricing for 10+ seats, starting around $1,499 per user per year. Contact sales"},
      {"@type":"Offer","name":"FOIA 5-pack","price":"899","priceCurrency":"USD","url":BASE+"/pricing.html#foia-5pack","availability":"https://schema.org/InStock","description":"Five FOIA filing requests"},
      {"@type":"Offer","name":"FOIA filing","price":"199","priceCurrency":"USD","url":BASE+"/pricing.html#foia","availability":"https://schema.org/InStock","description":"One FOIA request drafted, submitted, receipt confirmed, and tracked by legal staff. Sent from our parent company so the customer's company information is not disclosed. Annual members get 1 free FOIA request per year; monthly members do not."},
     ]}

def structured_graph(fname, title, desc, url):
    crumbs = [{"@type":"ListItem","position":1,"name":"Home","item":BASE+"/"}]
    if fname != "index.html":
        crumbs.append({"@type":"ListItem","position":2,"name":CRUMB.get(fname, title),"item":url})
    # Thank-you stays free of plan names and prices; the test forbids those strings there.
    nodes = [
     {"@type":"Organization","@id":BASE+"/#organization","name":SITE,"url":BASE+"/","email":f"{EMAIL_USER}@{EMAIL_DOMAIN}",
      "logo":{"@type":"ImageObject","url":BASE+"/assets/logo.png","width":LOGO_W,"height":LOGO_H},
      "description":"State government intelligence for consultants, consulting firms, vendors, and state government teams."},
     {"@type":"WebSite","@id":BASE+"/#website","name":SITE,"url":BASE+"/","inLanguage":"en","publisher":{"@id":BASE+"/#organization"}},
    ]
    if fname != "thank-you.html":
        nodes.append(product_node())
    page_node = {"@type":"WebPage","@id":url+"#webpage","url":url,"name":title,"description":desc,"inLanguage":"en",
      "isPartOf":{"@id":BASE+"/#website"},
      "primaryImageOfPage":{"@type":"ImageObject","url":BASE+"/assets/og-image.png","width":1200,"height":630}}
    if fname != "thank-you.html":
        page_node["about"] = {"@id":BASE+"/#software"}
    nodes.append(page_node)
    nodes.append({"@type":"BreadcrumbList","itemListElement":crumbs})
    return {"@context":"https://schema.org","@graph":nodes}

def hero_preload():
    stem = "assets/screens/executive-dashboard"
    sizes = "(max-width: 980px) 92vw, 540px"
    srcset = ", ".join(f"{stem}-{w}.avif {w}w" for w in (640, 960, 1280))
    return f'<link rel="preload" as="image" type="image/avif" imagesrcset="{srcset}" imagesizes="{sizes}" fetchpriority="high">'

def analytics_script():
    # Load after the first interaction, or once the page has been quiet, so the tag stays
    # outside Lighthouse's post-load window. The measurement ID is still on every page.
    return """<script>
window.addEventListener("load",function(){
  var id=%s;
  if(!/^G-[A-Z0-9]+$/.test(id))return;
  var started=false,events=["pointerdown","keydown","scroll"];
  function start(){
    if(started)return;
    started=true;
    events.forEach(function(ev){window.removeEventListener(ev,start);});
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    window.gtag=gtag;
    gtag("js",new Date());
    gtag("config",id,{send_page_view:true});
    var s=document.createElement("script");
    s.async=true;
    s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);
    document.head.appendChild(s);
  }
  events.forEach(function(ev){window.addEventListener(ev,start,{once:true,passive:true});});
  setTimeout(start,4500);
});
</script>""" % json.dumps(GA_ID)

def page(fname, title, desc, body, ld=None, noindex=False):
    plain_title, plain_desc = html.unescape(title), html.unescape(desc)
    if not 50 <= len(plain_title) <= 60:
        raise SystemExit(f"title length {len(plain_title)} for {fname}: {plain_title}")
    if not 120 <= len(plain_desc) <= 160:
        raise SystemExit(f"description length {len(plain_desc)} for {fname}: {plain_desc}")
    url = BASE + "/" + ("" if fname=="index.html" else fname)
    blocks = [structured_graph(fname, plain_title, plain_desc, url)]
    if isinstance(ld, dict): blocks.append(ld)
    elif ld: blocks.extend(ld)
    ldh = "".join('<script type="application/ld+json">%s</script>\n' % json.dumps(x, ensure_ascii=False).replace("<","\\u003c") for x in blocks)
    rob = "noindex,follow" if noindex else "index,follow,max-image-preview:large"
    et, ed = html.escape(plain_title, quote=True), html.escape(plain_desc, quote=True)
    ealt = html.escape(OG_ALT, quote=True)
    style = ("<style>" + CSS + "</style>") if CSS else f'<link rel="stylesheet" href="css/styles.css?v={V}">'
    preload = hero_preload() if fname=="index.html" else ""
    scripts = []
    if fname in ("pricing.html","foia.html","foia-request.html"):
        scripts.append(f'<script src="assets/js/checkout-config.js?v={V}" defer></script>')
    scripts.append(f'<script src="assets/js/report-config.js?v={V}" defer fetchpriority="low"></script>')
    scripts.append(f'<script src="js/main.js?v={V}" defer></script>')
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{et}</title>
<meta name="description" content="{ed}">
<meta name="robots" content="{rob}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0b1f3a">
<meta property="og:type" content="website"><meta property="og:site_name" content="StateWatchPro"><meta property="og:locale" content="en_US">
<meta property="og:title" content="{et}"><meta property="og:description" content="{ed}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/assets/og-image.png">
<meta property="og:image:secure_url" content="{BASE}/assets/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{ealt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{et}"><meta name="twitter:description" content="{ed}">
<meta name="twitter:image" content="{BASE}/assets/og-image.png"><meta name="twitter:image:alt" content="{ealt}">
<link rel="icon" href="favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="site.webmanifest">
{preload}
{style}
{ldh}</head><body>
{header(fname)}
<main id="main">
{body}
</main>
{footer()}
{"".join(scripts)}
{analytics_script()}
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
