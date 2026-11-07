from common import *
P = {}
AUD = [
 {"@type":"Audience","audienceType":"Consultants"},
 {"@type":"Audience","audienceType":"Consulting firms"},
 {"@type":"Audience","audienceType":"Vendors"},
 {"@type":"Audience","audienceType":"State government teams"},
]
SOFT = {"@context":"https://schema.org","@type":"SoftwareApplication","name":"StateWatchPro","applicationCategory":"BusinessApplication","operatingSystem":"Web",
 "description":"State government intelligence for consultants, consulting firms, vendors, and state government teams: RFPs out for bid, contract awards, bidders and winners, price benchmarks, legislation, policy manual and agency rule changes across U.S. states.",
 "audience":AUD,
 "url":BASE+"/","image":BASE+"/assets/og-image.png","offers":[{"@type":"Offer","name":"30-day trial","price":"399","priceCurrency":"USD","description":"30-day trial for 1 user covering every currently covered state; credited toward an annual plan bought within 30 days"},{"@type":"Offer","name":"Per user","price":"3000","priceCurrency":"USD","description":"Annual access for an individual user, billed annually"},{"@type":"Offer","name":"5-user bundle","price":"10000","priceCurrency":"USD","description":"Annual access for up to 5 users, billed annually"},{"@type":"Offer","name":"10-user bundle","price":"25000","priceCurrency":"USD","description":"Annual access for up to 10 users, billed annually"},{"@type":"Offer","name":"Enterprise","price":"35000","priceCurrency":"USD","description":"Enterprise license for up to 30 users, billed annually"}]}

DASH = '''<div class="mock" role="img" aria-label="Illustration of a StateWatchPro dashboard with out-for-bid, awards and watch-list panels (illustrative, not real data)">
<div class="mbar"><i></i><i></i><i></i><span>Executive dashboard · illustrative</span></div>
<div class="mgrid"><div class="mp"><b>Out for bid</b><div class="ln w80"></div><div class="ln w60"></div><div class="ln w70"></div></div>
<div class="mp"><b>Recent awards</b><div class="ln w70"></div><div class="ln w50"></div><div class="ln w65"></div></div>
<div class="mp wide"><b>Trends</b><svg viewBox="0 0 300 70" aria-hidden="true"><polyline fill="none" stroke="#22d3ee" stroke-width="3" points="0,60 40,50 80,54 120,36 160,40 200,24 240,28 300,10"/><polyline fill="none" stroke="#5eead4" stroke-width="2" stroke-dasharray="4 4" points="0,64 50,58 100,60 150,48 200,46 250,38 300,34"/></svg></div>
<div class="mp"><b>Rule &amp; policy changes</b><div class="ln w60"></div><div class="ln w75"></div></div>
<div class="mp"><b>Source provenance</b><div class="ln w55"></div><div class="ln w70"></div></div></div></div>'''

FEAT = [
 ("AI cross-state search","Ask in plain language across every state you follow. The AI flags recurring pain points and good ideas that carry over from one state to another, with links back to the source documents. State staff use it to compare what other states are doing.","ai-search"),
 ("Executive dashboards &amp; trends","One view of what's out for bid, what was just awarded, and how activity is trending, built for leaders who need the picture in minutes. State staff use it to follow trends across states.","dashboards"),
 ("Competitive landscape","Vendor capabilities, who appears to have the edge in a program area, and the differentiators that showed up in past bids and awards. State staff use it to compare how similar work shows up in other states.","competitive"),
 ("Bidder league table","See who bid and who won across solicitations, ranked so you can spot frequent competitors and likely teaming partners. State staff use it to see who has done similar work in other states.","league"),
 ("Insights","A running page of what's out for bid now, the emerging requirements in new solicitations, and what states pay. State staff use the price view as cost reporting on scope and price.","insights"),
 ("Proposal reference library","Past solicitations, amendments, Q&amp;A, and award documents organized for reuse when you write your next response.","library"),
 ("Standard executive reports","Repeatable reports for pipeline reviews and leadership briefings, so the same questions don't need to be rebuilt each week.","reports"),
 ("Collection status &amp; error logs","See when each source was last collected, what changed, and any collection errors, so you know how fresh your view is.","status"),
 ("Multi-state filtering","Filter every view to one state or any set of states that matches your territory or pursuit list.","filtering"),
 ("Source provenance on everything","Every record links back to where it came from, with the collection date, so findings can be checked before they go into a bid decision.","provenance"),
]
WATCH = [("RFPs &amp; solicitations","Opportunities out for bid, with amendments and deadlines."),("Contract awards","What was awarded, to whom, and when."),("Who bid, who won","Bidder lists and outcomes where states publish them."),
 ("Price benchmarks","What states have paid for comparable work, and how that work was scoped. State staff can use this as cost reporting."),("Legislation","Bills that can create, fund, or reshape programs."),("Program &amp; policy manuals","Manual and policy changes that shift requirements."),
 ("Rule changes","Administrative rules as they're proposed and adopted."),("News","State-level coverage that gives context to the documents.")]

