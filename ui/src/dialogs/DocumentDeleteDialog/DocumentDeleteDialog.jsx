import React, { Component } from "react";
import { Alert, Intent } from "@blueprintjs/core";
import { defineMessages, FormattedMessage, injectIntl } from "react-intl";
import { withRouter } from "react-router";
import { connect } from "react-redux";

import { deleteDocument } from "src/actions";

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


class DocumentDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const {history, documents, path} = this.props;
    const collection = documents[0].collection;
    for (let i = 0; i < documents.length; i++) {
      await this.props.deleteDocument({document: documents[i]});
    }
    history.push({
      pathname: path
    });
  }

  render() {
    const {intl} = this.props;
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
                          defaultMessage="Are you sure you want to delete all contained items?"/>
      </Alert>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

DocumentDeleteDialog = injectIntl(DocumentDeleteDialog);
DocumentDeleteDialog = withRouter(DocumentDeleteDialog);
export default connect(mapStateToProps, {deleteDocument})(DocumentDeleteDialog);
