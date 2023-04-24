import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { showSuccessToast } from 'app/toast';
import withRouter from 'app/withRouter';
import { deleteCollection } from 'actions';
import { DeleteDialog } from 'components/common';

const messages = defineMessages({
  success: {
    id: 'collection.delete.success',
    defaultMessage: 'Successfully deleted {label}',
  },
});

class CollectionDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { collection, navigate, deleteCollection, intl } = this.props;
    const path = collection.casefile ? '/investigations' : '/datasets';
    const successMessage = intl.formatMessage(messages.success, {
      label: collection.label,
    });

    await deleteCollection(collection);
    showSuccessToast(successMessage);
    navigate({ pathname: path });
  }

  render() {
    const { collection } = this.props;

    const title = collection.casefile ? (
      <FormattedMessage
        id="collection.delete.title.investigation"
        defaultMessage="Delete investigation"
      />
    ) : (
      <FormattedMessage
        id="collection.delete.title.dataset"
        defaultMessage="Delete dataset"
      />
    );

    const buttonLabel = (
      <>
        <FormattedMessage
          id="collection.delete.confirm"
          defaultMessage="I understand the consequences."
        />{' '}
        {collection.casefile ? (
          <FormattedMessage
            id="collection.delete.confirm.investigation"
            defaultMessage="Delete this investigation."
          />
        ) : (
          <FormattedMessage
            id="collection.delete.confirm.dataset"
            defaultMessage="Delete this dataset."
          />
        )}
      </>
    );

    return (
      <DeleteDialog
        isOpen={this.props.isOpen}
        title={title}
        buttonLabel={buttonLabel}
        expectedConfirmationValue={collection.label}
        onClose={this.props.toggleDialog}
        onDelete={this.onDelete}
      >
        <p>
          <FormattedMessage
            id="collection.delete.question"
            defaultMessage="Are you sure you want to permanently delete {collectionLabel} and all contained items? This cannot be undone."
            values={{
              collectionLabel: <strong>{collection.label}</strong>,
            }}
          />
        </p>
      </DeleteDialog>
    );
  }
}

const mapDispatchToProps = { deleteCollection };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl
)(CollectionDeleteDialog);
