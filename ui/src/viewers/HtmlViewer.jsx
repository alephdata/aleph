import React, { Component } from 'react';
import DOMPurify from 'dompurify'

import { Skeleton } from 'components/common';

import './HtmlViewer.scss';

const FORBID_TAGS = [
  "meta",
  "area",
  "audio",
  "svg",
  "base",
  "bgsound",
  "embed",
  "frame",
  "frameset",
  "head",
  "img",
  "iframe",
  "input",
  "link",
  "map",
  "meta",
  "nav",
  "object",
  "plaintext",
  "track",
  "video",
]

export class SafeHtmlDocument extends Component {
  render() {
    const { document } = this.props;

    return document.getProperty('bodyHtml').map((html, index) => {
      // Strip XSS related (scripts etc) tags and styles. (keeping content)
      let cleanHtml = DOMPurify.sanitize(html, { 
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['style', 'form'],
        FORBID_ATTR: ['style'],
      })

      // Remove tags and their contents
      cleanHtml = DOMPurify.sanitize(cleanHtml, { KEEP_CONTENT: false, FORBID_TAGS, })

      const parser = new DOMParser()
      const htmlDocument = parser.parseFromString(cleanHtml, 'text/html')
      const sourceUrl = document.getFirst('sourceUrl')

      for(const a of htmlDocument.getElementsByTagName('a')) {
        // Make URL Absolute
        if(sourceUrl && sourceUrl.length > 0) {
          a.setAttribute('href', new URL(a.getAttribute('href'), sourceUrl).href);
        }

        a.setAttribute("target", "_blank")
        a.setAttribute("rel", "nofollow noreferrer external noopener")
      }

      return <div key={index} dangerouslySetInnerHTML={{ __html: htmlDocument.body.innerHTML }} />
    })
  }
}

export default class HtmlViewer extends Component {
  render() {
    const { document, dir } = this.props;
    return (
      <div className="outer">
        <div className="inner HtmlViewer" dir={dir}>
          {
            document.isPending 
              ? <Skeleton.Text type="p" length={4000} />
              : <SafeHtmlDocument document={document} />
          }
        </div>
      </div>
    );
  }
}

