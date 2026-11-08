"""Checks: status, links, banned terms, overflow, screenshots. Usage: python3 test_site.py <base-url>"""
import sys, os, re, glob, urllib.request
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
OUT=os.environ.get("SWP_OUT", ROOT)
SHOTS=os.environ.get("SWP_SHOTS", "/tmp/statewatchpro-shots")
base=sys.argv[1].rstrip("/")+"/"; files=sorted(os.path.basename(p) for p in glob.glob(OUT+"/*.html")); bad=0
def get(u):
    try: r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=20); return r.status
    except urllib.error.HTTPError as e: return e.code
for f in files+["css/styles.css","js/main.js","robots.txt","sitemap.xml","site.webmanifest","favicon.ico","assets/logo.png","assets/og-image.png","assets/js/checkout-config.js","assets/js/report-config.js","assets/reports/statewatchpro-trends-sample.pdf","assets/statewatchpro-logo.svg"]:
    s=get(base+("" if f=="index.html" else f)); print(s,f)
    if s!=200: bad+=1
banned=re.compile(r"verasail|scaled ?learning|agile ?&|agileand|\bkids?\b|child|testimonial|lorem|\d+%|password|onrender|hhs|medicaid|human[ -]services|health|sign in",re.I)
for f in files:
    html=open(f"{OUT}/{f}").read()
    for m in banned.finditer(BeautifulSoup(html,"html.parser").get_text(" ")): print("BANNED",f,m.group(0)); bad+=1
    for m in re.finditer(r'(?:href|src)="([^"#?]+)',html):
        u=m.group(1)
        if u.startswith(("http","mailto:")) or u=="/statewatchpro-website/": continue
        if not os.path.exists(f"{OUT}/{u}"): print("BROKEN",f,u); bad+=1
for f in glob.glob(OUT+"/**/*.*",recursive=True):
    if f.endswith((".html",".xml",".txt",".webmanifest",".js",".css")):
        for m in re.finditer(r"hhs|medicaid|human[ -]services",open(f).read(),re.I): print("HEALTH-TERM",f,m.group(0)); bad+=1
print("missing page:", get(base+"nope.html"))
home=open(f"{OUT}/index.html").read(); uc=open(f"{OUT}/use-cases.html").read(); feat=open(f"{OUT}/features.html").read()
pricing=open(f"{OUT}/pricing.html").read(); faq=open(f"{OUT}/faq.html").read()
for needle, blob, name in [
    ("For state government teams", home, "home"),
    ('id="audiences"', home, "home"),
    ("https://jonldavis-coder.github.io/statewatchpro-website/", home, "canonical"),
    ('id="government"', uc, "use-cases"),
    ("For state government teams", uc, "use-cases"),
    ("For state staff", feat, "features"),
    ("cost reporting", feat, "features-cost"),
    ("agency licensing", pricing, "pricing"),
    ("$129", pricing, "price-trial"), ("$1,999", pricing, "price-user"),
    ("$10,000", pricing, "price-5"), ("$25,000", pricing, "price-10"), ("$35,000", pricing, "price-ent"),
    ("Can state government employees use StateWatchPro?", faq, "faq"),
    ("Is agency licensing different from the listed prices?", faq, "faq-2"),
    ("Email digests and notifications", home, "home-digests"),
    ('id="stay-current"', home, "home-highlight"),
    ("Customizable dashboards", home, "home-dashboards"),
    ('id="digests"', feat, "feat-digests"),
    ('id="alerts"', feat, "feat-alerts"),
    ('id="custom-dashboards"', feat, "feat-dashboards"),
    ("in-app and by email", feat, "feat-delivery"),
    ('id="included"', pricing, "plan-inclusions"),
    ("Can I get email digests and alerts?", faq, "faq-digests"),
    ("Can I customize my dashboard?", faq, "faq-dashboards"),
    ('"audienceType": "State government teams"', home, "jsonld"),
    ("Free preview: latest State Government Trends Insights Report", home, "home-preview"),
    ("Peer States", home, "home-peer"),
    ('class="badge">New', home, "home-badge"),
    ('class="badge">New', feat, "features-badge"),
    ('id="peer"', feat, "feat-peer"),
    ('id="quarterly"', feat, "feat-quarterly"),
    ("Saved views and filters", home, "home-saved"),
    ('id="for-agencies"', home, "agency-band"),
    ("See what other states are doing", home, "agency-headline"),
    ("Talk with the team", home, "agency-talk"),
]:
    if needle not in blob: print("MISSING", name, needle); bad+=1
