import React, { PureComponent } from 'react';
import { Pre } from '@blueprintjs/core';

import { Skeleton } from '/src/components/common/index.jsx';
import insertHighlights from '/src/util/insertHighlights.js';
import convertHighlightsToReactElements from '/src/util/convertHighlightsToReactElements.js';

import './TextViewer.scss';

class TextViewer extends PureComponent {
  constructor() {
    super();
    this.highlightedText.bind(this);
    this.contents.bind(this);
  }

  render() {
    const { noStyle } = this.props;

    if (noStyle) {
      return this.contents();
    }

    return (
      <div className="outer">
        <div className="inner">{this.contents()}</div>
      </div>
    );
  }

  contents() {
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

    const highlightedText = insertHighlights(text, document.highlight);
    return convertHighlightsToReactElements(highlightedText);
  }
}

export default TextViewer;
