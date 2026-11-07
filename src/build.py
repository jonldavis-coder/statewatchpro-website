#!/usr/bin/env python3
"""Build the StateWatchPro static site into the repo root (parent of src/).

Canonical URLs stay on the github.io base from common.BASE. A CNAME file is
written only when SWP_BASE is the custom domain, which this build does not set.
"""
import os, sys, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image, ImageDraw, ImageFont
from common import page, BASE
from pages import P
ROOT = os.path.dirname(HERE)
OUT = os.environ.get("SWP_OUT", ROOT)
CSS = r"""
:root{--navy:#0b1f3a;--navy2:#0f2a4f;--navy3:#163a66;--teal:#0e7490;--cyan:#22d3ee;--ink:#0b1426;--mut:#475569;--soft:#f3f8fb;--r:14px}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:#fff}
img{max-width:100%;height:auto}a{color:var(--teal)}h1,h2,h3{line-height:1.2;color:var(--navy)}h1{font-size:clamp(2rem,4.5vw,3.2rem);margin:.4rem 0 1rem}h2{font-size:clamp(1.5rem,3vw,2.1rem);margin:0 0 1rem}
.wrap{max-width:1180px;margin:0 auto;padding:0 1.25rem}.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;z-index:999;background:#fff;padding:.5rem 1rem}
:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
.hdr{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #e2e8f0}.nav{display:flex;align-items:center;justify-content:space-between;min-height:72px;gap:1rem}
.brand img{display:block;height:52px;width:auto}.links{list-style:none;display:flex;align-items:center;gap:.15rem;margin:0;padding:0}
.links a{display:block;padding:.5rem .6rem;border-radius:8px;text-decoration:none;color:var(--navy);font-weight:500;font-size:.93rem}.links a:hover,.links a[aria-current]{background:var(--soft);color:var(--teal)}
.links .btn{color:#fff;margin-left:.3rem}.tog{display:none;background:none;border:0;padding:.6rem;cursor:pointer}.tog span{display:block;width:24px;height:2px;background:var(--navy);margin:5px 0}
.btn{display:inline-block;padding:.8rem 1.3rem;border-radius:10px;font-weight:600;text-decoration:none;border:2px solid transparent}.btn.sm{padding:.55rem 1rem}
.btn-primary{background:linear-gradient(135deg,#0e7490,#0891b2);color:#fff}.btn-primary:hover{filter:brightness(1.1)}.btn-ghost{border-color:var(--teal);color:var(--teal)}.btn-ghost.light{border-color:var(--cyan);color:#e0faff}
.hero{background:radial-gradient(1000px 500px at 85% 0%,rgba(34,211,238,.18),transparent),linear-gradient(160deg,var(--navy),var(--navy3));color:#dbe7f3;padding:4.5rem 0}.hero h1{color:#fff}.hero.sub{padding:3.5rem 0}
.hgrid{display:grid;grid-template-columns:1.05fr 1fr;gap:3rem;align-items:center}.eb{display:inline-block;color:var(--cyan);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem}
.lead{font-size:1.13rem;max-width:62ch}.sec .lead{color:var(--mut)}.acts{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:1.5rem}.note{font-size:.92rem;opacity:.85;margin-top:1rem}.hero a{color:var(--cyan)}.hero .btn-primary{color:#fff}
.mock{background:#0a1a33;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:1rem;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}.mbar{display:flex;gap:6px;align-items:center;margin-bottom:.8rem;font-size:.75rem;color:#94a3b8}.mbar i{width:10px;height:10px;border-radius:50%;background:#1e3a5f}.mbar span{margin-left:.5rem}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.mp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.8rem}.mp.wide{grid-column:1/-1}.mp b{display:block;font-size:.8rem;color:#e2e8f0;margin-bottom:.5rem}
.ln{height:8px;border-radius:4px;background:linear-gradient(90deg,rgba(34,211,238,.6),rgba(34,211,238,.15));margin:.4rem 0}.w50{width:50%}.w55{width:55%}.w60{width:60%}.w65{width:65%}.w70{width:70%}.w75{width:75%}.w80{width:80%}
.sec{padding:4rem 0}.sec.dark{background:var(--soft)}.grid2,.grid3,.grid4{display:grid;gap:1.2rem}.grid2{grid-template-columns:repeat(2,1fr)}.grid3{grid-template-columns:repeat(3,1fr)}.grid4{grid-template-columns:repeat(4,1fr)}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:var(--r);padding:1.4rem;border-top:4px solid var(--cyan);scroll-margin-top:90px}.card h3{margin:0 0 .5rem;font-size:1.1rem}.card p{margin:0;color:var(--mut)}
.more{margin-top:1.5rem;font-weight:600}.steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem;counter-reset:s}
.steps li{counter-increment:s;background:#fff;border:1px solid #e2e8f0;border-radius:var(--r);padding:1.4rem}.steps li::before{content:counter(s);display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--navy);color:var(--cyan);font-weight:700;margin-bottom:.6rem}.steps b{display:block;color:var(--navy)}.steps span{color:var(--mut)}
.checks{list-style:none;padding:0}.checks li{padding:.4rem 0 .4rem 2rem;position:relative}.checks li::before{content:"";position:absolute;left:0;top:.75rem;width:18px;height:10px;border-left:3px solid var(--teal);border-bottom:3px solid var(--teal);transform:rotate(-45deg)}
.road{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem}.ph{background:#fff;border:1px solid #e2e8f0;border-radius:var(--r);padding:1.4rem}.ph.now{border:2px solid var(--teal)}.tag{font-size:.75rem;font-weight:700;text-transform:uppercase;color:var(--teal)}
.cta{background:linear-gradient(135deg,var(--navy),var(--navy3));color:#dbe7f3;border-radius:20px;padding:2.5rem;text-align:center}.cta h2{color:#fff}.cta .acts{justify-content:center}
.faq details{border:1px solid #e2e8f0;border-radius:12px;padding:1rem 1.2rem;margin-bottom:.8rem}.faq summary{font-weight:600;cursor:pointer;color:var(--navy)}
.prose{max-width:760px}.flag{background:#fff7e6;border:1px solid #f5c26b;border-radius:10px;padding:1rem;margin-bottom:1.5rem}
.ftr{background:var(--navy);color:#b6c6d8;padding:3rem 0 1.5rem}.ftr a{color:#dbe7f3}.ftr h2{color:#fff;font-size:1rem}.ftr ul{list-style:none;padding:0}.ftr li{margin:.35rem 0}.fgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2rem}.ftr img{height:52px;width:auto}.fbot{border-top:1px solid rgba(255,255,255,.1);margin-top:2rem;padding-top:1rem;font-size:.85rem}
@media(max-width:1100px){.links a{padding:.45rem .4rem;font-size:.86rem}}
@media(max-width:980px){.tog{display:block}.links{display:none;position:absolute;top:72px;left:0;right:0;background:#fff;flex-direction:column;align-items:stretch;padding:1rem;border-bottom:1px solid #e2e8f0}.links.open{display:flex}.links a{font-size:1rem;padding:.75rem}.links .btn{margin:.5rem 0 0;text-align:center}
.hgrid,.grid2,.grid3,.road{grid-template-columns:1fr}.grid4,.steps{grid-template-columns:1fr 1fr}.fgrid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.grid4,.steps,.fgrid{grid-template-columns:1fr}.hero{padding:3rem 0}.sec{padding:3rem 0}.brand img{height:44px}.mgrid{grid-template-columns:1fr}}
.price{font-size:2rem;font-weight:800;color:var(--navy);margin:.2rem 0}.ph .btn{margin-top:.6rem}
.fvg{display:grid;grid-template-columns:1fr 1.15fr;gap:2.5rem;align-items:center}.fvg.rev .fv-text{order:2}.fv{scroll-margin-top:80px}.fv h3{font-size:1rem;margin:1rem 0 .2rem;color:var(--teal)}.fv p{margin:0;color:var(--mut)}.fv .out{color:var(--navy);font-weight:600}.eb.dk{color:var(--teal)}
.shot{margin:0 0 1rem}.shot img{display:block;border-radius:12px;border:1px solid #cbd5e1;box-shadow:0 20px 40px -20px rgba(11,31,58,.45)}.shot figcaption{font-size:.8rem;color:var(--mut);margin-top:.4rem}.hero .shot figcaption{color:#9fb3c8}.hero-shot img{border-color:rgba(255,255,255,.15)}
.ph-slot div{aspect-ratio:16/9;display:grid;place-items:center;border:2px dashed #94a3b8;border-radius:12px;color:var(--mut);background:#fff}
.jump{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.5rem}.jump a{font-size:.85rem;padding:.35rem .75rem;border:1px solid rgba(34,211,238,.5);border-radius:999px;text-decoration:none;color:#e0faff}
@media(max-width:980px){.fvg{grid-template-columns:1fr}.fvg.rev .fv-text{order:0}}
.tiers{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem}.tiers .ph{display:flex;flex-direction:column}.tiers .btn{margin-top:auto}.per{font-size:.85rem;color:var(--mut);margin:0 0 .5rem}@media(max-width:1100px){.tiers{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.tiers{grid-template-columns:1fr}}
.cb-btn{position:fixed;right:20px;bottom:20px;z-index:200;width:60px;height:60px;border-radius:50%;border:0;background:linear-gradient(135deg,#0e7490,#0891b2);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 25px -5px rgba(11,31,58,.5)}
.cb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.cb-panel{position:fixed;right:20px;bottom:92px;z-index:200;width:min(380px,calc(100vw - 24px));max-height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;border:1px solid #cbd5e1;border-radius:16px;box-shadow:0 25px 50px -12px rgba(11,31,58,.45);overflow:hidden}.cb-panel[hidden]{display:none}
.cb-head{display:flex;justify-content:space-between;gap:.5rem;background:var(--navy);color:#fff;padding:.8rem 1rem}.cb-head small{display:block;color:#9fb3c8;font-size:.75rem}.cb-x{background:none;border:0;color:#fff;font-size:1.6rem;cursor:pointer;line-height:1}
.cb-log{flex:1;overflow-y:auto;padding:.8rem;display:flex;flex-direction:column;gap:.5rem;min-height:140px}.cb-msg{padding:.6rem .8rem;border-radius:12px;font-size:.9rem;max-width:90%}.cb-msg.bot{background:var(--soft);color:var(--ink)}.cb-msg.me{background:var(--teal);color:#fff;align-self:flex-end}
.cb-chips{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:.35rem;padding:0 .8rem .6rem}.cb-chips button{flex:0 0 auto;white-space:nowrap;font:inherit;font-size:.78rem;border:1px solid var(--teal);color:var(--teal);background:#fff;border-radius:999px;padding:.3rem .6rem;cursor:pointer}
.cb-form{display:flex;border-top:1px solid #e2e8f0}.cb-form input{flex:1;border:0;padding:.8rem;font:inherit;min-width:0}.cb-form button{border:0;background:var(--teal);color:#fff;padding:0 1rem;font:inherit;font-weight:600;cursor:pointer}
@media(max-width:560px){.cb-panel{right:12px;bottom:84px}.cb-btn{right:12px;bottom:12px}}
.filter-note{border:1px solid #cbd5e1;border-left:4px solid var(--cyan);border-radius:12px;padding:1.4rem;background:#fff}.filter-note b{color:var(--navy)}.filter-note p{margin:.4rem 0 0}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
"""
JS = """(()=>{const L=window.SWP_CHECKOUT_LINKS||{};document.querySelectorAll("a[data-plan]").forEach(a=>{const u=(L[a.dataset.plan]||"").trim();if(/^https:\\/\\/(buy|checkout)\\.stripe\\.com\\//.test(u)){a.href=u;a.dataset.checkout="stripe"}})})();
(()=>{const t=document.querySelector('.tog'),n=document.getElementById('nav');if(t)t.addEventListener('click',()=>{const o=n.classList.toggle('open');t.setAttribute('aria-expanded',o);t.setAttribute('aria-label',o?'Close menu':'Open menu')});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&n.classList.contains('open')){n.classList.remove('open');t.setAttribute('aria-expanded','false');t.focus()}})})();"""
def assets():
    os.makedirs(f"{OUT}/assets", exist_ok=True); os.makedirs(f"{OUT}/css", exist_ok=True); os.makedirs(f"{OUT}/js", exist_ok=True)
    logo = Image.open(f"{HERE}/logo-crop.png").convert("RGB")
    for n in ["statewatchpro-logo-transparent","statewatchpro-logo-white-transparent"]:
        im = Image.open(f"{HERE}/brand/{n}.png"); h=120; im.resize((round(im.width*h/im.height),h), Image.LANCZOS).save(f"{OUT}/assets/{'logo' if 'white' not in n else 'logo-white'}.png", optimize=True)
    for n in ["statewatchpro-logo.svg","statewatchpro-logo-white.svg"]: shutil.copy(f"{HERE}/brand/{n}", f"{OUT}/assets/{n}")
    pre = os.path.join(HERE, "prebuilt")
    icons = ["icon-192.png","icon-512.png","apple-touch-icon.png","favicon.ico"]
    if all(os.path.exists(os.path.join(pre, n)) for n in icons):
        for n in icons: shutil.copy(os.path.join(pre, n), os.path.join(OUT, n))
    else:
        icon_src = next((p for p in (os.path.join(HERE, "brand", "statewatchpro-icon.jpg"), "/workspace/statewatchpro/statewatchpro-icon.jpg") if os.path.exists(p)), None)
        if not icon_src: raise SystemExit("missing icon source: add src/prebuilt icons or brand/statewatchpro-icon.jpg")
        icon = Image.open(icon_src).convert("RGB")
        for n,s in [("icon-192.png",192),("icon-512.png",512),("apple-touch-icon.png",180)]: icon.resize((s,s), Image.LANCZOS).save(f"{OUT}/{n}")
        icon.resize((48,48)).save(f"{OUT}/favicon.ico", sizes=[(16,16),(32,32),(48,48)])
    og_pre = os.path.join(pre, "og-image.png")
    if os.path.exists(og_pre):
        shutil.copy(og_pre, f"{OUT}/assets/og-image.png")
    else:
        og = Image.new("RGB",(1200,630),(255,255,255)); L = logo.resize((915,300), Image.LANCZOS); og.paste(L,(150,110))
        d = ImageDraw.Draw(og)
        try: f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 38)
        except Exception: f = ImageFont.load_default()
        d.rectangle((0,560,1200,630), fill=(11,31,58)); t="State government intelligence for bid & capture teams"
        w = d.textlength(t, font=f); d.text(((1200-w)/2,572), t, fill=(34,211,238), font=f); og.save(f"{OUT}/assets/og-image.png", optimize=True)
