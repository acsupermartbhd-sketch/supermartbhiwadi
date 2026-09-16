<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemap.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Super Mart Bhiwadi | XML Sitemap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 2rem 1rem; }
          .container { max-width: 1000px; margin: 0 auto; background: #ffffff; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); padding: 2rem; border: 1px solid #e2e8f0; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
          .brand { display: flex; align-items: center; gap: 0.75rem; }
          .brand h1 { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0; }
          .badge { background: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; border: 1px solid #bfdbfe; }
          .desc { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th { text-align: left; padding: 0.85rem 1rem; background: #f8fafc; color: #475569; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; border-bottom: 1px solid #e2e8f0; }
          td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; word-break: break-all; }
          tr:hover td { background-color: #f8fafc; }
          a { color: #2563eb; text-decoration: none; font-weight: 600; }
          a:hover { text-decoration: underline; color: #1d4ed8; }
          .priority-tag { font-weight: 800; color: #047857; background: #ecfdf5; padding: 0.2rem 0.5rem; border-radius: 0.375rem; font-size: 0.8rem; }
          .footer { margin-top: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              <h1>Super Mart Bhiwadi</h1>
            </div>
            <span class="badge">XML Sitemap</span>
          </div>
          <p class="desc">
            This XML Sitemap contains URLs for indexing by search engines like Google and Bing.
          </p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Priority</th>
                <th>Change Frequency</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td><span class="priority-tag"><xsl:value-of select="sitemap:priority"/></span></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            Super Mart Bhiwadi — Official XML Sitemap
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
