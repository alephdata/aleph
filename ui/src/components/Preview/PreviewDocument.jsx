import React from 'react';
import { connect } from 'react-redux';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { DocumentInfo } from 'src/components/Document';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { SectionLoading } from 'src/components/common';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';
import {defineMessages} from "react-intl";

const messages = defineMessages({
    not_authorized: {
        id: 'collection.not_auth',
        defaultMessage: 'You are not authorized to do this.',
    },
    not_authorized_decr: {
        id: 'collection.not_auth_decr',
        defaultMessage: 'Please go to the login page.',
    }
});

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

    if (document && document.status === 403) {
      return <ErrorScreen.EmptyList title={messages.not_authorized}
                                    description={messages.not_authorized_decr} />
    } else if (document && document.error) {
      return <ErrorScreen.EmptyList title={document.message} />
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