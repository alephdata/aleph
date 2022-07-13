import React, { PureComponent } from 'react';
import { Pre } from '@blueprintjs/core';

import { Skeleton } from 'components/common';

import './TextViewer.scss';
import convertHighlightsToReactElements from 'util/convertHighlightsToReactElements';

class TextViewer extends PureComponent {
  constructor() {
    super();
    this.highlightedText.bind(this);
  }

  render() {
    const { document, dir } = this.props;

    if (document.isPending) {
      return <Skeleton.Text type="pre" length={4000} />;
    }

    return (
      <Pre className="TextViewer" dir={dir}>
        {this.highlightedText()}
      </Pre>
    );
  }

  highlightedText() {
    const { document } = this.props;
    const text = document.getFirst('bodyText');

    if (!document.highlight) {
      return text;
    }

    const withoutMarkup = highlight.replaceAll(/<\/?em>/g, '');
    const html = document.highlight.reduce((text, highlight) => {
      return text.replace(withoutMarkup, highlight);
    }, text);

    return convertHighlightsToReactElements(html);
  }
}

export default TextViewer;
