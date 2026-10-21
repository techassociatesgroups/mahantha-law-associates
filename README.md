# Mahantha Law Associates — website

A static site (HTML, CSS and a little JavaScript), so it needs no build step and can go on any host (Netlify, Vercel, GitHub Pages, cPanel).

## Before going live: replace these placeholders

The phone and WhatsApp number (+91 99945 24102) is already set; to change it, find-and-replace `919994524102` and `99945 24102` across every file (including `js/main.js`). Replace these placeholders:

| Placeholder | Replace with | Where |
|---|---|---|
| `https://www.example.com` | Your real domain | all `.html` files, `robots.txt`, `sitemap.xml` |

Also check:
- **Office hours** (Mon–Sat, 10 am–7 pm) and **practice areas** match what the firm actually offers.
- **Local SEO:** add the city to the `<title>`, the meta description and the hero heading (for example "…Advocate in Mysuru"). Then create a Google Business Profile with the same name, address and phone number.

## Lead generation
- Call and WhatsApp buttons appear in the header, the hero, the contact section and the footer. On phones there is also a fixed Call / WhatsApp bar; on desktop, a floating WhatsApp button.
- Every practice area has its own WhatsApp link with a prefilled message about that area.
- The contact form doesn't need a server. It opens WhatsApp with the visitor's name, phone number, matter type and details already filled in.
- Every call and WhatsApp click is pushed to `window.dataLayer` as a `lead_click` event, so you can count leads after adding Google Tag Manager or GA4.

## Compliance
Under Bar Council of India rules, advocates may not advertise or solicit work. The first-visit disclaimer popup has been replaced by a consultation prompt at the owner's request. The disclaimer is still stated in the footer, linked from the consultation prompt, and published in full at `disclaimer.html`. The site contains no testimonials, success claims or comparisons.

## Going live with Google Search Console
1. Replace `https://www.example.com` everywhere (canonical tags, Open Graph, structured data, `robots.txt`, `sitemap.xml`) with the real domain, using the same `https://` and `www` choice the host serves.
2. Upload everything except the `.claude/` folder and `README.md`.
3. Configure the host to serve `404.html` for missing pages, with a real 404 status. Netlify, Vercel, GitHub Pages and most cPanel hosts do this automatically for a root `404.html`.
4. In Search Console, add a **Domain** property, verify it via DNS, then submit `sitemap.xml` under Sitemaps.
5. Run **URL Inspection → Test live URL** on the home page and confirm it is "URL is available to Google" with the LegalService and FAQ structured data detected.
6. After any content change, update `<lastmod>` in `sitemap.xml`.

## Preview locally
```bash
python -m http.server 5510
```
Then open http://localhost:5510.

## Images
The About section uses the office photo of Adv. Manthagini J: `assets/img/advocate-640.jpg` and `advocate-1000.jpg` are square crops of the original `advocate.jpg.jpeg`. The other photographs (Lady Justice statue, gavel, law library, document signing) are free Unsplash images loaded from Unsplash's image CDN, sized for each screen width. To host them yourself, download them into `assets/img/` and update the `src`/`srcset` URLs in `index.html`.
