import React, { Component } from 'react';
import { Button, ButtonGroup, Collapse, InputGroup, Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { queryEntitySets } from 'actions';
import { collectionEntitySetsQuery } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { Count, EntitySet } from 'components/common';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';

import './EntitySetSelectorSection.scss';

const messages = defineMessages({
  list: {
    id: 'lists',
    defaultMessage: 'Lists',
  },
  list_create: {
    id: 'list.selector.create',
    defaultMessage: 'Create a new list',
  },
  list_empty: {
    id: 'list.selector.select_empty',
    defaultMessage: 'No existing list',
  },
  diagram: {
    id: 'diagrams',
    defaultMessage: 'Diagrams',
  },
  diagram_create: {
    id: 'diagram.selector.create',
    defaultMessage: 'Create a new diagram',
  },
  diagram_empty: {
    id: 'diagram.selector.select_empty',
    defaultMessage: 'No existing diagram',
  },
  timeline: {
    id: 'timelines',
    defaultMessage: 'Timelines',
  },
  timeline_create: {
    id: 'timeline.selector.create',
    defaultMessage: 'Create a new timeline',
  },
  timeline_empty: {
    id: 'timeline.selector.select_empty',
    defaultMessage: 'No existing timeline',
  },
});


class EntitySetSelectorSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      processing: false,
      createIsOpen: false,
      expanded: true
    };

    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.toggleCreate = this.toggleCreate.bind(this);
    this.toggleExpand = this.toggleExpand.bind(this);
  }

  onChangeLabel(e) {
    e.preventDefault();
    this.setState({ label: e.target.value });
  }

  toggleCreate() {
    this.setState(({ createIsOpen }) => ({
      createIsOpen: !createIsOpen
    }));
  }

  toggleExpand() {
    this.setState(({ expanded }) => ({
      expanded: !expanded,
      createIsOpen: false
    }))
  }

  onCreate = (e) => {
    const { onCreate, type } = this.props;
    const { label } = this.state;
    e.preventDefault();
    e.stopPropagation();

    onCreate(type, label);
  }

  render() {
    const { query, intl, onSelect, result, type } = this.props;
    const { createIsOpen, expanded, label } = this.state;

    return (
      <div className="EntitySetSelectorSection">
        <ButtonGroup
          minimal
          fill
          className="EntitySetSelectorSection__title-container"
        >
          <Button
            fill
            onClick={this.toggleExpand}
            rightIcon={<Count count={result.total} />}
            className="EntitySetSelectorSection__title"
          >
            <h5 className="bp3-heading">
              {intl.formatMessage(messages[type])}
            </h5>
          </Button>
          <Tooltip
            content={intl.formatMessage(messages[`${type}_create`])}
          >
            <Button
              icon="add"
              onClick={this.toggleCreate}
            />
          </Tooltip>
        </ButtonGroup>
        <Collapse isOpen={createIsOpen}>
          <div className="EntitySetSelectorSection__create">
            <form onSubmit={this.onCreate}>
              <InputGroup
                fill
                leftIcon={<EntitySet.Icon entitySet={{ type }} />}
                placeholder={intl.formatMessage(messages[`${type}_create`])}
                rightElement={
                  <Button icon="arrow-right" minimal type="submit" />
                }
                onChange={this.onChangeLabel}
                value={label}
              />
            </form>
          </div>
        </Collapse>
        <Collapse isOpen={expanded}>
          <div className="EntitySetSelectorSection__content">
            <EntitySetIndex
              query={query}
              result={result}
              onSelect={onSelect}
              type={type}
              loadOnScroll={false}
            />
          </div>
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, type } = ownProps;

  const query = collectionEntitySetsQuery(location, collection.id)
    .setFilter('type', type)
    .sortBy('label', 'asc')
    .limit(10);

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
