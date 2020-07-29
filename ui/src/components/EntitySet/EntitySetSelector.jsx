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
import EntitySetSelectorSection from 'components/EntitySet/EntitySetSelectorSection';

import { showSuccessToast, showWarningToast } from 'app/toast';
import getEntitySetLink from 'util/getEntitySetLink';

import './EntitySetSelector.scss';

const messages = defineMessages({
  title: {
    id: 'entityset.selector.title',
    defaultMessage: 'Add {count} {count, plural, one {entity} other {entities}} to...',
  },
  placeholder: {
    id: 'entityset.selector.placeholder',
    defaultMessage: 'Search existing',
  },
  success_update: {
    id: 'entityset.selector.success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
});


class EntitySetSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: '',
    };

    this.onCreate = this.onCreate.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    this.setState({ queryText });
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

  onSelect(entitySet) {
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
      this.props.toggleDialog(true);

      request.then(updatedEntitySet => {
        this.setState({ processing: false });

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
    const { collection, entities, intl, isOpen, diagramsQuery, diagramsResult, listsQuery, listsResult, toggleDialog } = this.props;
    const { label, processing, queryText } = this.state;
    // <p>
    //   <FormattedMessage
    //     id="diagram.add_entities.selected_count"
    //     defaultMessage="You have selected {count} {count_simple, plural, one {entity} other {entities}} to add to a diagram."
    //     values={{ count: <strong>{entities.length}</strong>, count_simple: entities.length }}
    //   />
    // </p>


    return (
      <Drawer
        hasBackdrop={false}
        icon="add-to-artifact"
        className="EntitySetSelector"
        size={Drawer.SIZE_SMALL}
        isOpen={isOpen}
        title={intl.formatMessage(messages.title, { count: entities.length })}
        transitionDuration={200}
        onClose={() => toggleDialog()}
        autoFocus={false}
        enforceFocus={false}
        canOutsideClickClose={false}
        portalClassName="EntitySetSelector__overlay-container"
      >
        <div className="bp3-drawer-body">
          <div className="EntitySetSelector__top-section">
            <SearchBox
              onSearch={this.onSearch}
              placeholder={intl.formatMessage(messages.placeholder)}
              query={diagramsQuery}
            />
          </div>
          <EntitySetSelectorSection
            type="list"
            collection={collection}
            onSelect={this.onSelect}
            queryText={queryText}
          />
          <EntitySetSelectorSection
            type="diagram"
            collection={collection}
            onSelect={this.onSelect}
            queryText={queryText}
          />
        </div>
      </Drawer>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
  connect(() => ({}), { createEntitySet, updateEntitySet }),
)(EntitySetSelector);
