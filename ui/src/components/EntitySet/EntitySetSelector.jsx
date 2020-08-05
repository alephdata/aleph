import React, { Component } from 'react';
import { Button, Divider, Drawer, InputGroup } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { createEntitySet, queryEntitySets, entitySetAddEntity } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { EntitySet, SearchBox } from 'components/common';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';
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
  success_button: {
    id: 'entityset.selector.success_toast_button',
    defaultMessage: 'View',
  },
  success_update: {
    id: 'entityset.selector.success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
});


class EntitySetSelector extends Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   queryText: '',
    // };

    this.onCreate = this.onCreate.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    // this.onSearch = this.onSearch.bind(this);
  }

  // onSearch(queryText) {
  //   this.setState({ queryText });
  // }

  async onCreate(type, label) {
    const { collection, entities, intl } = this.props;

    const entitySet = {
      collection_id: collection.id,
      label,
      entities,
      type,
    };

    try {
      const created = await this.props.createEntitySet(entitySet);
      this.onSuccess(created.data);
    } catch (e) {
      showWarningToast(e.message);
    }

  }

  onSelect(entitySet) {
    const { entities, intl } = this.props;
    const entitySetId = entitySet.id;

    try {
      const promises = entities.map(entity => (
        this.props.entitySetAddEntity({ entitySetId , entity, sync: false })
      ));

      Promise.all(promises).then(values => this.onSuccess(entitySet));
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  onSuccess(entitySet) {
    const { entities, history, intl } = this.props;

    showSuccessToast({
      message: intl.formatMessage(messages.success_update, {count: entities.length, entitySet: entitySet.label}),
      action: {
        small: true,
        icon: 'share',
        text: intl.formatMessage(messages.success_button),
        onClick: () => history.push({ pathname: getEntitySetLink(entitySet) })
      }
    });
    this.props.toggleDialog(true);
  }

  render() {
    const { collection, entities, intl, isOpen, diagramsQuery, diagramsResult, listsQuery, listsResult, toggleDialog } = this.props;

    return (
      <Drawer
        hasBackdrop={false}
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
          <EntitySetSelectorSection
            type="list"
            collection={collection}
            onSelect={this.onSelect}
            onCreate={this.onCreate}
          />
          <EntitySetSelectorSection
            type="diagram"
            collection={collection}
            onSelect={this.onSelect}
            onCreate={this.onCreate}
          />
        </div>
      </Drawer>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
  connect(() => ({}), { createEntitySet, entitySetAddEntity }),
)(EntitySetSelector);
