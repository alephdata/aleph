import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { deleteEntitySet } from 'actions';
import { showSuccessToast } from 'app/toast';
import getCollectionLink from 'util/getCollectionLink';
import { DeleteDialog } from 'components/common';

const messages = defineMessages({
  success: {
    id: 'entityset.delete.success',
    defaultMessage: 'Successfully deleted {title}',
  },
});

class EntitySetDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  onDelete() {
    const { entitySet, navigate, intl } = this.props;
    this.props
      .deleteEntitySet(entitySet.id)
      .then(() =>
        showSuccessToast(
          intl.formatMessage(messages.success, { title: entitySet.label })
        )
      );

    navigate(getCollectionLink({ collection: entitySet.collection }));
  }

  render() {
    const { entitySet } = this.props;
    const { label, type } = entitySet;

    const title = (
      <>
        {type === 'diagram' && (
          <FormattedMessage
            id="entityset.delete.title.diagram"
            defaultMessage="Delete network diagram"
            values={{ type }}
          />
        )}
        {type === 'timeline' && (
          <FormattedMessage
            id="entityset.delete.title.timeline"
            defaultMessage="Delete timeline"
            values={{ type }}
          />
        )}
        {type === 'list' && (
          <FormattedMessage
            id="entityset.delete.title.list"
            defaultMessage="Delete list"
            values={{ type }}
          />
        )}
        {type === 'profile' && (
          <FormattedMessage
            id="entityset.delete.title.profile"
            defaultMessage="Delete profile"
            values={{ type }}
          />
        )}
      </>
    );

    const buttonLabel = (
      <>
        <FormattedMessage
          id="entityset.delete.confirm"
          defaultMessage="I understand the consequences."
          values={{ type }}
        />{' '}
        {type === 'diagram' && (
          <FormattedMessage
            id="entityset.delete.confirm.diagram"
            defaultMessage="Delete this network diagram."
            values={{ type }}
          />
        )}
        {type === 'timeline' && (
          <FormattedMessage
            id="entityset.delete.confirm.timeline"
            defaultMessage="Delete this timeline."
            values={{ type }}
          />
        )}
        {type === 'list' && (
          <FormattedMessage
            id="entityset.delete.confirm.list"
            defaultMessage="Delete this list."
            values={{ type }}
          />
        )}
        {type === 'profile' && (
          <FormattedMessage
            id="entityset.delete.confirm.profile"
            defaultMessage="Delete this profile."
            values={{ type }}
          />
        )}
      </>
    );

    return (
      <DeleteDialog
        isOpen={this.props.isOpen}
        title={title}
        buttonLabel={buttonLabel}
        expectedConfirmationValue={entitySet.label}
        onClose={this.props.toggleDialog}
        onDelete={this.onDelete}
      >
        <p>
          <FormattedMessage
            id="entityset.delete.question"
            defaultMessage="Are you sure you want to permanently delete {label}? This cannot be undone."
            values={{ label: <strong>{label}</strong> }}
          />
          {type === 'profile' && (
            <>
              {' '}
              <FormattedMessage
                id="profile.delete.warning"
                defaultMessage="Deleting this profile will not delete any of the entities or entity decisions contained within it."
              />
            </>
          )}
        </p>
      </DeleteDialog>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntitySet }),
  injectIntl
)(EntitySetDeleteDialog);
