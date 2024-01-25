
import SafeHtmlDocument from './SafeHtmlDocument'

const hostname = 'aleph.com'
const sourceUrl = `http://${hostname}`
const html = `
  <!doctype html>
  <html>
      <head>
          <title>Article</title>
          <style type="text/css">body { }</style>
          <script>alert("We love Angular")</script>
          <link rel="stylesheet" href="http://xss.rocks/xss.css">
      </head>
      <body>
          <article id="story">
              <h1>We welcome our new React overlords</h1>
              <img src="&#14;  javascript:alert(\'XSS\');" alt="" />
              <p>Published on <time onmouseover="alert(\'XSS\')">1 January 2018</time></p>
              <p>Really the only thing better than the <a href="/blockchain"> blockchain</a> is ReactJS.</p>
          </article>
          <video><source onerror = "javascript: alert (XSS)"></video>
      </body>
  </html>
`

const sanitizedHtml = SafeHtmlDocument.sanitizeHtml(html, sourceUrl)
const parser = new DOMParser()
const htmlDocument = parser.parseFromString(sanitizedHtml, 'text/html')

it('Sanitizes XSS related elements', () => {
  for(const tag of ['img', 'video', 'style', 'script']) {
    expect(htmlDocument.getElementsByTagName(tag).length).toEqual(0)
  }
})

it('Adds _blank target to anchors', () => {
  for(const a of htmlDocument.getElementsByTagName('a')) {
    expect(a.getAttribute('target')).toEqual('_blank')
  }
})

it('Adds nofollow rel to anchors', () => {
  for(const a of htmlDocument.getElementsByTagName('a')) {
    expect(a.getAttribute('rel')).toContain('nofollow')
  }
})

it('Replaces the hostname of anchors with passed sourceUrl', () => {
  for(const a of htmlDocument.getElementsByTagName('a')) {
    expect(new URL(a.getAttribute('href')).hostname).toEqual(hostname)
  }
})
