import React, { Component } from 'react';
import { Button, Divider, InputGroup } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import FormDialog from 'src/dialogs/common/FormDialog';
import { createEntitySet, queryEntitySets, updateEntitySet } from 'src/actions';
import { queryCollectionEntitySets } from 'src/queries';
import { selectEntitySetsResult } from 'src/selectors';
import { EntitySet } from 'src/components/common';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getEntitySetLink from 'src/util/getEntitySetLink';

import './AddToEntitySetDialog.scss';

const messages = defineMessages({
  create_new: {
    id: 'entityset.add_entities.create_new',
    defaultMessage: 'Create a new {type}',
  },
  title: {
    id: 'entityset.add_entities.title',
    defaultMessage: 'Add entities to a {type}',
  },
  placeholder: {
    id: 'entityset.add_entities.select_placeholder',
    defaultMessage: 'Select an existing {type}',
  },
  empty: {
    id: 'entityset.add_entities.select_empty',
    defaultMessage: 'No existing {type}s',
  },
  success_update: {
    id: 'entityset.add_entities.success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {type}',
  },
});


class AddToEntitySetDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { processing: false };

    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.fetchIfNeeded()
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntitySets({ query });
    }
  }

  onCreate(e) {
    const { collection, entities } = this.props;
    const { label } = this.state;
    e.preventDefault();
    this.sendRequest({
      collection_id: collection.id,
      label,
      entities
    });
  }

  onSelect(entitySet) {
    const { entities } = this.props;
    const prevEntityCount = entitySet.entities?.length;

    const entityIds = entities.map(e => e.id);
    const newEntitySetData = {
      ...entitySet,
      entities: entitySet.entities ? [...entitySet.entities, ...entityIds] : entityIds,
    };

    this.sendRequest(newEntitySetData, prevEntityCount);
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  async sendRequest(entitySet, prevEntityCount = 0) {
    const { history, intl, type = 'set' } = this.props;
    const { processing } = this.state;

    if (processing) return;
    this.setState({ processing: true });

    try {
      let request;
      if (entitySet.id) {
        request = this.props.updateEntitySet(entitySet.id, entitySet);
      } else {
        request = this.props.createEntitySet(entitySet);
      }

      request.then(updatedEntitySet => {
        this.setState({ processing: false });
        this.props.toggleDialog();

        const newCount = updatedEntitySet?.data?.entities?.length || 0;
        const updatedCount = newCount - prevEntityCount;

        showSuccessToast(
          intl.formatMessage(messages.success_update, {count: updatedCount, entitySet: entitySet.label, type}),
        );
        history.push({
          pathname: getEntitySetLink(updatedEntitySet.data),
        });
      })
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }

  render() {
    const { entities, intl, isOpen, result, toggleDialog, type = 'set' } = this.props;
    const { label, processing } = this.state;

    return (
      <FormDialog
        icon="send-to-graph"
        className="AddToEntitySetDialog"
        processing={processing}
        isOpen={isOpen}
        title={intl.formatMessage(messages.title, { type })}
        onClose={toggleDialog}
      >
        <div className="bp3-dialog-body">
          <p>
            <FormattedMessage
              id="entityset.add_entities.selected_count"
              defaultMessage="You have selected {count} {count_simple, plural, one {entity} other {entities}} to add to a {type}."
              values={{ count: <strong>{entities.length}</strong>, count_simple: entities.length, type }}
            />
          </p>
          <Divider />
          <EntitySet.Select
            onSelect={this.onSelect}
            items={result.results}
            noResults={intl.formatMessage(messages.empty, { type })}
            buttonProps={{
              icon: "send-to-graph",
              disabled: result.isLoading || result.shouldLoad,
              text: intl.formatMessage(messages.placeholder, { type })
            }}
          />
          <div className="FormDialog__spacer">
            <FormattedMessage id="entityset.add.or" defaultMessage="or" />
          </div>
          <form onSubmit={this.onCreate}>
            <InputGroup
              fill
              leftIcon="graph"
              placeholder={intl.formatMessage(messages.create_new, { type })}
              rightElement={
                <Button icon="arrow-right" minimal type="submit" />
              }
              dir="auto"
              onChange={this.onChangeLabel}
              value={label}
            />
          </form>
        </div>
      </FormDialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, type } = ownProps;
  let query = queryCollectionEntitySets(location, collection.id);
  if (type) {
    query = query.setFilter('type', type);
  }
  return {
    query,
    result: selectEntitySetsResult(state, query),
  };
};

export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { createEntitySet, queryEntitySets, updateEntitySet }),
)(AddToEntitySetDialog);
