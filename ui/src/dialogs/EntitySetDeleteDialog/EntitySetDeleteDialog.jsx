import React, { Component } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  Intent,
  InputGroup,
  FormGroup,
} from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { deleteEntitySet } from 'actions';
import { showSuccessToast } from 'app/toast';
import getCollectionLink from 'util/getCollectionLink';

const messages = defineMessages({
  success: {
    id: 'entityset.delete.success',
    defaultMessage: 'Successfully deleted {title}',
  },
});

const typeLabels = {
  diagram: (
    <FormattedMessage
      id="entityset.delete.diagram"
      defaultMessage="network diagram"
    />
  ),
  timeline: (
    <FormattedMessage
      id="entityset.delete.timeline"
      defaultMessage="timeline"
    />
  ),
  list: <FormattedMessage id="entityset.delete.list" defaultMessage="list" />,
  profile: (
    <FormattedMessage id="entityset.delete.profile" defaultMessage="profile" />
  ),
};

class EntitySetDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);

    this.state = { confirmationValue: '' };
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

    const typeLabel = typeLabels[type];

    const title = (
      <FormattedMessage
        id="collection.delete.title.investigation"
        defaultMessage="Delete {typeLabel}"
        values={{ typeLabel }}
      />
    );

    const buttonLabel = (
      <FormattedMessage
        id="collection.delete.confirm"
        defaultMessage="I understand the consequences. Delete this {typeLabel}."
        values={{ typeLabel }}
      />
    );

    return (
      <Dialog
        isOpen={this.props.isOpen}
        title={title}
        icon="trash"
        onClose={this.props.toggleDialog}
      >
        <DialogBody>
          <p>
            <FormattedMessage
              id="entityset.delete.question"
              defaultMessage="Are you sure you want to permanently delete {label}? This cannot be undone."
              values={{ label: <strong>{label}</strong> }}
            />
          </p>

          {type === 'profile' && (
            <p>
              <FormattedMessage
                id="profile.delete.warning"
                defaultMessage="(Deleting this profile will not delete any of the entities or entity decisions contained within it)"
              />
            </p>
          )}

          <p>
            <FormattedMessage
              id="entityset.delete.enter_label"
              defaultMessage="Please enter {label} to confirm:"
              values={{ label: <strong>{label}</strong> }}
            />
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              this.onDelete();
            }}
          >
            <FormGroup
              labelFor="collection-delete-confirmation"
              label={
                <span className="visually-hidden">
                  <FormattedMessage
                    id="collection.delete.collection_label"
                    defaultMessage="Label"
                  />
                </span>
              }
            >
              <InputGroup
                id="collection-delete-confirmation"
                placeholder={entitySet.label}
                required
                onInput={(event) =>
                  this.setState({ confirmationValue: event.target.value })
                }
              />
            </FormGroup>
            <Button
              type="submit"
              intent={Intent.DANGER}
              fill
              disabled={this.state.confirmationValue !== entitySet.label}
            >
              {buttonLabel}
            </Button>
          </form>
        </DialogBody>
      </Dialog>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntitySet }),
  injectIntl
)(EntitySetDeleteDialog);