P["index.html"] = ("StateWatchPro | State Government RFP &amp; Contract Intelligence",
 "StateWatchPro watches state governments for RFPs out for bid, contract awards, who bid and won, price benchmarks, legislation, policy manual and agency rule changes. For consultants, consulting firms, vendors, and state government teams.",
 f'''<section class="hero"><div class="wrap hgrid"><div><span class="eb">State government intelligence for consultants, firms, vendors &amp; state teams</span>
<h1>Win new state contracts. Protect the ones you hold.</h1>
<p class="lead">StateWatchPro tracks RFPs out for bid, contract awards, who bid and who won, what states pay, legislation, program and policy manual changes, rule changes, and news, with the source behind every record. One place for procurement and policy across all 50 states.</p>
<div class="acts">{DEMO()}{EARLY("btn btn-ghost light")}</div><p class="note">Arkansas comes first; the rest of the states follow in batches.</p></div><figure class="shot hero-shot"><img src="assets/screens/executive-dashboard.webp" alt="StateWatchPro executive dashboard, illustrative product view with example data" width="1600" height="900" fetchpriority="high"><figcaption>Illustrative product view with example data</figcaption></figure></div></section>
{sec("Two ways to win in state government", '<div class="grid2"><article class="card"><h3>Pursuing new bids</h3><p>Find opportunities early, size up competitors, and use price benchmarks to set pricing.</p><p><a href="use-cases.html#pursue">For bid pursuers &rarr;</a></p></article><article class="card"><h3>Already holding contracts</h3><p>Protect and grow what you have: watch agency rule, legislation, program and policy manual changes that affect your contracts, renewal and rebid timing, competitor moves, and expansion ideas from other states.</p><p><a href="use-cases.html#hold">For contract holders &rarr;</a></p></article></div>', "Built for consultants, consulting firms, and vendors who sell services to state governments.")}
{sec("Who it\u2019s for", cards([
 ("Consultants and consulting firms","Find state opportunities early, see who else is bidding, and bring cross-state context into the pursuits you lead. <a href=\"use-cases.html#pursue\">For bid pursuers &rarr;</a>"),
 ("Vendors","Pursue new state contracts and keep watch on the ones you hold: policy changes, rebid timing, and competitor moves. <a href=\"use-cases.html#hold\">For contract holders &rarr;</a>"),
 ("For state government teams","Compare what other states are doing, follow trends across states, and use cost reporting (what other states pay and how contracts are scoped) to reuse and adapt approaches that fit your state. <a href=\"use-cases.html#government\">State government use cases &rarr;</a>","for-government"),
 ]), "StateWatchPro serves the teams who sell to state governments, and the state government teams who need a clear view of their peers.", id_="audiences")}
{sec("The problem", checks(["State procurement is spread across 50 different portals, so it’s easy to miss when an RFP is posted, amended, or awarded.","Changes to laws, rules, program and policy manuals in each state are hard to track, and they can change the contracts you already hold.","There’s no single view of who bids, who wins, what states pay, and what new requirements are showing up.","Pain points and good ideas in one state often show up later in others, but nobody connects them."]), dark=True)}
{sec("What StateWatchPro watches", cards(WATCH,"grid4"), "One place for the signals that shape state contracting, instead of dozens of procurement portals, agency sites, and legislative trackers.")}
{sec("Built for the way bid and account teams work", cards([(a,b) for a,b,_ in FEAT[:6]]) + '<p class="more"><a href="features.html">See what each feature does and why it matters &rarr;</a></p>', dark=True)}
{sec("Digests, alerts, and your own dashboard", cards([
 ("Email digests and notifications","A digest of each saved search, and an email when a new opportunity matches, brings those matches to you. <a href=\"features.html#digests\">Email digests &rarr;</a>"),
 ("Alerts","Configurable alerts for new RFPs, amendments, deadlines, awards, renewals, and price or cost changes, delivered in-app and by email. <a href=\"features.html#alerts\">Alerts &rarr;</a>"),
 ("Customizable dashboards","Arrange widgets for your states, categories, pipeline, deadlines, trends, and cost comparisons, and save that view for yourself or your team. <a href=\"features.html#custom-dashboards\">Customizable dashboards &rarr;</a>"),
], "grid3"), "Hear about new opportunities and changes, and arrange the screen around the states and costs you follow.", id_="stay-current")}
{sec("From signal to decision", '<ol class="steps"><li><b>Collect</b><span>Public state sources are gathered on a schedule, with status and error logs.</span></li><li><b>Organize</b><span>Records are tagged by state, agency, program area, and type.</span></li><li><b>Analyze</b><span>AI search and dashboards surface patterns, competitors, and requirements.</span></li><li><b>Act</b><span>Use reports and the reference library to make bid/no-bid calls and write stronger responses.</span></li></ol><p class="more"><a href="coverage.html">How it works &amp; coverage &rarr;</a></p>')}
{sec("Trust what you read", checks(["Source link and collection date on every record","Per-state collection status, activity and error logs you can see","Polite collection that follows each site’s robots.txt rules and backs off when asked","No black-box numbers: price benchmarks trace to the documents they came from"]) + '<p class="more"><a href="provenance.html">Data &amp; provenance &rarr;</a></p>')}
{cta()}''', SOFT)

