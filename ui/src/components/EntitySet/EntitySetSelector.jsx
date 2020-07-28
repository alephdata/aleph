import React, { Component } from 'react';
import { Button, Divider, Drawer, InputGroup } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { createEntitySet, queryEntitySets, updateEntitySet } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { EntitySet, SearchBox } from 'components/common';
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
    defaultMessage: 'Add {count} {count, plural, one {entity} other {entities}} to...',
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
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
});


class EntitySetSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { processing: false };

    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.fetchIfNeeded()
    }
  }

  fetchIfNeeded() {
    const { listsQuery, diagramsQuery, listsResult, diagramsResult } = this.props;
    console.log(listsResult, diagramsResult)
    if (listsResult.shouldLoad) {
      this.props.queryEntitySets({ query: listsQuery });
    }
    if (diagramsResult.shouldLoad) {
      this.props.queryEntitySets({ query: diagramsQuery });
    }
  }

  onSearch(queryText) {
    console.log('searching', queryText);
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

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  onSelect(entitySet) {
    console.log('selected', entitySet)
    const { entities, intl } = this.props;

    const updatedEntities = entitySet.entities ? [...entitySet.entities, ...entities] : entities;

    const updatedEntitySet = {
      ...entitySet,
      entities: updatedEntities.map(e => e.id || e),
    };

    this.sendRequest(updatedEntitySet, entitySet.entities?.length)
  }

  async sendRequest(entitySet, prevEntityCount = 0) {
    const { history, intl } = this.props;
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
          intl.formatMessage(messages.success_update, {count: updatedCount, entitySet: entitySet.label}),
        );
        // history.push({
        //   pathname: getEntitySetLink(updatedDiagram.data),
        // });
      })
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }


  render() {
    const { entities, intl, isOpen, diagramsQuery, diagramsResult, listsQuery, listsResult, toggleDialog } = this.props;
    const { label, processing } = this.state;
    // <p>
    //   <FormattedMessage
    //     id="diagram.add_entities.selected_count"
    //     defaultMessage="You have selected {count} {count_simple, plural, one {entity} other {entities}} to add to a diagram."
    //     values={{ count: <strong>{entities.length}</strong>, count_simple: entities.length }}
    //   />
    // </p>

    console.log('collection ', this.props.collection)

    return (
      <Drawer
        hasBackdrop={false}
        icon="add-to-artifact"
        className="EntitySetSelector"
        size={Drawer.SIZE_SMALL}
        isOpen={isOpen}
        title={intl.formatMessage(messages.title, { count: entities.length })}
        transitionDuration={200}
        onClose={toggleDialog}
        autoFocus={false}
        enforceFocus={false}
        canOutsideClickClose={false}
        portalClassName="EntitySetSelector__overlay-container"
      >
        <div className="bp3-drawer-body">
          <div className="EntitySetSelector__top-section">
            <SearchBox
              onSearch={this.onSearch}
              placeholder={"testing"}
              query={diagramsQuery}
            />
          </div>

          <div className="EntitySetSelector__section">
            <h5 className="EntitySetSelector__section__title bp3-heading">
              <FormattedMessage id="entityset.selector.lists" defaultMessage="Lists" />
            </h5>
            <div className="EntitySetSelector__section__content">
              <EntitySetList
                query={listsQuery}
                result={listsResult}
                onSelect={this.onSelect}
                type="list"
              />
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
          <div className="EntitySetSelector__section">
            <h5 className="EntitySetSelector__section__title bp3-heading">
              <FormattedMessage id="entityset.selector.diagrams" defaultMessage="Diagrams" />
            </h5>
            <div className="EntitySetSelector__section__content">
              <EntitySetList
                query={diagramsQuery}
                result={diagramsResult}
                onSelect={this.onSelect}
                type="diagram"
              />
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
