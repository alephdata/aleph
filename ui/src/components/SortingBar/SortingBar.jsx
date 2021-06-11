import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Button, Intent, MenuItem } from '@blueprintjs/core';

import SortingBarSelect from 'components/SortingBar/SortingBarSelect';

import './SortingBar.scss';

const messages = defineMessages({
  created_at: {
    id: 'sorting.bar.created_at',
    defaultMessage: 'Creation Date',
  },
  updated_at: {
    id: 'sorting.bar.updated_at',
    defaultMessage: 'Update Date',
  },
  count: {
    id: 'sorting.bar.count',
    defaultMessage: 'Size',
  },
  label: {
    id: 'sorting.bar.label',
    defaultMessage: 'Title',
  },
  caption: {
    id: 'sorting.bar.caption',
    defaultMessage: 'Title',
  },
  dates: {
    id: 'sorting.bar.dates',
    defaultMessage: 'Dates',
  },
  countries: {
    id: 'sorting.bar.countries',
    defaultMessage: 'Countries',
  },
  collection_id: {
    id: 'sorting.bar.collection_id',
    defaultMessage: 'Dataset',
  },
  'properties.date': {
    id: 'sorting.bar.date',
    defaultMessage: 'Date',
  },
  'properties.endDate': {
    id: 'sorting.bar.endDate',
    defaultMessage: 'End date',
  },
  filter_button_label: {
    id: 'sorting.bar.button.label',
    defaultMessage: 'Show:',
  },
});

class SortingBar extends Component {
  constructor(props) {
    super(props);
    this.onSort = this.onSort.bind(this);
  }

  renderOption = (field, { handleClick }) => {
    const { intl } = this.props;
    return (
      <MenuItem
        key={field}
        onClick={handleClick}
        text={intl.formatMessage(field)}
      />
    );
  }

  onSort({ field, direction }) {
    const { query, sortDirection, sortField, updateQuery } = this.props;

    const newQuery = query.sortBy(field || sortField, direction || sortDirection);
    updateQuery(newQuery);
  }

  renderSortingButtons() {
    const { intl, sortingFields, sortDirection, sortField } = this.props;

    const sortingItems = sortingFields.map(field => ({ field, label: intl.formatMessage(messages[field]) }));

    let activeSort = sortingItems.filter(({ field }) => field === sortField);
    activeSort = activeSort.length ? activeSort[0] : sortingItems[0];

    return (
      <>
        <div className="SortingBar__item">
          <span className="SortingBar__label">
            <FormattedMessage
              id="sorting.bar.sort"
              defaultMessage="Sort by:"
            />
          </span>
          <div className="SortingBar__control">
            <SortingBarSelect
              items={sortingItems}
              onSelect={this.onSort}
              activeItem={activeSort}
            />
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
      </>
    );
  }

  render() {
    const { intl, filterButton, filterButtonLabel, sortingFields } = this.props;

    return (
      <div className="SortingBar">
        {filterButton && (
          <div className="SortingBar__item">
            <span className="SortingBar__label">
              {filterButtonLabel !== undefined ? filterButtonLabel : intl.formatMessage(messages.filter_button_label)}
            </span>
            <div className="SortingBar__control">
              {filterButton}
            </div>
          </div>
        )}
        {sortingFields && this.renderSortingButtons()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query, sortingFields } = ownProps;

  if (sortingFields) {
    const { field, direction } = query.getSort();

    return {
      sortField: field,
      sortDirection: direction,
    };
  }
  return {}
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(SortingBar);
