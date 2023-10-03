
import { Component } from 'react';
import DOMPurify from 'dompurify';

export default class SafeHtmlDocument extends Component {
  static sanitizeHtml(html, sourceUrl = undefined) {
    // Strip XSS related (scripts etc) tags and styles. (keeping content)
    html = DOMPurify.sanitize(html, { 
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['form'],
      FORBID_ATTR: ['style'],
    })

    // Remove tags and their contents
    html = DOMPurify.sanitize(html, { 
      KEEP_CONTENT: false, 
      FORBID_TAGS: ["style", "area", "audio", "head", "img", "input", "map", "nav", "track", "video"], 
    })

    const parser = new DOMParser()
    const htmlDocument = parser.parseFromString(html, 'text/html')

    for(const a of htmlDocument.getElementsByTagName('a')) {
      // Make URL Absolute
      if(sourceUrl && sourceUrl.length > 0) {
        a.setAttribute('href', new URL(a.getAttribute('href'), sourceUrl).href);
      }

      a.setAttribute("target", "_blank")
      a.setAttribute("rel", "nofollow noreferrer external noopener")
    }

    return htmlDocument.body.innerHTML;
  }

  render() {
    const { document } = this.props;

    return document.getProperty('bodyHtml').map((html, index) => {
      return <div 
        key={index} 
        dangerouslySetInnerHTML={{ 
          __html: SafeHtmlDocument.sanitizeHtml(html, document.getFirst('sourceUrl')) 
        }} 
      />
    })
  }
}

