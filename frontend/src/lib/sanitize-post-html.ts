import sanitizeHtml from "sanitize-html"

// Webzine post content comes from admin input or AI generation, neither of which is
// trusted enough to render as raw HTML. sanitize-html (pure JS, no jsdom) is used instead
// of isomorphic-dompurify's server path, which crashes under Netlify's Next.js serverless
// runtime (works fine in local `next dev`, 500s in production — jsdom doesn't bundle
// cleanly for that environment). Sanitizing here, server-side, also means the client
// bundle no longer needs to ship a sanitizer at all.
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "ul", "ol", "li",
  "strong", "em", "b", "i", "br", "hr",
  "div", "span", "img",
]

const STYLED_TAGS = ["a", "div", "span", "p", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6"]

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel", "style"],
      img: ["src", "alt", "style", "width", "height"],
      ...Object.fromEntries(STYLED_TAGS.map((tag) => [tag, ["style", "class"]])),
    },
    allowedSchemes: ["http", "https", "mailto"],
  })
}
