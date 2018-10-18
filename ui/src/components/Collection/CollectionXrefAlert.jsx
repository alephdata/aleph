import React, {Component} from 'react';
import { connect } from "react-redux";
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent } from "@blueprintjs/core";

import { tiggerXrefMatches } from "src/actions";
import { showSuccessToast } from "src/app/toast";

const messages = defineMessages({
  processing: {
    id: 'collection.xref.processing',
    defaultMessage: 'Cross-referencing started.'
  },
  cancel: {
    id: 'collection.xref.cancel',
    defaultMessage: 'Cancel'
  },
  confirm: {
    id: 'collection.xref.confirm',
    defaultMessage: 'Start cross-referencing'
  }
});

class CollectionXrefAlert extends Component {
  constructor(props) {
    super(props);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;
    this.props.tiggerXrefMatches(collection.id);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleAlert();
  }

  render() {
    const { intl, isOpen } = this.props;
    return (
      <Alert cancelButtonText={intl.formatMessage(messages.cancel)}
             confirmButtonText={intl.formatMessage(messages.confirm)}
             canEscapeKeyCancel={true}
             canOutsideClickCancel={true}
             icon="search-around"
             intent={Intent.DANGER}
             isOpen={isOpen}
             onCancel={this.props.toggleAlert}
             onConfirm={this.onConfirm}>
        <p>
          <FormattedMessage id="collection.xref.alert.text"
                            defaultMessage="Cross-referencing against all other data may take a lot of time. Only start this process once and allow several hours for it to complete." />
        </p>
      </Alert>
    );
  }
}


CollectionXrefAlert = connect(null, { tiggerXrefMatches })(CollectionXrefAlert);
CollectionXrefAlert = injectIntl(CollectionXrefAlert);
export default CollectionXrefAlert;
