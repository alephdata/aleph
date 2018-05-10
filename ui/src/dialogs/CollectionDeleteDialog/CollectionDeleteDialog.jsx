import React, {Component} from "react";
import { Alert, Intent } from "@blueprintjs/core";
import { defineMessages, FormattedMessage, injectIntl } from "react-intl";
import { withRouter } from 'react-router';
import { connect } from "react-redux";

import { Role } from "src/components/common";
import { deleteCollection } from "src/actions";
import { showWarningToast } from "src/app/toast";


const messages = defineMessages({
  button_confirm: {
    id: "collection.delete.confirm",
    defaultMessage: "Delete"
  },
  button_cancel: {
    id: "collection.delete.cancel",
    defaultMessage: "Cancel"
  },
  delete_error: {
    id: "collection.delete.error",
    defaultMessage: "An error occured while attempting to delete this case."
  }
});

class CollectionDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { intl, collection, history } = this.props;
    try {
      await this.props.deleteCollection(collection);
      history.push({
        pathname: collection.casefile ? '/cases' : '/collections'
      });
    } catch (e) {
      showWarningToast(intl.formatMessage(messages.delete_error));
      this.props.toggleDialog();
    }
  }

  render() {
    const { intl, collection } = this.props;
    return (
      <Alert isOpen={this.props.isOpen}
             onClose={this.props.toggleDialog}
             icon="trash"
             intent={Intent.DANGER}
             cancelButtonText={intl.formatMessage(messages.button_cancel)}
             confirmButtonText={intl.formatMessage(messages.button_confirm)}
             onCancel={this.props.toggleDialog}
             onConfirm={this.onDelete}>
        <FormattedMessage id="collection.delete.question"
                          defaultMessage="Are you sure you want to delete all contained items?" />
      </Alert>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

CollectionDeleteDialog = injectIntl(CollectionDeleteDialog);
CollectionDeleteDialog = withRouter(CollectionDeleteDialog);
export default connect(mapStateToProps, {deleteCollection})(CollectionDeleteDialog);
