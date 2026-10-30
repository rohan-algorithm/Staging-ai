#!/usr/bin/env python3
"""One-off generator for the guide pages added after the SEO audit (Oct 2026).
Writes what-is-virtual-staging.html, best-ai-virtual-staging-software.html and
virtual-staging-living-room.html from the shared landing-page shell.
Usage: python3 scripts/build-guides.py
"""
import html
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
S = 'https://roomgenix.com'
AUTHOR = {"@type": "Person", "@id": S + "/about#rohan", "name": "Rohan Rao", "url": S + "/about"}
ORG = {"@id": S + "/#organization", "@type": "Organization", "name": "RoomGenixAI", "url": S + "/"}

STYLE = """  <style>
    .pair-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0 8px; }
    .pair-grid figure { margin: 0; }
    .pair-grid img { width: 100%; height: auto; display: block; border-radius: 12px; }
    .pair-grid figcaption { margin-top: 8px; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted, #6b6560); }
    .legal-prose a.btn-primary { color: #fff !important; }
    .seo-related { margin-top: 32px; }
    @media (max-width: 640px) { .pair-grid { grid-template-columns: 1fr; } }
  </style>"""

NAV = """  <nav class="navbar">
    <div class="nav-container">
      <a href="/" class="nav-brand" aria-label="RoomGenixAI home">
        <img class="brand-mark" src="/assets/logo-mark.png" alt="" width="32" height="32">
        <span class="brand-name">RoomGenix<span class="brand-ai">AI</span></span>
      </a>
      <div class="nav-actions" style="margin-left:auto;">
        <a href="/" class="btn btn-outline btn-nav">← Home</a>
        <a href="/dashboard" class="btn btn-primary btn-nav">Open studio</a>
      </div>
    </div>
  </nav>"""


def pair(before, after, alt_before, alt_after, label='After'):
    def pic(name, alt):
        return (f'<picture><source type="image/webp" srcset="/assets/{name}-800.webp 800w, /assets/{name}.webp 1376w" '
                f'sizes="(max-width: 640px) 100vw, 50vw"><img src="/assets/{name}.jpg" alt="{html.escape(alt)}" '
                f'loading="lazy" width="1376" height="768"></picture>')
    return f"""          <div class="pair-grid">
            <figure>{pic(before, alt_before)}<figcaption>Before</figcaption></figure>
            <figure>{pic(after, alt_after)}<figcaption>{label}</figcaption></figure>
          </div>
          <p><small>Studio example, not a client listing.</small></p>"""


def faq_html(faqs):
    return '\n'.join(f'          <h3 class="q">{html.escape(q)}</h3>\n          <p>{html.escape(a)}</p>' for q, a in faqs)


def page(slug, title, desc, image, h1, intro, body, faqs, related, crumb, article=True):
    url = f'{S}/{slug}'
    assert len(title) <= 60, (slug, len(title))
    assert len(desc) <= 160, (slug, len(desc))
    graph = [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": title, "description": desc,
         "isPartOf": {"@id": S + "/#website"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": S + "/"},
            {"@type": "ListItem", "position": 2, "name": crumb, "item": url}]},
    ]
    if article:
        graph.append({"@type": "BlogPosting", "headline": h1, "datePublished": "2026-10-31", "dateModified": "2026-10-31",
                      "author": AUTHOR, "publisher": {"@id": S + "/#organization"}, "mainEntityOfPage": url,
                      "image": f'{S}/assets/{image}.jpg'})
    else:
        graph.append({"@type": "Service", "name": h1, "serviceType": "Virtual staging", "provider": ORG,
                      "areaServed": {"@type": "Country", "name": "United States"},
                      "offers": [{"@type": "Offer", "name": "Listing pass, 8 photos", "price": "19", "priceCurrency": "USD"},
                                 {"@type": "Offer", "name": "25 photos", "price": "49", "priceCurrency": "USD"},
                                 {"@type": "Offer", "name": "60 photos", "price": "99", "priceCurrency": "USD"}]})
    if faqs:
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    byline = ('\n        <p><small>By <a href="/about">Rohan Rao</a>, founder of RoomGenixAI · Published October 31, 2026</small></p>'
              if article else '')
    rel = '\n'.join(f'              <li><a href="{u}">{html.escape(t)}</a></li>' for u, t in related)
    t, d = html.escape(title), html.escape(desc)
    out = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title, quote=False)}</title>
  <meta name="description" content="{d}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#1c1915">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="{'article' if article else 'website'}">
  <meta property="og:title" content="{t}">
  <meta property="og:description" content="{d}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{S}/assets/{image}.jpg">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css?v=6.63">
{STYLE}
  <script type="application/ld+json">{ld}</script>
