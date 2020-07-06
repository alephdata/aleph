import React, { Component } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Card, Icon, Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';
import { formatDateQParam } from 'src/components/Facet/util';

import './DateFacet.scss';

const DATE_FACET_HEIGHT = 140;

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
    const { intervals, isOpen } = this.props;
    if (!isOpen || (intervals && intervals.length <= 1)) return null;
    let content;

    if (intervals) {
      content = (
        <Histogram
          data={intervals.map(({label, ...rest}) => ({ label: this.getLabel(label), ...rest }))}
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
