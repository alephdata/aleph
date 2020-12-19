import _ from 'lodash';
import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Alignment, Button, Intent, MenuItem } from '@blueprintjs/core';

import { Count, SelectWrapper } from 'components/common';

import 'src/components/common/SortingBar.scss';

const messages = defineMessages({
  filter_all: {
    id: 'notifications.type_filter.all',
    defaultMessage: 'All',
  },
});

class NotificationListFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  renderOption = (option, { handleClick }) => (
    <MenuItem
      key={option.field || 'all'}
      onClick={handleClick}
      text={option.label}
      label={<Count count={option.count} />}
    />
  )

  onSelect(selected) {
    const { query, updateQuery } = this.props;
    const newQuery = query.setFilter('event', selected.id)
    updateQuery(newQuery)
  }

  render() {
    const { eventFacetVals, intl } = this.props;

    const defaultOption = {
      label: intl.formatMessage(messages.filter_all),
      count: _.sumBy(eventFacetVals, val => val.count),
    }

    const typeOptions = [defaultOption, ...eventFacetVals];
    const activeItem = typeOptions.find(item => item.active) || defaultOption;

    return (
      <div className="SortingBar">
        <span className="SortingBar__label">
          <FormattedMessage
            id="notifications.type_filter"
            defaultMessage="Show:"
          />
        </span>
        <div className="SortingBar__control">
          <SelectWrapper
            itemRenderer={this.renderOption}
            items={typeOptions}
            onItemSelect={this.onSelect}
            activeItem={activeItem}
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
              text={activeItem?.label}
              alignText={Alignment.LEFT}
              minimal
              intent={Intent.PRIMARY}
              rightIcon="caret-down"
            />
          </SelectWrapper>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { result } = ownProps;
  const eventFacetVals = result?.facets?.event?.values || [];
  return { eventFacetVals };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(NotificationListFilter);
