import React, {Component} from "react";
import queryString from 'query-string';
import { Alert, Intent } from "@blueprintjs/core";
import { defineMessages, FormattedMessage, injectIntl } from "react-intl";
import { withRouter } from "react-router";
import { connect } from "react-redux";

import { deleteCollection } from "src/actions";


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
    const { collection, history } = this.props;
    this.props.deleteCollection(collection);
    history.push({
      pathname: '/cases',
      search: queryString.stringify({'_deleted': collection.id})
    });
  }

  render() {
    const { intl } = this.props;
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
export default connect(mapStateToProps, { deleteCollection })(CollectionDeleteDialog);
