import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Alignment, Button, Intent, MenuItem } from '@blueprintjs/core';

import { selectCurrentRole } from 'selectors';
import SelectWrapper from 'components/common/SelectWrapper';

import './SortingBar.scss';

const messages = defineMessages({
  sort_created_at: {
    id: 'collection.index.sort.created_at',
    defaultMessage: 'Creation Date',
  },
  sort_updated_at: {
    id: 'collection.index.sort.updated_at',
    defaultMessage: 'Update Date',
  },
  sort_count: {
    id: 'collection.index.sort.count',
    defaultMessage: 'Size',
  },
  sort_label: {
    id: 'collection.index.sort.label',
    defaultMessage: 'Title',
  },
  show_mine: {
    id: 'collection.index.filter.mine',
    defaultMessage: 'Created by me',
  },
  show_all: {
    id: 'collection.index.filter.all',
    defaultMessage: 'All',
  },
});

class SortingBar extends Component {
  constructor(props) {
    super(props);
    this.onSort = this.onSort.bind(this);
    this.toggleCreatedBy = this.toggleCreatedBy.bind(this);
  }

  renderOption = (option, { handleClick }) => (
    <MenuItem
      key={option.field}
      onClick={handleClick}
      text={option.label}
    />
  )

  getSortingOptions() {
    const { intl } = this.props;
    return [
      { field: 'created_at', label: intl.formatMessage(messages.sort_created_at) },
      { field: 'count', label: intl.formatMessage(messages.sort_count) },
      { field: 'label', label: intl.formatMessage(messages.sort_label) },
      { field: 'updated_at', label: intl.formatMessage(messages.sort_updated_at) },
    ];
  }

  onSort({ field, direction }) {
    const { query, sortDirection, sortField, updateQuery } = this.props;
    const newQuery = query.sortBy(field || sortField, direction || sortDirection);
    updateQuery(newQuery);
  }

  toggleCreatedBy() {
    const { createdByFilterVal, query, role, updateQuery } = this.props;
    const newQuery = createdByFilterVal.length ? query.clearFilter('creator_id') : query.setFilter('creator_id', role.id);
    updateQuery(newQuery);
  }

  render() {
    const { createdByFilterVal, intl, sortDirection, sortField, showCreatedByFilter } = this.props;

    const sortingOptions = this.getSortingOptions();
    let activeSort = sortingOptions.filter(({ field }) => field === sortField);
    activeSort = activeSort.length ? activeSort[0] : sortingOptions[0];

    return (
      <div className="SortingBar">
        {showCreatedByFilter && (
          <div className="SortingBar__item">
            <span className="SortingBar__label">
              <FormattedMessage
                id="sorting.bar.created_by"
                defaultMessage="Show:"
              />
            </span>
            <div className="SortingBar__control">
              <Button
                text={intl.formatMessage(createdByFilterVal.length ? messages.show_mine : messages.show_all)}
                onClick={this.toggleCreatedBy}
                minimal
                intent={Intent.PRIMARY}
              />
            </div>
          </div>
        )}
        <div className="SortingBar__item">
          <span className="SortingBar__label">
            <FormattedMessage
              id="sorting.bar.sort"
              defaultMessage="Sort by:"
            />
          </span>
          <div className="SortingBar__control">
            <SelectWrapper
              itemRenderer={this.renderOption}
              items={sortingOptions}
              onItemSelect={this.onSort}
              activeItem={activeSort}
              popoverProps={{
                minimal: true,
                fill: false,
                className: 'SortingBar__item__popover',
              }}
              inputProps={{
                fill: false,
              }}
              filterable={false}
              resetOnClose
              resetOnSelect
            >
              <Button
                text={activeSort.label}
                alignText={Alignment.LEFT}
                minimal
                intent={Intent.PRIMARY}
                rightIcon="caret-down"
              />
            </SelectWrapper>
          </div>
        </div>
        <div className="SortingBar__item">
          <span className="SortingBar__label">
            <FormattedMessage
              id="sorting.bar.direction"
              defaultMessage="Direction:"
            />
          </span>
          <div className="SortingBar__control">
            <Button
              icon={sortDirection === 'desc' ? 'arrow-down' : 'arrow-up'}
              onClick={() => this.onSort({ direction: sortDirection === 'desc' ? 'asc' : 'desc' })}
              minimal
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const { field, direction } = query.getSort();
  const createdByFilterVal = query.getFilter('creator_id');
  const role = selectCurrentRole(state);

  return {
    role,
    sortField: field,
    sortDirection: direction,
    createdByFilterVal
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(SortingBar);