P["features.html"] = ("Features | StateWatchPro",
 "AI cross-state search, executive dashboards, competitive landscape, bidder league table, insights, proposal library, executive reports, collection logs, multi-state filters and source provenance.",
 hero("Features","Everything a bid and capture team needs to read the states","From the first signal of an opportunity to the debrief after award, StateWatchPro keeps the documents, the competitors, and the trends in one searchable place.")
 + sec("Find and understand", cards(FEAT[0:2]+FEAT[4:5]+FEAT[8:9],"grid2"), id_="find")
 + sec("Know the competition", cards(FEAT[2:4],"grid2"), dark=True, id_="compete")
 + sec("Write and report", cards(FEAT[5:7],"grid2"), id_="write")
 + sec("Trust the data", cards(FEAT[7:8]+FEAT[9:10],"grid2"), dark=True, id_="trust")
 + cta(), SOFT)

P["coverage.html"] = ("How It Works &amp; State Coverage | StateWatchPro",
 "How StateWatchPro collects public state procurement, award, legislative, policy manual and rule data. Arkansas first, then a polite backfill to all 50 states, then daily monitoring.",
 hero("How it works &amp; coverage","Arkansas first. Then all 50 states.","We start deep in one state so the data is right, then expand in batches. Here’s how collection works and where rollout stands.")
 + sec("How it works", '<ol class="steps"><li><b>Collect</b><span>Scheduled, polite collection from public state sources. It follows each site’s robots.txt rules, spaces out requests, and backs off when asked.</span></li><li><b>Record provenance</b><span>Each item keeps its source link and collection date, with activity and error logs.</span></li><li><b>Organize</b><span>Items are classified by state, agency, service category, and type.</span></li><li><b>Analyze &amp; alert</b><span>AI search, dashboards, league tables, insights, email digests, and alerts for new RFPs, amendments, deadlines, awards, renewals, and price or cost changes are built on the organized records.</span></li></ol>')
 + sec("Rollout plan", '<div class="road"><div class="ph now"><span class="tag">Step 1 · In progress</span><h3>Arkansas, in full</h3><p>Program and policy manuals, agency rules, and the first procurement pages are being collected now, with bids, awards, and legislation loading next.</p></div><div class="ph"><span class="tag">Step 2</span><h3>Remaining states</h3><p>A polite backfill of the remaining states in batches of five, scheduled overnight. Bid portals for all 50 states plus DC are already connected, and news covers every state.</p></div><div class="ph"><span class="tag">Step 3</span><h3>Daily monitoring</h3><p>Ongoing daily monitoring and change alerts across every covered state.</p></div></div><p class="note">Tell us which states matter most to you. It helps us plan the order.</p>', dark=True, id_="roadmap")
 + sec("Public data sources", checks(["Official state procurement and bid portals, award notices, and state contract lists","State legislature bill tracking","State administrative registers and rules","Agency program and policy manuals, policy documents, and transmittals","Public news feeds about state procurement","FOIA and public-records request guidance"]), id_="sources")
 + cta("Which states should come next?","Tell us your territory and the contracts you hold. Early-access members help shape the coverage order."))