def prepare_out():
    """Publish in place when OUT is the repo. Never delete src/ or .git."""
    os.makedirs(OUT, exist_ok=True)
    out, here = os.path.abspath(OUT), os.path.abspath(HERE)
    if out == os.path.abspath(ROOT) or here.startswith(out + os.sep) or os.path.isdir(os.path.join(out, ".git")):
        return
    shutil.rmtree(out); os.makedirs(OUT)
def main():
    prepare_out(); assets()
    screen_dest = f"{OUT}/assets/screens"
    if os.path.exists(screen_dest): shutil.rmtree(screen_dest)
    shutil.copytree(f"{HERE}/screens", screen_dest)
    open(f"{OUT}/css/styles.css","w").write(CSS.strip()); open(f"{OUT}/js/main.js","w").write(JS + "\n" + open(f"{HERE}/chatbot.js").read())
    for f,(t,d,b,*ld) in P.items():
        html = page(f,t,d,b,ld[0] if ld else None, noindex=(f in ("404.html","thank-you.html","checkout-canceled.html")))
        if f=="404.html": html = html.replace("<head>", '<head>\n<base href="'+("/" if "statewatchpro.com" in BASE else "/statewatchpro-website/")+'">',1)
        open(f"{OUT}/{f}","w").write(html)
    urls = [f for f in P if f not in ("404.html","thank-you.html","checkout-canceled.html")]
    open(f"{OUT}/sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{BASE}/{'' if u=='index.html' else u}</loc><lastmod>2026-11-07</lastmod></url>\n" for u in urls) + "</urlset>\n")
    open(f"{OUT}/robots.txt","w").write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
    open(f"{OUT}/site.webmanifest","w").write('{"name":"StateWatchPro","short_name":"StateWatchPro","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"}],"theme_color":"#0b1f3a","background_color":"#ffffff","display":"standalone"}')
    open(f"{OUT}/.nojekyll","w").write("")
    if "statewatchpro.com" in BASE: open(f"{OUT}/CNAME","w").write("statewatchpro.com\n")
    os.makedirs(f"{OUT}/assets/js", exist_ok=True); shutil.copy(f"{HERE}/checkout-config.js", f"{OUT}/assets/js/checkout-config.js")
    shutil.copy(f"{HERE}/README.md", f"{OUT}/README.md")
    print("built", len(P), "pages")
main()
