import React, { Component } from 'react';
import { Button, Collapse, Divider, Drawer, Icon, InputGroup, Intent, Tooltip } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { createEntitySet, queryEntitySets, updateEntitySet } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { Count, EntitySet, SearchBox } from 'components/common';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';
import { showSuccessToast, showWarningToast } from 'app/toast';
import getEntitySetLink from 'util/getEntitySetLink';

import './EntitySetSelectorSection.scss';

const messages = defineMessages({
  create: {
    id: 'entityset.selector.create_new',
    defaultMessage: 'Create a new {type}',
  },
  empty: {
    id: 'entityset.selector.select_empty',
    defaultMessage: 'No existing {type}',
  },
});


class EntitySetSelectorSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      processing: false,
      createIsOpen: false,
      createLabel: '',
      expanded: true
    };

    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.toggleCreate = this.toggleCreate.bind(this);
    this.toggleExpand = this.toggleExpand.bind(this);

  }

  componentDidUpdate() {
    this.fetchIfNeeded()
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntitySets({ query });
    }
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  toggleCreate() {
    this.setState(({ createIsOpen }) => ({
      createIsOpen: !createIsOpen
    }));
  }

  toggleExpand() {
    this.setState(({ expanded }) => ({
      expanded: !expanded
    }))
  }

  render() {
    const { query, intl, onSelect, result, type } = this.props;
    const { createIsOpen, expanded, label } = this.state;

    const typeLabel = EntitySet.getTypeLabel(intl, type, {});

    return (
      <div className="EntitySetSelectorSection">
        <Button
          minimal
          fill
          onClick={this.toggleExpand}
          icon={expanded ? 'chevron-down' : 'chevron-up'}
          rightIcon={<Count count={result.total} />}
          className="EntitySetSelectorSection__title"
        >
          <h5 className="bp3-heading">
            {EntitySet.getTypeLabel(intl, type, { plural: true, capitalize: true })}
          </h5>
        </Button>
        <Collapse isOpen={expanded}>
          <div className="EntitySetSelector__section__content">
            <Tooltip
              content={intl.formatMessage(messages.create, {type: typeLabel})}
            >
              <Button
                icon="add"
                minimal
                small
                intent={Intent.PRIMARY}
                onClick={this.toggleCreate}
              >
                <FormattedMessage
                  id="entityset.selector.add_new"
                  defaultMessage="Create new"
                />
              </Button>
            </Tooltip>
            {createIsOpen && (
              <form onSubmit={this.onCreate}>
                <InputGroup
                  fill
                  leftIcon="graph"
                  placeholder={intl.formatMessage(messages.create, {type: typeLabel})}
                  rightElement={
                    <Button icon="arrow-right" minimal type="submit" />
                  }
                  onChange={this.onChangeLabel}
                  value={label}
                />
              </form>
            )}
            <EntitySetIndex
              query={query}
              result={result}
              onSelect={onSelect}
              type={type}
            />
          </div>
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, queryText, type } = ownProps;
  const query = queryCollectionEntitySets(location, collection.id)
    .setFilter('type', type)
    .limit(10)
    .set('q', queryText)

  return {
    query,
    result: selectEntitySetsResult(state, query),
  };
};

export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { queryEntitySets }),
)(EntitySetSelectorSection);
