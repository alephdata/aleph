import React from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { DocumentInfo } from 'src/components/Document';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { SectionLoading } from 'src/components/common';

class PreviewDocument extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.previewId !== newProps.previewId) {
      this.fetchIfNeeded(newProps);
    }
  }

  fetchIfNeeded(props) {
    props.fetchDocument({ id: props.previewId });
  }

  render() {
    const { document, maximised } = this.props;

    if (document && document.error) {
      return <NonIdealState
          title={document.error}
      />
    }

    if (!document || !document.id) {
      return <SectionLoading/>;
    }
    if (maximised) {
      return <DocumentViewer document={document}
                             toggleMaximise={this.props.toggleMaximise}
                             showToolbar={true}
                             previewMode={true} />;
    }
    return <DocumentInfo document={document}
                         toggleMaximise={this.props.toggleMaximise}
                         showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { document: selectEntity(state, ownProps.previewId) };
};

PreviewDocument = connect(mapStateToProps, { fetchDocument })(PreviewDocument);
export default PreviewDocument;