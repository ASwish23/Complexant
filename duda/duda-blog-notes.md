# Duda blog: how it works, and what we can do from here

Research by a read-only Haiku agent, 2026-10-17. Nothing was created, changed or published in Duda.
Facts come from the Duda MCP tool schemas, read calls on our sites, and developer.duda.co. Items marked *inference* are not verified. The Duda support articles returned 403, so widget settings are unconfirmed.

## Decisions so far (with the user)
- The Insights page ends up in Duda, built with Duda's blog feature.
- The page is hidden at launch. For now we only show the client how it will look once the first 3 posts exist.
- Listing density once posts exist: 1 featured post + 3 latest, with a "view all" link.
- No topic filters or categories yet.

## How a Duda blog is structured
- **Blog**: one per site. Fields: name, title, description, image, layouts[]. Created with `create_blog`, edited with `update_blog` (name/title/description only).
- **Blog post**: id, path (slug), status (PUBLISHED / UNPUBLISHED), title, author_name, meta_title, description (meta), tags, no_index, main_image, thumbnail, publish_date, layout_id.
- **Listing page**: an ordinary page holding the blog list widget ("All Posts"). It only appears in the widget library once a blog is installed.
- **Post page**: generated from the blog's post layout (`layout_id`). The API gives only the layout id and name, not its structure.
- **Categories do not exist in the API**, only tags. No JSON-LD / schema fields.

## What the MCP tools can and cannot do
| Tool | Required | Notes |
|---|---|---|
| `read_blog` | site_name | Returns layouts and blog config |
| `create_blog` | site_name | Installs the blog |
| `update_blog` | site_name | name/title/description only |
| `create_blog_post` | site_name, title, description, content (HTML), thumbnail_url | No path, tags or date params; optional author, main_image_url, layout_id |
| `update_blog_post` | site_name, post_id | Metadata only (path, meta_title, description, no_index, tags, author_name, thumbnail, main_image, publish_date, layout_id, title). **Cannot edit the body** |
| `publish_blog_post` | site_name, post_id | Optional `schedulePublishDate` |
| `unpublish_blog_post` / `delete_blog_post` | site_name, post_id | |
| `list_blog_posts` / `get_blog_post` | site_name (+ post_id) | list errors (400) if no blog installed |
| `import_blog_posts_from_rss` | site_name, feed_url | Imports as drafts; replaces blog title with feed title |

**Editor only**: the blog list and post widgets show up as `UNKNOWN` elements through the API (move/delete only). They cannot be inserted or styled by tool. Grid vs list, columns, pagination and show-excerpt/image/date toggles must be set by hand in the Duda editor.

## Open technical unknowns (test on a throwaway blog before relying on them)
- Default status of a post made with `create_blog_post`.
- `publish_date` vs `schedule_publish_date`: the docs conflict on which one schedules.
- Whether posts live at `/insights/{slug}` or under a separate blog root.
- How to edit a post body after creation (no tool found).
- What an empty blog shows (not documented, no empty blog to inspect).

## Templates
- `list_templates` with `has_blog: true` works (about 40 entries read; the unfiltered list is too large).
- Blog-tagged templates closest to a professional-services site: Boutique Law Firm (9 pages), Marketing Agency (12), Accountant (5), Blank Expandable (5).
- Their blog layouts were **not** inspected visually. Check each preview URL before choosing one. No site was created from a template.

## Our existing Duda sites
- **complexant-partners-v2** (id f4c13241, NOT_PUBLISHED_YET). Pages: Home, About, Approach, Monitoring, Regulatory Risk, Implementation, Who We Serve, Sandbox, Contact, Insights.
  - No blog installed.
  - The Insights page is a hand-built mock (hero, featured article, two rows of three cards, CTA) with placeholder text such as "[Author] · [Date] · [X] min read". Its status is `STAGED_DRAFT`.
  - **Risk**: the tool docs say STAGED_DRAFT pages publish with the site. Publishing the site as it stands would expose the placeholder cards. Hide the page from navigation and set it to no-index (or unpublish it) before any publish.
  - Theme: navy #07131D, card navy #0C2130, cream #F6F3ED, teal #4F8F8E, copper #C7742D. Headings Cormorant Garamond, body Poppins 300.
- **complexant-1** (id 3c7ae0d9). Older site with a blog installed and three 2023 legal template posts; no Complexant content. Useful only as a reference for how the listing widgets sit on a page.

## Low-density layout options (design suggestions, *inference*, not template output)
1. **One featured essay, then a plain list**: wide featured card (image, serif title, two-line excerpt, byline and date), then hairline-divided rows with title, date, read time. No thumbnails in the list.
2. **Restrained 2-column grid, capped at six**, shown only with 3+ posts. 1px borders, no shadows.
3. **Empty-state note**: a short signed note from one of the principals with a single opt-in action.

What keeps these quiet: one featured item, no sidebar, at most six cards, copper used for a single accent.
