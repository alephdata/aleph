import React, { Component } from 'react';
import { Button, Divider, Drawer, InputGroup } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { createEntitySet, queryEntitySets, updateEntitySet } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { EntitySet } from 'components/common';
import EntitySetList from 'components/EntitySet/EntitySetList';
import { showSuccessToast, showWarningToast } from 'app/toast';
import getEntitySetLink from 'util/getEntitySetLink';

import './EntitySetSelector.scss';

const messages = defineMessages({
  create_new: {
    id: 'diagram.add_entities.create_new',
    defaultMessage: 'Create a new diagram',
  },
  title: {
    id: 'diagram.add_entities.title',
    defaultMessage: 'Add entities to...',
  },
  placeholder: {
    id: 'diagram.add_entities.select_placeholder',
    defaultMessage: 'Select an existing diagram',
  },
  empty: {
    id: 'diagram.add_entities.select_empty',
    defaultMessage: 'No existing diagrams',
  },
  success_update: {
    id: 'diagram.add_entities.success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {diagram}',
  },
});


class EntitySetSelector extends Component {
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
    if (result && !result.isPending && !result.isError) {
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
      entities,
      type: 'diagram',
    });
  }

  onSelect(diagram) {
    const { entities } = this.props;
    const prevEntityCount = diagram.entities?.length;

    const entityIds = entities.map(e => e.id);
    const newDiagramData = {
      ...diagram,
      entities: diagram.entities ? [...diagram.entities, ...entityIds] : entityIds,
    };

    this.sendRequest(newDiagramData, prevEntityCount);
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  async sendRequest(diagram, prevEntityCount = 0) {
    const { history, intl } = this.props;
    const { processing } = this.state;

    if (processing) return;
    this.setState({ processing: true });

    try {
      let request;
      if (diagram.id) {
        request = this.props.updateEntitySet(diagram.id, diagram);
      } else {
        request = this.props.createEntitySet(diagram);
      }

      request.then(updatedDiagram => {
        this.setState({ processing: false });
        this.props.toggleDialog();

        const newCount = updatedDiagram?.data?.entities?.length || 0;
        const updatedCount = newCount - prevEntityCount;

        showSuccessToast(
          intl.formatMessage(messages.success_update, {count: updatedCount, diagram: diagram.label}),
        );
        history.push({
          pathname: getEntitySetLink(updatedDiagram.data),
        });
      })
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }

  render() {
    const { entities, intl, isOpen, diagramsQuery, diagramsResult, listsQuery, listsResult, toggleDialog } = this.props;
    const { label, processing } = this.state;

    return (
      <Drawer
        hasBackdrop={false}
        icon="add-to-artifact"
        className="EntitySetSelector"
        size={Drawer.SIZE_SMALL}
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        transitionDuration={200}
        onClose={toggleDialog}
      >
        <div className="bp3-drawer-body">
          <p>
            <FormattedMessage
              id="diagram.add_entities.selected_count"
              defaultMessage="You have selected {count} {count_simple, plural, one {entity} other {entities}} to add to a diagram."
              values={{ count: <strong>{entities.length}</strong>, count_simple: entities.length }}
            />
          </p>
          <Divider />
          <div className="EntitySetSelector__section">
            <h1 className="EntitySetSelector__section__title">
              <FormattedMessage id="entityset.selector.lists" defaultMessage="Lists" />
            </h1>
            <div className="EntitySetSelector__section__content">
              <EntitySetList
                query={listsQuery}
                result={listsResult}
                type="list"
                showCollection
              />
            </div>
          </div>
          <div className="EntitySetSelector__section">
            <h1 className="EntitySetSelector__section__title">
              <FormattedMessage id="entityset.selector.diagrams" defaultMessage="Diagrams" />
            </h1>
            <div className="EntitySetSelector__section__content">
              <EntitySetList
                query={diagramsQuery}
                result={diagramsResult}
                type="diagram"
                showCollection
              />
            </div>
          </div>

          <form onSubmit={this.onCreate}>
            <InputGroup
              fill
              leftIcon="graph"
              placeholder={intl.formatMessage(messages.create_new)}
              rightElement={
                <Button icon="arrow-right" minimal type="submit" />
              }
              onChange={this.onChangeLabel}
              value={label}
            />
          </form>
        </div>
      </Drawer>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const diagramsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'diagram');
  const listsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'list');

  return {
    diagramsQuery,
    diagramsResult: selectEntitySetsResult(state, diagramsQuery),
    listsQuery,
    listsResult: selectEntitySetsResult(state, listsQuery),
  };
};

export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { createEntitySet, queryEntitySets, updateEntitySet }),
)(EntitySetSelector);
