import React, { Component } from 'react';
import { connect } from 'react-redux';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './HtmlViewer.scss';
/* eslint-disable */

class HtmlViewer extends Component {
  render() {
    const { content } = this.props;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }
    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner HtmlViewer">
            <span dangerouslySetInnerHTML={{ __html: content.html }} />
          </div>
        </div>
      </React.Fragment>
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