rep=open(f"{OUT}/reports.html").read()
for needle, name in [
    ("Free preview: latest State Government Trends Insights Report", "reports-cta"),
    ('id="request-report"', "reports-form"),
    ("Example data only", "reports-example"),
    ("Vendor A", "reports-vendor"),
    ('id="req-name"', "reports-name"),
    ('id="req-org"', "reports-org"),
    ('id="req-role"', "reports-role"),
    ('id="req-type"', "reports-type"),
    (">Government<", "reports-gov-option"),
]:
    if needle not in rep: print("MISSING", name, needle); bad+=1
if "Free preview: latest State Government Trends Insights Report" not in pricing: print("MISSING pricing preview"); bad+=1
psoup=BeautifulSoup(pricing,"html.parser")
for tier in ["tier-1","tier-2","tier-3","tier-4"]:
    text=psoup.select_one("#"+tier).get_text(" ", strip=True)
    if "1 free FOIA request per year" not in text or "not monthly" not in text:
        print("MISSING annual foia note", tier); bad+=1
if "1 free FOIA request per year" in psoup.select_one("#trial").get_text(" ", strip=True):
    print("TRIAL includes free FOIA"); bad+=1
if "$150" not in psoup.select_one("#foia").get_text() or "parent company" not in psoup.select_one("#foia").get_text():
    print("MISSING foia addon"); bad+=1
foia=open(f"{OUT}/foia.html").read(); req=open(f"{OUT}/foia-request.html").read()
for needle in ["48 hours","Approve the draft","Request changes","parent company","$150","not monthly","data-plan=foia","foia-request.html","Tracking and status updates","status updates are provided to you on each FOIA request"]:
    if needle not in foia: print("MISSING foia page", needle); bad+=1
for needle in ["id=\"foia-name\"","id=\"foia-org\"","id=\"foia-email\"","id=\"foia-state\"","id=\"foia-agency\"","id=\"foia-records\"","id=\"foia-dates\"","id=\"foia-format\"","id=\"foia-notes\"","id=\"foia-membership\"","value=\"annual\"","value=\"paid\"","48 hours","Request changes","checkout-config.js"]:
    if needle not in req: print("MISSING foia form", needle); bad+=1
if 'href="foia.html"' not in feat or 'id="foia"' not in feat: print("MISSING features foia link"); bad+=1
if 'href="foia.html"' not in home: print("MISSING nav foia"); bad+=1
if "not monthly" not in faq or "48 hours" not in faq or "request changes" not in faq: print("MISSING faq foia"); bad+=1
if "request changes" not in open(f"{OUT}/js/main.js").read() or '"foia":' not in open(f"{OUT}/assets/js/checkout-config.js").read():
    print("MISSING foia script or checkout slot"); bad+=1
if "foia.html" not in open(f"{OUT}/sitemap.xml").read() or "foia-request.html" not in open(f"{OUT}/sitemap.xml").read():
    print("MISSING sitemap foia"); bad+=1
for wf in ["index.html","features.html","pricing.html","reports.html"]:
    wh=open(f"{OUT}/{wf}").read()
    if "Register interest" not in wh or "StateWatchPro%20quarterly%20webinar%20interest" not in wh or "trends and insights across state governments" not in wh:
        print("MISSING webinar", wf); bad+=1
if "quarterly webinar" not in faq: print("MISSING faq webinar"); bad+=1
trial_card=psoup.select_one("#trial").get_text(" ", strip=True)
if "are not included" not in trial_card or "Annual members only" not in trial_card:
    print("MISSING trial reporting exclusion"); bad+=1
if "Quarterly report and quarterly webinar included." in trial_card:
    print("TRIAL still includes report"); bad+=1
for tier in ["tier-1","tier-2","tier-3","tier-4"]:
    text=psoup.select_one("#"+tier).get_text(" ", strip=True)
    if "Annual members only" not in text or "quarterly webinar" not in text:
        print("MISSING annual reporting note", tier); bad+=1
