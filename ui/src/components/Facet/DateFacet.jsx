import React, { Component } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Card, Icon, Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';
import { formatDateQParam } from 'components/Facet/util';

import './DateFacet.scss';

const DATE_FACET_HEIGHT = 140;

const messages = defineMessages({
  results: {
    id: 'search.screen.dates_label',
    defaultMessage: 'results',
  },
});

export class DateFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(selected) {
    const { query, updateQuery } = this.props;

    let newRange;
    if (Array.isArray(selected)) {
      newRange = selected.sort().map(formatDateQParam);
    } else {
      const year = formatDateQParam(selected);
      newRange = [year, year];
    }
    const newQuery = query.setFilter('gte:dates', newRange[0])
      .setFilter('lte:dates', newRange[1]);

    updateQuery(newQuery)
  }

  getLabel(timestamp) {
    return new Date(timestamp).getFullYear();
  }

  render() {
    const { intervals, intl, isOpen } = this.props;
    if (!isOpen || (intervals && intervals.length <= 1)) return null;
    let content;

    if (intervals) {
      const dataPropName = intl.formatMessage(messages.results);
      content = (
        <Histogram
          data={intervals.map(({label, count, ...rest}) => ({ label: this.getLabel(label), [dataPropName]: count, ...rest }))}
          dataPropName={dataPropName}
          onSelect={this.onSelect}
          containerProps={{
            height: DATE_FACET_HEIGHT,
          }}
        />
      )
    } else {
      content = (
        <div style={{ minHeight: `${DATE_FACET_HEIGHT}px`}}>
          <Spinner  />
        </div>
      );
    }

    return (
      <Card className="DateFacet">
        <div className="DateFacet__label">
          <Icon icon="calendar" className="left-icon" />
          <span className="DateFacet__label__text">
            <FormattedMessage id="search.screen.dates_title" defaultMessage="Dates" />
          </span>
        </div>
        {content}
      </Card>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(DateFilter);
