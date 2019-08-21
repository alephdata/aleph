import React from 'react';
import { connect } from 'react-redux';
import { Pre } from '@blueprintjs/core';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';
import { fetchDocumentContent } from 'src/actions';

import './TextViewer.scss';

class TextViewer extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { content, document } = this.props;
    if (content.shouldLoad) {
      this.props.fetchDocumentContent(document);
    }
  }

  render() {
    const { content, noStyle } = this.props;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }
    const text = <Pre>{content.text}</Pre>;
    return noStyle ? text : (
      <div className="outer">
        <div className="inner TextViewer">
          {text}
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

export default connect(mapStateToProps, { fetchDocumentContent })(TextViewer);
