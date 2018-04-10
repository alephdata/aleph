import React from 'react';
import { connect } from 'react-redux';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { EntityInfo } from 'src/components/Entity';
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

class PreviewEntity extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.previewId !== newProps.previewId) {
      this.fetchIfNeeded(newProps);
    }
  }

  fetchIfNeeded(props) {
    if (!props.entity || !props.entity.id) {
      props.fetchEntity({ id: props.previewId });
    }
  }

  render() {
    const { entity } = this.props;

    if(entity && entity.status === 403) {
      return <ErrorScreen.EmptyList title={messages.not_authorized}
                                    description={messages.not_authorized_decr} />
    } else if (entity && entity.error) {
      return <ErrorScreen.EmptyList title={entity.message} />
    }

    if (!entity || !entity.id) {
      return <SectionLoading/>;
    }
    return <EntityInfo entity={entity} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { entity: selectEntity(state, ownProps.previewId) };
};

PreviewEntity = connect(mapStateToProps, { fetchEntity })(PreviewEntity);
export default PreviewEntity;