</head>
<body class="legal-page-body">
<!--email_off-->
{NAV}

  <main class="legal-page-content">
    <div class="container">
      <div class="legal-page-hero">
        <h1>{html.escape(h1)}</h1>
        <p>{intro}</p>{byline}
      </div>
      <article class="legal-card-standalone">
        <div class="legal-prose">
{body}
          <h2>Questions</h2>
{faq_html(faqs)}
          <div class="seo-related">
            <h2>Related</h2>
            <ul>
{rel}
            </ul>
          </div>
          <p><a class="btn btn-primary" href="/dashboard" style="color:#fff;">Try 3 free previews</a> &nbsp; <a class="btn btn-outline" href="/pricing">See pricing</a></p>
        </div>
      </article>
    </div>
  </main>
<!--/email_off-->
</body>
</html>
"""
    with open(os.path.join(ROOT, f'{slug}.html'), 'w') as f:
        f.write(out)
    print('wrote', slug)


# --- What is virtual staging -------------------------------------------------
page(
    'what-is-virtual-staging',
    'What Is Virtual Staging? A Guide for Agents | RoomGenixAI',
    'Virtual staging adds furniture to a photo of an empty room. How it works, what it costs, AI vs hand-edited, disclosure rules, and when it is the wrong tool.',
    'hero_coastal',
    'What is virtual staging?',
    'Virtual staging is adding furniture and decor to a photo of an empty room, digitally, so buyers browsing a listing can see how the space could be used. Nothing is delivered to the house. Only the photo changes.',
    f"""          <h2>The short version</h2>
          <p>A photographer shoots the vacant room as usual. Software or an editor then places a sofa, rug, bed, table or desk into that photo, sized to the room and lit to match. The listing shows the staged photo, usually next to the empty original, with a note that it was virtually staged.</p>
{pair('hero_empty', 'hero_coastal', 'Empty living room with floor-to-ceiling windows and wood floor', 'The same living room virtually staged with a white sectional, rug and coffee table')}
          <h2>Why agents use it</h2>
          <p>Empty rooms are hard to read in photos. It is difficult to judge whether a king bed fits, where a sofa would go, or whether a spare room works as an office. Furniture gives a sense of scale and purpose. Most buyers first see a home online, so the photos decide whether they book a showing. Virtual staging improves those photos without the cost and logistics of renting real furniture.</p>
          <h2>How it works</h2>
          <p>There are two main ways to do it:</p>
          <ul>
            <li><strong>Hand-edited virtual staging.</strong> A designer adds furniture by hand or with 3D models. Results can be very polished, but it usually costs tens of dollars per photo and takes a day or more.</li>
            <li><strong>AI virtual staging.</strong> Software generates the furniture in the photo, usually in a minute or two, for a few dollars or less per photo. Quality has improved fast, but results vary between tools, and some AI tools redraw the whole room instead of only adding furniture. That can move windows or change floors, which is a problem for a listing. <a href="/ai-staging-keeps-room-layout">How RoomGenixAI keeps the room layout</a> covers what to check.</li>
          </ul>
          <p>The <a href="/best-ai-virtual-staging-software">AI virtual staging software comparison</a> lists the main tools and how they charge.</p>
          <h2>What it costs</h2>
          <p>AI tools range from well under a dollar a photo on high-volume subscriptions to a few dollars a photo pay-as-you-go. RoomGenixAI is $2.99 a photo, or $19 for 8. Hand-edited services are often $20 to $30 or more per photo. Physical staging for a vacant home commonly runs from about a thousand dollars into several thousand. See <a href="/virtual-vs-physical-staging-cost">virtual vs physical staging cost</a> for a side-by-side table.</p>
          <h2>What you can and can't change</h2>
          <p>Adding furniture and decor to an empty room is the core use and is widely accepted when it's disclosed. Related edits, such as <a href="/virtual-staging-declutter">removing clutter</a> or turning a day shot into <a href="/virtual-twilight-real-estate-photos">twilight</a>, are also common but deserve the same disclosure. What you can't do is misrepresent the property: hide damage, remove permanent features like power lines, change the view, or make a room look bigger than it is.</p>
          <h2>Disclosure</h2>
          <p>Many MLS boards require virtually staged photos to be labeled, and some want the unstaged original in the listing too. In California, AB 723 has required disclosure and access to the original for digitally altered listing images since January 1, 2026. Rules differ by board and state, so check yours. <a href="/blog/is-virtual-staging-legal">Is virtual staging legal?</a> and the <a href="/mls-compliance">MLS photo rules</a> page go into more detail.</p>
          <h2>When virtual staging is the wrong tool</h2>
          <ul>
            <li>When most buyers will walk in from an open house rather than browse online first. Physical furniture is there in person; virtual furniture isn't.</li>
            <li>When the room has problems furniture would hide. Fix or disclose them instead.</li>
            <li>When the photo itself is poor. Staging can't fix a dark, crooked or blurry shot, so start with a good, level, well-exposed photo.</li>
          </ul>""",
    [("Is virtual staging the same as a 3D render?", "No. Virtual staging edits a real photo of the actual room. A 3D render builds the whole scene digitally, often before a home is finished."),
     ("Do buyers mind virtual staging?", "Buyers generally accept it when it is clearly labeled and the room itself is shown accurately. Problems come from undisclosed edits or photos that change the property."),
     ("How long does AI virtual staging take?", "With RoomGenixAI a photo is usually ready in a minute or two. Hand-edited services typically take a day or more."),
     ("Can I virtually stage an occupied home?", "Yes, by removing clutter or personal items first. That is still an altered image, so disclose it the same way.")],
    [('/virtual-vs-physical-staging-cost', 'Virtual vs physical staging cost'),
     ('/best-ai-virtual-staging-software', 'AI virtual staging software compared'),
     ('/blog/is-virtual-staging-legal', 'Is virtual staging legal?'),
     ('/virtual-staging-vacant-listings', 'Virtual staging for vacant listings'),
     ('/pricing', 'Pricing')],
    'What is virtual staging')

# --- Software comparison -----------------------------------------------------
TABLE_ROWS = [
    ('RoomGenixAI', 'Pay per photo or pack, no subscription', '$2.99 a photo; $19 for 8, $49 for 25, $99 for 60', '3 watermarked previews, no card', 'Built to add furniture to your photo, not redraw the room'),
    ('Virtual Staging AI', 'Monthly subscription', 'From $16/month (6 photos) to $79/month (150 photos)', 'Free editing trial', 'High volume at a low per-photo price'),
    ('REimagineHome', 'Monthly subscription', 'From about $19/month, higher tiers for more images', 'A few free designs', 'Many styles and redesign features'),
    ('Collov AI', 'Monthly subscription', 'From about $19/month for a set number of credits', 'Short watermarked trial', 'Teams staging many photos a month'),
    ('Apply Design', 'Pay per image', 'About $7 to $10 an image, less in batches', 'First image free', 'Occasional use with more manual control'),
    ('BoxBrownie', 'Pay per image, human editors', 'About $24 to $30 an image depending on region', 'None advertised', 'Hand-edited quality when time allows'),
]
rows = '\n'.join(f'                <tr><td><strong>{a}</strong></td><td>{b}</td><td>{c}</td><td>{d}</td><td>{e}</td></tr>' for a, b, c, d, e in TABLE_ROWS)
page(
    'best-ai-virtual-staging-software',
    'Best AI Virtual Staging Software (2026) | RoomGenixAI',
    'AI virtual staging tools compared on price model, cost per photo, free trial and best use: RoomGenixAI, Virtual Staging AI, REimagineHome, Collov, BoxBrownie.',
    'hero_scandinavian',
    'AI virtual staging software compared (2026)',
    "There are a lot of virtual staging tools now, and they charge in very different ways. This is a plain comparison of the common options. I make RoomGenixAI, so treat that line as the vendor's view and check the others yourself.",
    f"""          <h2>The comparison</h2>
          <div class="legal-table-wrapper">
            <table class="legal-table">
              <thead><tr><th>Tool</th><th>How you pay</th><th>Typical price</th><th>Free trial</th><th>Best for</th></tr></thead>
              <tbody>
{rows}
              </tbody>
            </table>
          </div>
          <p><small>Prices checked in October 2026 from vendor pricing pages where available and recent comparison sites otherwise. Vendors change prices and plans often, and some figures differ between sources, so confirm on each vendor's site before you buy.</small></p>
          <h2>Subscription or pay per photo?</h2>
          <p>This is the biggest difference between tools. A subscription is cheapest per photo if you use most of your monthly allowance every month, which suits photographers and busy teams. If you stage a few listings a month, or your volume goes up and down, you can end up paying for photos you don't use. Pay-per-photo tools cost more per image at high volume but nothing in a quiet month. RoomGenixAI is pay-per-photo, and its credits don't expire.</p>
          <h2>What to test before you choose</h2>
          <ul>
            <li><strong>Does the room stay the same?</strong> Run a before and after and compare windows, doors, floors and ceiling lines. Some AI tools redraw the room, which can misrepresent the property.</li>
            <li><strong>Is the furniture to scale?</strong> Oversized or tiny furniture makes a room look misleadingly large or small.</li>
            <li><strong>How many tries does a usable photo take?</strong> A cheap per-photo price matters less than the number of reruns you need.</li>
            <li><strong>What does it cost for your real month?</strong> Multiply your typical number of staged photos by each tool's actual price, including any unused subscription allowance.</li>
            <li><strong>Can you disclose easily?</strong> Most tools, RoomGenixAI included, don't stamp a label on the file. Plan how you'll label photos for your MLS.</li>
          </ul>
{pair('bedroom_empty', 'bedroom_farmhouse', 'Empty bedroom with herringbone wood floor and tall windows', 'The same bedroom staged in a farmhouse style with the windows and walls unchanged', 'After (RoomGenixAI)')}
          <h2>When a human editor is the better choice</h2>
          <p>Hand-edited services like BoxBrownie cost more and take longer, but a designer can handle unusual rooms, specific furniture requests and tricky lighting that AI tools still get wrong. For a high-end listing where one hero photo matters a lot, that can be worth it.</p>
          <h2>Where RoomGenixAI fits</h2>
          <p>RoomGenixAI is for agents and photographers who want a staged photo in a minute or two without a subscription, and who care that the room in the photo stays the room in the house. It stages living rooms, bedrooms, dining rooms, home offices and patios, plus <a href="/virtual-twilight-real-estate-photos">twilight</a> and <a href="/virtual-staging-declutter">decluttering</a>. It does not guarantee a perfect result on every render, so check each one. Try it on your own photos with 3 free previews and compare.</p>""",
    [("What is the cheapest AI virtual staging software?", "Per photo, high-volume subscriptions are usually cheapest if you use the full allowance. For a few listings a month, pay-per-photo tools such as RoomGenixAI often cost less overall."),
     ("Is AI virtual staging good enough for the MLS?", "It can be, if the room itself is unchanged, the furniture is to scale and the photo is disclosed according to your board's rules."),
     ("Is RoomGenixAI a subscription?", "No. You pay $2.99 a photo or buy a pack, and credits do not expire while your account is open."),
     ("Are these prices current?", "They were checked in October 2026. Vendors change prices often, so confirm on each vendor's site.")],
    [('/what-is-virtual-staging', 'What is virtual staging?'),
     ('/virtual-vs-physical-staging-cost', 'Virtual vs physical staging cost'),
     ('/ai-staging-keeps-room-layout', 'AI staging that keeps the room layout'),
     ('/pricing', 'RoomGenixAI pricing')],
    'AI virtual staging software')

# --- Living room ---------------------------------------------------------------
page(
    'virtual-staging-living-room',
    'Living Room Virtual Staging for Listings | RoomGenixAI',
    'Virtually stage an empty living room photo in a minute or two. Add a sofa, rug and coffee table while the walls, windows and floor stay as shot.',
    'hero_coastal',
    'Virtual staging for empty living rooms',
    'The living room is usually the first photo in a listing and the room buyers judge fastest. RoomGenixAI adds a sofa, rug, coffee table and a few accents to your photo of the empty room, and is built to keep the walls, windows and floor you shot.',
    f"""          <h2>Why stage the living room first</h2>
          <p>An empty living room photographs as a box of floor. Buyers can't tell whether a sectional fits, where the TV goes or how the room connects to the kitchen or dining area. A staged living room answers those questions in one image, which is why it is often the lead photo and the room most worth staging if you only stage one.</p>
{pair('hero_empty', 'hero_coastal', 'Empty living room with floor-to-ceiling windows and a light wood floor', 'The same living room staged with a white sectional, jute rug and glass coffee table')}
          <h2>What goes in</h2>
          <p>A typical living room stage includes a sofa or sectional, a coffee table, a large area rug, one or two accent chairs, a side table with a lamp and a plant or piece of art. The goal is a room that looks lived-in but still shows plenty of floor, so buyers see the space rather than the furniture.</p>
          <h2>Pick a style that fits the home</h2>
          <p>The same room can be staged in different styles. Compare a few on one photo and use the one that matches the finishes and likely buyer:</p>
{pair('hero_farmhouse', 'hero_scandinavian', 'The living room staged in a farmhouse style', 'The same living room staged in a Scandinavian style', 'Scandinavian')}
          <p>See <a href="/virtual-staging-modern">modern</a>, <a href="/virtual-staging-scandinavian">Scandinavian</a>, <a href="/virtual-staging-farmhouse">farmhouse</a>, <a href="/virtual-staging-coastal">coastal</a>, <a href="/virtual-staging-mid-century-modern">mid-century modern</a>, <a href="/virtual-staging-traditional">traditional</a> and <a href="/virtual-staging-luxury">luxury</a> for what each looks like.</p>
          <h2>Tips for a better result</h2>
          <ul>
            <li>Shoot from a corner or doorway at about chest height so the whole floor is visible.</li>
            <li>Keep verticals straight and exposure even. A dark or tilted photo stays dark or tilted after staging.</li>
            <li>For open-plan rooms, frame the living area clearly so the furniture lands in the right zone.</li>
            <li>Check doors, windows and fireplaces in the result. If something moved, run it again and don't list that file.</li>
          </ul>
          <h2>How to stage a living room</h2>
          <ol>
            <li><strong>Upload the photo of the empty room.</strong> JPG, PNG or WEBP, up to 10 MB.</li>
            <li><strong>Pick Stage, then Living room and a style.</strong></li>
            <li><strong>Review and download.</strong> Most photos are ready in a minute or two.</li>
          </ol>
          <h2>Disclosure and cost</h2>
          <p>Label virtually staged photos as your MLS and state require; RoomGenixAI doesn't stamp a label on the file. See <a href="/mls-compliance">MLS photo rules</a>. A new account gets 3 watermarked previews with no card. After that a photo is $2.99, or less in a pack: $19 for 8, $49 for 25 or $99 for 60. Every credit works for every style.</p>""",
    [("What furniture is added to a living room?", "Usually a sofa or sectional, coffee table, area rug, accent chair, side table with a lamp and a plant or art, sized to the room."),
     ("Can I stage an open-plan living and dining area?", "Yes. Frame the living zone clearly. You can also stage the dining area in a separate photo with the dining room option."),
     ("How much does it cost to stage a living room photo?", "$2.99 a photo, or less in a pack, after 3 free watermarked previews."),
     ("Do I have to label a virtually staged living room?", "Many MLSs require virtually staged photos to be labeled. Check your board's rules before you publish.")],
    [('/virtual-staging-bedroom', 'Virtual staging for bedrooms'),
     ('/virtual-staging-dining-room', 'Virtual staging for dining rooms'),
     ('/virtual-staging-modern', 'Modern virtual staging'),
     ('/virtual-staging-vacant-listings', 'Virtual staging for vacant listings'),
     ('/pricing', 'Pricing')],
    'Living room', article=False)