P["use-cases.html"] = ("Use Cases for Consultants, Firms, Vendors &amp; State Teams | StateWatchPro",
 "How consultants, consulting firms, vendors, and state government teams use StateWatchPro to compare states, follow trends, review what states pay, win new contracts, and protect contracts they hold.",
 hero("Use cases","For consultants, firms, vendors, and state government teams","Whether you’re chasing a state contract, protecting one you hold, or working in state government, StateWatchPro shows what’s changing across states and what it costs.")
 + sec("Pursuing new bids", cards([("Find opportunities early","Track RFPs and solicitations across the states you target, including amendments and deadlines, so you see them while there’s still time to prepare."),
  ("Size up competitors","Review who bid and who won by service category, compare vendor capabilities, and see who appears to have the edge."),
  ("Set pricing with benchmarks","Use price benchmarks drawn from state documents to understand what states have paid for similar work."),
  ("Write stronger responses","Reference RFPs and proposals from other states and address emerging requirements early.")],"grid2"), "For consultants, firms, and vendors looking to win new state work.", id_="pursue")
 + sec("Already holding contracts", cards([("Watch changes that affect your contracts","Track agency rule, legislation, program and policy manual changes in the states where you deliver, before they surprise your team."),
  ("Plan for renewal and rebid","Keep an eye on renewal and rebid timing so you can prepare well before the next solicitation."),
  ("Track competitor moves","See which vendors are bidding and winning in your service areas, and where they’re expanding."),
  ("Find expansion ideas","Spot programs and good ideas in other states that match what you already deliver, and bring them to new states.")],"grid2"), "For incumbents who want to protect and grow their state contracts.", id_="hold")
 + sec("For state government teams", cards([
  ("Compare what other states are doing","Read solicitations, awards, legislation, and policy changes from other states side by side. Every record links back to its public source."),
  ("Follow trends across states","See how bidding, awards, and policy activity move across the states you select, instead of checking one portal at a time."),
  ("Cost reporting","See what other states pay and how contracts are scoped. Price benchmarks trace back to the documents they came from."),
  ("Insights you can reuse and adapt","Take approaches that show up in other states and adapt them to your own solicitations, policies, and programs."),
 ],"grid2"), "For state government employees who want a practical view of peer states.", dark=True, id_="government")
 + sec("Who uses it", cards([("Capture &amp; business development","Find and qualify the right pursuits."),("Proposal writers","See RFPs and responses from other states."),("Executives","Decide which bids to pursue and understand who wins and why."),("Account &amp; delivery leads","Stay ahead of policy changes and rebids on contracts you hold."),("Pricing analysts","Ground pricing in what states have paid."),("Consulting partners","Bring cross-state insight to state clients."),("State government teams","Compare peer states, follow cross-state trends, and review what others pay and how work is scoped before you draft a solicitation or update a policy.")]))
 + sec("Questions it helps answer", checks(["What’s out for bid in my states right now?","Who has won this kind of work before, and against whom?","What did the state pay last time?","Which rule, law, or manual changes affect the contracts we hold?","When is our contract up for renewal or rebid, and who might challenge us?","Which ideas from other states could expand our work?","What are other states paying for comparable work, and how is it scoped?","Which approaches from other states could we adapt?"]), dark=True)
 + cta(),
 {"@context":"https://schema.org","@type":"WebPage","name":"StateWatchPro use cases","url":BASE+"/use-cases.html","audience":AUD})

P["provenance.html"] = ("Data Sources &amp; Provenance | StateWatchPro",
 "Every StateWatchPro record links back to its public source with a collection date. See collection status and error logs, and how AI findings are tied to documents.",
 hero("Data &amp; provenance","Every finding traces back to its source","Bid decisions deserve evidence. StateWatchPro is built so you can always see where something came from and how fresh it is.")
 + sec("Our provenance principles", cards([("Source on every record","Each solicitation, award, rule, or news item links to the public page or document it came from."),("Collection dates","You can see when an item was collected and when its source was last checked."),("Visible status &amp; errors","Collection status and error logs show what ran, what changed, and what failed."),("AI with citations","AI search answers point to the underlying documents so you can verify before you act."),("Public sources, collected politely","Coverage is built from public state sources. Collection follows each site’s robots.txt rules, spaces out requests, and backs off when asked."),("Human judgment stays in charge","StateWatchPro organizes evidence. Your team makes the bid decision.")]))
 + sec("What we collect", cards(WATCH,"grid4"), dark=True)
 + cta())

