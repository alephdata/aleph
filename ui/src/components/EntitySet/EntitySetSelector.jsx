import React, { Component } from 'react';
import { Drawer, Spinner } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import c from 'classnames';

import withRouter from 'app/withRouter';
import {
  createEntitySetMutate,
  createEntitySetNoMutate,
  entitySetAddEntity,
} from 'actions';
import EntitySetSelectorSection from 'components/EntitySet/EntitySetSelectorSection';
import { showSuccessToast, showWarningToast } from 'app/toast';
import getEntitySetLink from 'util/getEntitySetLink';

import './EntitySetSelector.scss';

const messages = defineMessages({
  title_default: {
    id: 'entityset.selector.title_default',
    defaultMessage: 'Add entities to...',
  },
  title: {
    id: 'entityset.selector.title',
    defaultMessage: 'Add {firstCaption} {titleSecondary} to...',
  },
  title_secondary: {
    id: 'entityset.selector.title_other',
    defaultMessage:
      'and {count} other {count, plural, one {entity} other {entities}}',
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
    defaultMessage:
      'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
});

class EntitySetSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      processing: false,
    };
    this.onCreate = this.onCreate.bind(this);
    this.onError = this.onError.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  async onCreate(type, label) {
    const { collection, entities, triggerMutationOnCreate = true } = this.props;
    const { processing } = this.state;

    if (processing) {
      return;
    }

    const entitySet = {
      collection_id: collection.id,
      label,
      entities,
      type,
    };

    try {
      this.setState({ processing: true });
      const created = triggerMutationOnCreate
        ? await this.props.createEntitySetMutate(entitySet)
        : await this.props.createEntitySetNoMutate(entitySet);
      this.onSuccess(created.data);
    } catch (e) {
      this.onError(e);
    }
  }

  onSelect(entitySet) {
    const { entities } = this.props;
    const { processing } = this.state;

    if (processing) {
      return;
    }

    const entitySetId = entitySet.id;

    try {
      this.setState({ processing: true });
      if (entities) {
        const promises = entities.map((entity) =>
          this.props.entitySetAddEntity({ entitySetId, entity, sync: false })
        );

        Promise.all(promises).then((values) => this.onSuccess(entitySet));
      } else {
        this.onSuccess(entitySet);
      }
    } catch (e) {
      this.onError(e);
    }
  }

  onSuccess(entitySet) {
    const {
      entities,
      navigate,
      intl,
      onSuccess,
      toggleDialog,
      triggerMutationOnCreate = true,
    } = this.props;
    this.setState({ processing: false });

    if (triggerMutationOnCreate) {
      showSuccessToast({
        message: intl.formatMessage(messages.success_update, {
          count: entities.length,
          entitySet: entitySet.label,
        }),
        action: {
          small: true,
          icon: 'share',
          text: intl.formatMessage(messages.success_button),
          onClick: () => navigate({ pathname: getEntitySetLink(entitySet) }),
        },
      });
    }
    onSuccess && onSuccess(entitySet);
    toggleDialog();
  }

  onError(e) {
    this.setState({ processing: false });
    showWarningToast(e.message);
  }

  getTitle() {
    const { entities, intl } = this.props;
    if (!entities) {
      return intl.formatMessage(messages.title_default);
    }
    const entLength = entities.length;
    const firstCaption = entities?.[0]?.getCaption();
    const titleSecondary =
      entLength === 1
        ? ''
        : intl.formatMessage(messages.title_secondary, {
            count: entLength - 1,
          });
    return intl.formatMessage(messages.title, { firstCaption, titleSecondary });
  }

  render() {
    const {
      collection,
      isOpen,
      showTimelines = true,
      toggleDialog,
    } = this.props;
    const { processing } = this.state;

    return (
      <Drawer
        hasBackdrop={false}
        className="EntitySetSelector"
        size={Drawer.SIZE_SMALL}
        isOpen={isOpen}
        title={this.getTitle()}
        transitionDuration={200}
        onClose={() => toggleDialog()}
        autoFocus={false}
        enforceFocus={false}
        canOutsideClickClose={false}
        portalClassName="EntitySetSelector__portal-container"
      >
        <div className={c('bp3-drawer-body', { blocking: processing })}>
          {processing && (
            <div className="EntitySetSelector__overlay">
              <Spinner className="FormDialog__spinner bp3-large" />
            </div>
          )}
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
          {showTimelines && (
            <EntitySetSelectorSection
              type="timeline"
              collection={collection}
              onSelect={this.onSelect}
              onCreate={this.onCreate}
            />
          )}
        </div>
      </Drawer>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
  connect(null, {
    createEntitySetMutate,
    createEntitySetNoMutate,
    entitySetAddEntity,
  })
)(EntitySetSelector);
