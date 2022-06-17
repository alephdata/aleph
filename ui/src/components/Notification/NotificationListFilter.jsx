// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import _ from 'lodash';
import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import SortingBar from 'components/SortingBar/SortingBar';
import SortingBarSelect from 'components/SortingBar/SortingBarSelect';


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
      <SortingBar
        filterButton={(
          <SortingBarSelect
            items={typeOptions}
            onSelect={this.onSelect}
            activeItem={activeItem}
          />
        )}
      />
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
