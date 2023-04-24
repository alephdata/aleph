import React, { Component } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  Intent,
  FormGroup,
  InputGroup,
} from '@blueprintjs/core';
import { FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { deleteCollection } from 'actions';
import { Collection } from 'components/common';

class CollectionDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);

    this.state = { confirmationValue: '' };
  }

  async onDelete() {
    const { collection, navigate } = this.props;
    const path = collection.casefile ? '/investigations' : '/datasets';
    await this.props.deleteCollection(collection);
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

    const collectionLabel = (
      <strong>
        <Collection.Label collection={collection} icon={false} />
      </strong>
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
              id="collection.delete.question"
              defaultMessage="Are you sure you want to permanently delete {collectionLabel} and all contained items? This cannot be undone."
              values={{ collectionLabel }}
            />
          </p>

          <p>
            <FormattedMessage
              id="collection.delete.enter_label"
              defaultMessage="Please enter {collectionLabel} to confirm:"
              values={{ collectionLabel }}
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
                placeholder={collection.label}
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
              disabled={this.state.confirmationValue !== collection.label}
            >
              {buttonLabel}
            </Button>
          </form>
        </DialogBody>
      </Dialog>
    );
  }
}

const mapDispatchToProps = { deleteCollection };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl
)(CollectionDeleteDialog);