P["pricing.html"] = ("Pricing | StateWatchPro",
 "StateWatchPro pricing: a $399 30-day trial, then annual plans from $3,000 per user, 5-user and 10-user bundles, and an Enterprise license for up to 30 users. State government teams can contact sales about agency licensing.",
 hero("Pricing","Pricing that fits your territory","Start with a $399 30-day trial, then choose an annual plan by team size: per user, 5-user and 10-user bundles, or an Enterprise license for up to 30 users.", f'<div class="acts">{DEMO()}{EARLY("btn btn-ghost light")}</div>') + sec("Plans", f'<div class="tiers"><div class="ph now" id="trial"><span class="tag">Start here</span><h3>30-day trial</h3><p class="price">$399</p><p>30 days of access for 1 user, covering every state currently in StateWatchPro. The $399 is credited toward an annual plan bought within 30 days of the trial.</p>{mailto("StateWatchPro 30-day trial","Start a 30-day trial").replace("<a ","<a data-plan=trial ",1)}</div><div class="ph" id="tier-1"><span class="tag">Annual</span><h3>Per user</h3><p class="price">$3,000</p><p class="per">per user per year</p><p>Annual access for an individual user.</p>{mailto("StateWatchPro per-user annual plan","Buy per-user plan","btn btn-ghost").replace("<a ","<a data-plan=per-user ",1)}</div><div class="ph" id="tier-2"><span class="tag">Annual</span><h3>5-user bundle</h3><p class="price">$10,000</p><p class="per">per year</p><p>Annual access for up to 5 users.</p>{mailto("StateWatchPro 5-user bundle annual plan","Buy 5-user bundle","btn btn-ghost").replace("<a ","<a data-plan=5-user ",1)}</div><div class="ph" id="tier-3"><span class="tag">Annual</span><h3>10-user bundle</h3><p class="price">$25,000</p><p class="per">per year</p><p>Annual access for up to 10 users.</p>{mailto("StateWatchPro 10-user bundle annual plan","Buy 10-user bundle","btn btn-ghost").replace("<a ","<a data-plan=10-user ",1)}</div><div class="ph" id="tier-4"><span class="tag">Annual</span><h3>Enterprise</h3><p class="price">$35,000</p><p class="per">per year</p><p>Enterprise license for up to 30 users.</p>{mailto("StateWatchPro Enterprise annual plan","Contact sales","btn btn-ghost").replace("<a ","<a data-plan=enterprise ",1)}</div></div>', id_="plans")
 + sec("Included with every plan", checks([
  "Email digests of saved searches, and an email when a new opportunity matches",
  "Configurable alerts for new RFPs, amendments, deadlines, awards, renewals, and price or cost changes, delivered in-app and by email",
  "Customizable dashboards: arrange widgets for your states, categories, pipeline, deadlines, trends, and cost comparisons, and save a view for yourself or your team",
  "The same product features on the $399 30-day trial, for 1 user and every state currently covered",
 ]), "Digests, alerts, and customizable dashboards are part of every plan, alongside AI search, trends, cost comparisons, and the rest of StateWatchPro.", id_="included")
 + sec("State government teams", '<p>State government teams can contact sales to ask about agency licensing. The trial price and the annual prices above are unchanged.</p><div class="acts">'+mailto("StateWatchPro agency licensing","Contact sales")+'</div>', id_="agency")
 + sec("What to tell us", checks(["Which states you bid in, follow, or plan to","How many users need access (to pick the right plan)","Which features matter most (for example AI search, alerts, dashboards, reports)","Whether you want to join early access while coverage expands","Whether you work in state government and want to ask about agency licensing"]))
 + cta("Questions about plans?","Email us and we’ll help you pick the right plan."), SOFT)

FAQ = [("What is StateWatchPro?","State government intelligence for consultants, consulting firms, vendors, and state government teams. It watches state RFPs and solicitations, contract awards, bidders and winners, price benchmarks, legislation, program and policy manual changes, rule changes, and news."),
 ("Which states are covered?","Arkansas comes first and is being collected now. Bid portals for all 50 states plus DC are connected and news covers every state; the remaining states are backfilled in batches of five, followed by daily monitoring and change alerts."),
 ("Who is it for?","Consultants, consulting firms, and vendors that sell services to state governments, both those pursuing new bids and those protecting and growing contracts they already hold. State government employees use it as well, to compare other states, follow trends, and review what peers pay and how work is scoped."),
 ("Can state government employees use StateWatchPro?","Yes. State government teams use it to compare what other states are doing, follow trends across states, see what other states pay and how contracts are scoped, and reuse insights they can adapt. Contact sales to ask about agency licensing."),
 ("Is agency licensing different from the listed prices?","Email sales to ask about agency licensing for a government team. The $399 trial and the annual plans stay as published. StateWatchPro is an independent product."),
 ("Does it help if we already hold a state contract?","Yes. Watch agency rule, legislation, program and policy manual changes that affect your contracts, track renewal and rebid timing and competitor moves, and find expansion ideas from other states."),
 ("Where does the data come from?","Publicly available state government sources. Every record keeps a link to its source and the date it was collected."),
 ("How does the AI search work?","You ask questions in plain language across the states you follow. It flags pain points and ideas that carry over between states and links to the documents behind each finding."),
 ("Can I filter to just my states?","Yes. Every view can be filtered to one state or any combination of states."),
 ("How do I know the data is current?","Collection status and error logs show when each source was last collected and whether anything failed."),
 ("How much does it cost?","A 30-day trial is $399 for 1 user and covers every state currently in StateWatchPro; it is credited toward an annual plan bought within 30 days. Annual plans are $3,000 per user per year, $10,000 per year for a 5-user bundle, $25,000 per year for a 10-user bundle, or $35,000 per year for an Enterprise license with up to 30 users. Email digests, alerts, and customizable dashboards are included on every plan."),
 ("Can I get email digests and alerts?","Yes. Saved searches can send an email digest, and you can get an email when a new opportunity matches. Alerts are configurable for new RFPs, amendments, deadlines, awards, renewals, and price or cost changes, and they are delivered in-app and by email."),
 ("Can I customize my dashboard?","Yes. Arrange widgets for your states, categories, pipeline, deadlines, trends, and cost comparisons, and save that view for yourself or your team."),
 ("How do I get access?","Request a demo or join the early-access list by email.")]
