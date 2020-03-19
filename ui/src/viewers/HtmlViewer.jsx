import React, { Component } from 'react';
import { connect } from 'react-redux';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './HtmlViewer.scss';
/* eslint-disable */

class HtmlViewer extends Component {
  render() {
    const { content } = this.props;
    if (content.isPending) {
      return <SectionLoading />;
    }
    return (
      <>
        <div className="outer">
          <div className="inner HtmlViewer">
            <span dangerouslySetInnerHTML={{ __html: content.html }} />
          </div>
        </div>
      </>
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
