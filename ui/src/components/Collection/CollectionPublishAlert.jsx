import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateCollection } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';


const messages = defineMessages({
  processing: {
    id: 'collection.publish.succeed',
    defaultMessage: 'Casefile is published',
  },
  cancel: {
    id: 'collection.publish.cancel',
    defaultMessage: 'Cancel',
  },
  confirm: {
    id: 'collection.publish.confirm',
    defaultMessage: 'Publish',
  },
});

class CollectionPublishAlert extends Component {
  constructor(props) {
    super(props);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;

    this.props.updateCollection({
      ...collection,
      casefile: false,
    });
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.togglePublish();
  }

  render() {
    const { intl, isOpen } = this.props;
    return (
      <Alert
        cancelButtonText={intl.formatMessage(messages.cancel)}
        confirmButtonText={intl.formatMessage(messages.confirm)}
        canEscapeKeyCancel
        canOutsideClickCancel
        intent={Intent.PRIMARY}
        icon="social-media"
        isOpen={isOpen}
        onCancel={this.props.togglePublish}
        onConfirm={this.onConfirm}
      >
        <p>
          <FormattedMessage
            id="collection.publish.alert.text"
            defaultMessage="You are converting this case file to a source. Sources are to be seen as raw evidence and can be made public for every visitor of the system to see. Please make sure you do not publish material identifying your sources, directly or through metadata."
          />
        </p>
      </Alert>
    );
  }
}
const mapDispatchToProps = {
  updateCollection,
};


export default compose(
  connect(null, mapDispatchToProps),
  injectIntl,
)(CollectionPublishAlert);