P["faq.html"] = ("FAQ | StateWatchPro","Answers about StateWatchPro for consultants, firms, vendors, and state government teams: coverage, alerts, email digests, dashboards, pricing, agency licensing, and access.",
 hero("FAQ","Frequently asked questions","Quick answers about coverage, data, and access.")
 + '<section class="sec"><div class="wrap faq">' + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q,a in FAQ) + '</div></section>' + cta(),
 {"@context":"https://schema.org","@type":"FAQPage","audience":AUD,"mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]})

P["contact.html"] = ("Request a Demo | StateWatchPro","Request a StateWatchPro demo or join the early-access list. Consultants, vendors, and state government teams can tell us which states they care about.",
 hero("Contact","Request a demo or join early access","Email us with the states you care about and what you'd like to see. We'll follow up to set up a walkthrough.", f'<div class="acts">{DEMO()}{EARLY("btn btn-ghost light")}</div><p class="note">Email: <a href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}">{EMAIL_USER}@{EMAIL_DOMAIN}</a></p>')
 + sec("Helpful to include", checks(["Whether you’re pursuing new bids, holding state contracts, working in state government, or a mix of these","The states you bid in, deliver in, or want to compare","The program areas you pursue or administer","Whether you'd like early access as new states come online","If you work in state government, whether you want to ask about agency licensing"])))

LEGAL = '<div class="flag" role="note"><b>Draft: pending legal review.</b> This text has not yet been reviewed by counsel.</div>'
P["privacy.html"] = ("Privacy Policy | StateWatchPro","How StateWatchPro handles information on this website.",
 hero("Legal","Privacy Policy","Last updated November 7, 2026.") + f'''<section class="sec"><div class="wrap prose">{LEGAL}
<h2>What this site collects</h2><p>This marketing website does not use forms, advertising trackers, or analytics cookies. If you email us, we receive your email address and whatever you include in the message.</p>
<h2>How we use it</h2><p>We use the information you send only to reply, arrange a demo, or manage early access. We don't sell personal information.</p>
<h2>Hosting</h2><p>The site is hosted on GitHub Pages, which may log basic technical data such as IP addresses for security and operations.</p>
<h2>The StateWatchPro application</h2><p>Use of the signed-in application is covered by separate terms provided to customers.</p>
<h2>Contact</h2><p>Questions: <a href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}">{EMAIL_USER}@{EMAIL_DOMAIN}</a>.</p></div></section>''')
P["terms.html"] = ("Terms of Use | StateWatchPro","Terms of use for the StateWatchPro website.",
 hero("Legal","Terms of Use","Last updated November 7, 2026.") + f'''<section class="sec"><div class="wrap prose">{LEGAL}
<h2>Use of this site</h2><p>This website describes the StateWatchPro product. Content is provided for general information and may change without notice.</p>
<h2>No advice</h2><p>Nothing on this site is legal, procurement, or financial advice. Verify information against the original state sources before relying on it.</p>
<h2>Intellectual property</h2><p>The StateWatchPro name, logo, and site content belong to their owner. Public government documents remain subject to their own terms.</p>
<h2>Limitation of liability</h2><p>The site is provided "as is" without warranties of any kind, to the extent permitted by law.</p>
<h2>Contact</h2><p><a href="mailto:{EMAIL_USER}@{EMAIL_DOMAIN}">{EMAIL_USER}@{EMAIL_DOMAIN}</a></p></div></section>''')
P["404.html"] = ("Page Not Found | StateWatchPro","The page you're looking for isn't here.",
 hero("404","We couldn't find that page","It may have moved. Try the home page or the features overview.", '<div class="acts"><a class="btn btn-primary" href="index.html">Home</a><a class="btn btn-ghost light" href="features.html">Features</a></div>'))

# ---- per-feature value sections (steering: what / why / outcome + screenshot slot) ----
CAP = "Illustrative product view with example data"
FV = [
 ("ai-search","AI cross-state search","ai-cross-state-search",
  "Search every state you follow in plain language. The AI groups results into patterns, flags recurring pain points, and highlights good ideas from one state that could carry over to another, each linked to its source. For state staff, it is a way to compare what other states are doing, with each finding linked to the source.",
  "Pain points and good ideas in one state often show up later in others, but nobody connects them. Reading 50 portals by hand doesn't scale. State staff run into the same problem when they need a peer comparison.",
  "Earlier insight into where a state is heading, and proposal themes grounded in what has already worked elsewhere, plus expansion ideas for the contracts you hold. State staff leave with comparisons they can adapt."),
 ("dashboards","Executive dashboards &amp; trends","executive-dashboard",
  "A single view of your pipeline: what's out for bid, upcoming deadlines, recent awards, and how solicitation activity and policy changes are trending over time. For state staff, the same view is how you follow trends across states.",
  "Leaders deciding which bids to pursue, and which contracts need attention, need the picture quickly, without waiting for someone to assemble it from many sources. State staff need that same picture when they are watching peer states.",
  "Faster, better-informed bid/no-bid decisions, and early warning on contracts you hold. State staff can see which way activity is moving before they rewrite a solicitation.", "trends"),
 ("competitive","Competitive landscape","competitive-landscape",
  "Compare vendor capabilities side by side, see who appears to have the edge in a service area, and review the differentiators that show up in bids and evaluations. For state staff, the comparison shows how similar work is scoped and which approaches show up in other states.",
  "Knowing who you're up against, and why they win, is central to new pursuits and to defending incumbent contracts at rebid. For state staff, the same comparison is a way to see how other states have structured the work.",
  "A sharper win strategy, and stronger positioning when your own contracts come up for rebid. State staff can borrow scope and evaluation patterns that already appear elsewhere."),
 ("league","Bidder league table","bidder-league-table",
  "Bidder and winner reports by service category and state: who bid, who won, and how outcomes compare across states, including where competitors are moving. For state staff, it shows who has taken on similar work in other states and how those awards compare.",
  "There's no single view of who bids and who wins across state markets. State staff can use that same view to see how often comparable work is awarded elsewhere.",
  "Better pursuit selection and earlier identification of competitors and teaming partners. State staff get a cross-state comparison of awards without assembling it by hand."),
 ("insights","Insights","insights",
  "What's out for bid, contract details, emerging requirements, and price benchmarks for what states pay, in one running page. For state staff, the price benchmarks are cost reporting: what other states pay and how the contracts are scoped.",
  "New requirements and pricing expectations show up in solicitations before they become common knowledge. State staff can read those same figures when they scope their own work.",
  "Pricing confidence and responses that address requirements before competitors notice them. State staff can reuse the cost and scope detail when they adapt an approach from another state."),
 ("library","Proposal reference library","proposal-library",
  "A library of RFPs, amendments, Q&amp;A, and proposals from other states that your team can reference.",
  "Proposal writers need to see how other states framed similar work and how vendors responded.",
  "Time saved on research and stronger, better-informed proposal drafts."),
 ("reports","Standard executive reports","dashboard",
  "Repeatable reports, including standard competitive-landscape reports, ready for leadership briefings and pipeline reviews.",
  "Rebuilding the same briefing every week takes time away from capture work.",
  "Consistent leadership briefings with less manual assembly."),
 ("status","Collection status &amp; error logs","collection-status",
  "A per-state collection status page plus activity and error logs show when each source was last collected, what changed, and what failed. Collection follows each site's robots.txt rules, spaces out requests, and backs off when asked.",
  "You can only trust intelligence if you know how fresh it is and where gaps exist.",
  "Confidence in what you're reading, and clear visibility into any gaps."),
 ("filtering","Filter by one or more states",None,
  "The state filter is a control in the header of every page. Choose one state or any combination, and the whole site follows it. State staff can limit the view to the peer states they want to compare.",
  "Most teams focus on a territory or a pursuit list, not all 50 states at once. A state team usually wants a peer set, not every state at once.",
  "Less noise, and views that match the markets you actually bid in or the states you want to learn from."),
 ("provenance","Source provenance on everything","provenance",
  "Every item shows its source and when it was collected, so findings can be checked against the original document.",
  "Bid decisions, proposal claims, and contract decisions need evidence that holds up.",
  "Decisions you can defend, backed by traceable public sources."),
 ("digests","Email digests and notifications",None,
  "Saved searches can send an email digest, and you can get an email when a new opportunity matches the states and categories you follow.",
  "A digest carries the matches from a saved search, which is practical when the work spans many states.",
  "Saved searches keep working when you are away from the product, and new opportunities show up by email.",
  ("panel","What you receive",["A digest of each saved search","An email when a new opportunity matches"])),
 ("alerts","Alerts",None,
  "Set alerts for new RFPs, amendments, deadlines, awards, renewals, and price or cost changes. Alerts are configurable, and they are delivered in-app and by email.",
  "A deadline, an amendment, or a change in what states pay can alter a bid, a contract, or a program plan.",
  "The people watching a state or a contract hear about the change in the product and by email.",
  ("panel","You can alert on",["New RFPs","Amendments","Deadlines","Awards","Renewals","Price or cost changes","Delivered in-app and by email"])),
 ("custom-dashboards","Customizable dashboards",None,
  "Arrange widgets for the states, categories, pipeline, deadlines, trends, and cost comparisons you care about. Save the layout for yourself or for your team.",
  "A capture lead, a pricing analyst, and a state program manager each open StateWatchPro with a different question.",
  "Each person gets a view built for their work, and a team can share one saved view.",
  ("panel","Arrange and save",["States and categories","Pipeline and deadlines","Trends","Cost comparisons","Saved per user or per team"])),
]
def shot(name, alt):
    if not name: return '<div class="filter-note"><b>Lives in the header of every page</b><p>Pick Arkansas, Texas, or any set of states once, and every dashboard, table, and search follows that selection.</p></div>'
    return f'<figure class="shot"><img src="assets/screens/{name}.webp" alt="{alt} — {CAP.lower()}" width="1600" height="900" loading="lazy"><figcaption>{CAP}</figcaption></figure>'
def panel(title, items):
    return f'<div class="filter-note"><b>{title}</b><ul class="checks">' + "".join(f"<li>{x}</li>" for x in items) + "</ul></div>"
def fsec(i, x):
    id_, t, img, what, why, out = x[:6]
    extra = ""
    if len(x) > 6 and isinstance(x[6], tuple) and x[6] and x[6][0] == "panel":
        media = panel(x[6][1], x[6][2])
    else:
        media = shot(img, t)
        extra = shot(x[6], t) if len(x) > 6 else ""
    body = f'<div class="fv-text"><span class="eb dk">Feature {i+1}</span><h2>{t}</h2><h3>What it does</h3><p>{what}</p><h3>Why it matters</h3><p>{why}</p><h3>Outcome</h3><p class="out">{out}</p></div><div class="fv-media">{media}{extra}</div>'
    return f'<section class="sec fv{" dark" if i%2 else ""}" id="{id_}"><div class="wrap fvg{" rev" if i%2 else ""}">{body}</div></section>'
P["features.html"] = ("Features | StateWatchPro",
 "What each StateWatchPro feature does, why it matters to consultants, firms, vendors, and state staff, and the outcome it supports: comparison, trends, cost reporting, email digests, alerts, and customizable dashboards.",
 hero("Features","What each feature does, and why it matters","StateWatchPro brings procurement (bids, awards, bidders, pricing) and policy (legislation, rules, manuals, news) into one place, for teams pursuing new state bids, for those protecting contracts they already hold, and for state staff comparing other states.",
  '<nav class="jump" aria-label="Features on this page">' + "".join(f'<a href="#{x[0]}">{x[1]}</a>' for x in FV) + '</nav>')
 + "".join(fsec(i,x) for i,x in enumerate(FV)) + cta(), SOFT)

SFAQ=[("How do I get help?","Email hello@statewatchpro.com with a short description of what you need. Include the page and state involved if it’s about data."),
("How do I add or change users?","Email us with the names and number of seats you need. Seats depend on your plan: per user, 5-user, 10-user, or Enterprise (up to 30 users)."),
("Does the trial convert automatically?","No. The $399 trial covers 1 user for 30 days and is credited toward an annual plan bought within 30 days. Email us to choose a plan."),
("Where does a record come from?","Every item shows its source link and collection date. Open the source to check the original document."),
("I found an error in the data. What should I do?","Email us using the subject line ‘Data issue’ with the record, the state, the source link, and what looks wrong.")]
P["support.html"] = ("Customer Support | StateWatchPro","Get help with StateWatchPro: getting started, accounts and seats, trial and billing, data and sources, and reporting a data issue.",
 hero("Customer support","How can we help?","Answers to common questions, and how to reach us when you need more.", f'<div class="acts">{mailto("StateWatchPro support request","Email support")}</div><p class="note">Support email: hello@statewatchpro.com (placeholder address, pending confirmation).</p>')
 + sec("Get help", cards([("Email us","Send questions to <a href=\"mailto:hello@statewatchpro.com?subject=StateWatchPro%20support%20request\">hello@statewatchpro.com</a> (placeholder address). We’ll reply as soon as we can.","get-help"),
   ("Getting started","After your access is set up, pick your states with the state filter in the page header, then explore the executive dashboard, Insights, and AI cross-state search.","getting-started"),
   ("Accounts &amp; seats","Plans are per user, 5-user bundle, 10-user bundle, or Enterprise for up to 30 users. Email us to add, remove, or change users.","accounts"),
   ("Trial &amp; billing","The $399 30-day trial covers 1 user and every state currently covered, and is credited toward an annual plan bought within 30 days. Annual plans: $3,000 per user, $10,000 for 5 users, $25,000 for 10 users, $35,000 Enterprise (up to 30 users).","billing"),
   ("Data &amp; sources","Data comes from public state sources. Every item shows its source and collection date, and the collection status page shows freshness and errors by state.","data"),
   ("Report a data issue",f'{mailto("Data issue","Report a data issue","card-link")} Include the record, the state, the source link, and what looks wrong.',"report")]))
 + sec("Help topics", '<div class="faq">' + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q,a in SFAQ) + '</div>', dark=True, id_="topics"),
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in SFAQ]})

P["thank-you.html"] = ("Thank You | StateWatchPro","Thanks for your StateWatchPro purchase.",
 hero("Thank you","Thanks — your order is confirmed","You’ll receive a receipt by email. We’ll be in touch to set up your access. Questions? See Customer support.", '<div class="acts"><a class="btn btn-primary" href="support.html">Customer support</a><a class="btn btn-ghost light" href="index.html">Back to home</a></div>'))
P["checkout-canceled.html"] = ("Checkout Canceled | StateWatchPro","Your StateWatchPro checkout was canceled.",
 hero("Checkout canceled","Your checkout was canceled","No payment was taken. You can return to pricing whenever you’re ready, or email us with questions.", f'<div class="acts"><a class="btn btn-primary" href="pricing.html">Back to pricing</a>{mailto("StateWatchPro pricing question","Email us","btn btn-ghost light")}</div>'))
