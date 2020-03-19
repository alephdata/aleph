import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Skeleton } from 'src/components/common';
import { selectDocumentContent } from 'src/selectors';

import './HtmlViewer.scss';

class HtmlViewer extends Component {
  render() {
    const { content } = this.props;
    const body = content.isPending
      ? <Skeleton.Text type="p" length={4000} />
      : <span dangerouslySetInnerHTML={{ __html: content.html }} />;
    return (
      <div className="outer">
        <div className="inner HtmlViewer">
          {body}
        </div>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    content: selectDocumentContent(state, document.id),
  };
};

HtmlViewer = connect(mapStateToProps)(HtmlViewer);
export default HtmlViewer;
