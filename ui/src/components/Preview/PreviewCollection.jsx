import React from 'react';
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import { CollectionInfo } from 'src/components/Collection';
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

class PreviewCollection extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.previewId !== newProps.previewId) {
      this.fetchIfNeeded(newProps);
    }
  }

  fetchIfNeeded(props) {
    if (!props.collection || !props.collection.id) {
      props.fetchCollection({ id: props.previewId });
    }
  }

  render() {
    const { collection } = this.props;

    if (collection && collection.status === 403) {
      return <ErrorScreen.EmptyList title={messages.not_authorized}
                                    description={messages.not_authorized_decr}/>
    } else if (collection && collection.error) {
      return <ErrorScreen.EmptyList title={collection.message} />
    }

    if (!collection || !collection.id) {
      return <SectionLoading/>;
    }
    return <CollectionInfo collection={collection} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { collection: selectCollection(state, ownProps.previewId) };
};

PreviewCollection = connect(mapStateToProps, { fetchCollection })(PreviewCollection);
export default PreviewCollection;