if "every plan that includes the report" in pricing or "including the $399 trial" in pricing or "$399" in pricing or "30-day" in pricing:
    print("PRICING still says every plan for report"); bad+=1
if "$129" not in psoup.select_one("#trial").get_text() or "7 days" not in psoup.select_one("#trial").get_text():
    print("MISSING one-week trial price"); bad+=1
if "$1,999" not in psoup.select_one("#tier-1").get_text() or "$3,000" in pricing:
    print("MISSING per-user price"); bad+=1
if '"price": "1999"' not in pricing and '"price":"1999"' not in pricing:
    print("MISSING per-user structured price"); bad+=1
if "$399" in open(f"{OUT}/reports.html").read() or "30-day" in open(f"{OUT}/reports.html").read():
    print("REPORTS still has old trial"); bad+=1
if "$129" not in open(f"{OUT}/thank-you.html").read() or "one-week" not in open(f"{OUT}/thank-you.html").read():
    print("MISSING thank-you trial"); bad+=1
if "id=\"annual-only\"" not in pricing: print("MISSING annual-only section"); bad+=1
if "statewatchpro-trends-sample.pdf" not in open(f"{OUT}/assets/js/report-config.js").read(): print("MISSING preview url"); bad+=1
if not os.path.exists(f"{OUT}/assets/reports/statewatchpro-trends-sample.pdf"): print("MISSING pdf"); bad+=1
if os.path.exists(os.path.join(OUT, "CNAME")): print("UNEXPECTED CNAME"); bad+=1
if "servicers" in feat.lower() or "servicers" in home.lower(): print("TYPO servicers"); bad+=1
os.makedirs(SHOTS,exist_ok=True)
with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for name,vp,m in [("desktop",{"width":1440,"height":900},False),("mobile",{"width":390,"height":844},True)]:
        ctx=br.new_context(viewport=vp,device_scale_factor=2 if m else 1,is_mobile=m,has_touch=m); pg=ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e:errs.append(str(e)))
        for f in files:
            pg.goto(base+f,wait_until="networkidle"); ov=pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
            if ov>1: print("OVERFLOW",name,f,ov); bad+=1
        for f,n in [("","home"),("features.html","features"),("pricing.html","pricing"),("support.html","support")]:
            pg.goto(base+f,wait_until="networkidle"); pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(800); pg.screenshot(path=f"{SHOTS}/{n}-{name}.png",full_page=True)
        pg.goto(base+"pricing.html",wait_until="networkidle")
        for k in ["trial","per-user","5-user","10-user","enterprise","foia"]: assert pg.get_attribute(f"a[data-plan='{k}']","href").startswith("mailto:"), k
        pg.route("**/checkout-config.js*", lambda r: r.fulfill(content_type="application/javascript", body='window.SWP_CHECKOUT_LINKS={"trial":"https://buy.stripe.com/test_trial","5-user":"https://evil.example/x","foia":"https://buy.stripe.com/test_foia"};'))
        pg.goto(base+"pricing.html",wait_until="networkidle")
        assert pg.get_attribute("a[data-plan='trial']","href")=="https://buy.stripe.com/test_trial"
        assert pg.get_attribute("a[data-plan='foia']","href")=="https://buy.stripe.com/test_foia"
        assert pg.get_attribute("a[data-plan='per-user']","href").startswith("mailto:") and pg.get_attribute("a[data-plan='5-user']","href").startswith("mailto:")
        pg.goto(base+"foia-request.html",wait_until="networkidle")
        assert pg.is_hidden("#foia-pay")
        pg.select_option("#foia-membership","paid")
        assert pg.is_visible("#foia-pay") and pg.get_attribute("#foia-pay","href")=="https://buy.stripe.com/test_foia"
        pg.select_option("#foia-membership","annual")
        assert pg.is_hidden("#foia-pay")
        pg.unroute("**/checkout-config.js*")
        for f in ["thank-you.html","checkout-canceled.html"]: assert "noindex" in open(f"{OUT}/{f}").read() and f not in open(f"{OUT}/sitemap.xml").read()
        pg.goto(base,wait_until="networkidle"); assert pg.is_visible(".cb-btn"); pg.click(".cb-btn"); assert pg.is_visible("#cb-panel")
        assert "Automated assistant" in pg.inner_text("#cb-panel")
        pg.click(".cb-chips button >> nth=0"); pg.wait_for_timeout(200); assert "$1,999" in pg.inner_text(".cb-log") and "$129" in pg.inner_text(".cb-log") and "$150" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","which states are covered"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200); assert "Arkansas" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","zzqx unrelated"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200); assert pg.locator(".cb-log a[href='support.html']").count()>0
        pg.fill("#cb-in","can state government teams use it"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "agency licensing" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","what is cost reporting for state staff"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "what other states pay" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","what alerts can I set"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "amendments" in pg.inner_text(".cb-log") and "in-app" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","can I customize my dashboard"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "widgets" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","what is the quarterly trends report"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "Sample Edition" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","what is the quarterly webinar"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        wlast=pg.locator(".cb-log .cb-msg.bot").last.inner_text()
        assert "trends and insights" in wlast and "Annual members only" in wlast and "does not include" in wlast and "every plan" not in wlast and "reports.html#webinar" in pg.locator(".cb-log .cb-msg.bot").last.inner_html()
        pg.fill("#cb-in","what are peer states"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        assert "model bills" in pg.inner_text(".cb-log")
        pg.fill("#cb-in","how much does a foia request cost"); pg.press("#cb-in","Enter"); pg.wait_for_timeout(200)
        last=pg.locator(".cb-log .cb-msg.bot").last.inner_text()
        assert "request changes" in last and "48 hours" in last and "not monthly" in last and "$150" in last and "parent company" in last and "status updates" in last
        pg.goto(base+"foia-request.html",wait_until="networkidle")
        assert pg.is_hidden("#foia-pay")
        pg.fill("#foia-name","Ada Example"); pg.fill("#foia-org","Example Office"); pg.fill("#foia-email","ada@example.com")
        pg.fill("#foia-state","Arkansas"); pg.fill("#foia-agency","Example Agency"); pg.fill("#foia-records","Budget memos")
        pg.fill("#foia-dates","January 2024 to June 2024"); pg.select_option("#foia-format","Electronic"); pg.fill("#foia-notes","Please confirm receipt")
        pg.select_option("#foia-membership","annual")
        mail=pg.get_attribute("#foia-mail","href")
        assert mail.startswith("mailto:hello@statewatchpro.com") and "Ada%20Example" in mail and "Example%20Office" in mail and "Budget%20memos" in mail and "annual" in mail.lower() and "%24150" not in mail
        assert pg.is_hidden("#foia-pay")
        pg.select_option("#foia-membership","paid")
        mail=pg.get_attribute("#foia-mail","href")
        assert "%24150" in mail and "Example%20Agency" in mail and pg.is_hidden("#foia-pay")
        pg.goto(base+"reports.html",wait_until="networkidle")
        assert "statewatchpro-trends-sample.pdf" in pg.get_attribute("[data-report-preview]","href")
        pg.fill("#req-name","Ada Example"); pg.fill("#req-org","Example Office"); pg.fill("#req-role","Analyst"); pg.select_option("#req-type","Government")
        mail=pg.get_attribute("#req-mail","href")
        assert mail.startswith("mailto:hello@statewatchpro.com") and "Ada%20Example" in mail and "Example%20Office" in mail and "Analyst" in mail and "Government" in mail
        pg.route("**/report-config.js*", lambda r: r.fulfill(content_type="application/javascript", body="window.SWP_REPORT_PREVIEW_URL='';"))
        pg.goto(base,wait_until="networkidle")
        assert pg.get_attribute("[data-report-preview]","href").endswith("reports.html#request-report")
        pg.unroute("**/report-config.js*")
        pg.screenshot(path=f"{SHOTS}/chatbot-open-{name}.png"); pg.keyboard.press("Escape"); assert not pg.is_visible("#cb-panel")
        for f in files: assert 'href="support.html"' in open(f"{OUT}/{f}").read(), f
        if m:
            pg.click(".tog"); pg.wait_for_timeout(200); assert pg.is_visible("#nav a[href='faq.html']"); pg.screenshot(path=f"{SHOTS}/home-mobile-menu-open.png")
        if errs: print("JS",errs); bad+=1
        ctx.close()
    br.close()
print("pages:",len(files),"problems:",bad)
