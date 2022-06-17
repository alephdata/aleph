// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, FormattedDate, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Button, Card, Icon, Intent, Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';
import moment from 'moment';

import withRouter from 'app/withRouter'
import { DEFAULT_START_INTERVAL, filterDateIntervals, formatDateQParam, timestampToLabel, isDateIntervalUncertain } from 'components/Facet/util';
import { selectEntitiesResult, selectLocale } from 'selectors'

import './DateFacet.scss';

const DATE_FACET_HEIGHT = 140;

const messages = defineMessages({
  results: {
    id: 'search.screen.dates_label',
    defaultMessage: 'results',
  },
  uncertainMonth: {
    id: 'search.screen.dates_uncertain_month',
    defaultMessage: '* this count includes dates in {year} where no month is specified',
  },
  uncertainDay: {
    id: 'search.screen.dates_uncertain_day',
    defaultMessage: '* this count includes dates where no day is specified',
  },
  uncertainDayMonth: {
    id: 'search.screen.dates_uncertain_day_month',
    defaultMessage: '* this count includes dates in {year} where no day or month is specified',
  },
});

export class DateFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
    this.toggleShowHidden = this.toggleShowHidden.bind(this);
  }

  onSelect(selected) {
    const { facetInterval, field, query, updateQuery } = this.props;

    let newRange;
    let newQuery = query;

    if (Array.isArray(selected)) {
      newRange = selected.sort().map(val => formatDateQParam(val, facetInterval));
    } else {

      if (facetInterval === 'year') {
        newQuery = newQuery.set(`facet_interval:${field}`, 'month')
        const end = moment.utc(selected).endOf('year').format('YYYY-MM-DD')
        newRange = [formatDateQParam(selected, 'month'), formatDateQParam(end, 'month')]
      } else if (facetInterval === 'month') {
        newQuery = newQuery.set(`facet_interval:${field}`, 'day')
        const end = moment.utc(selected).endOf('month').format('YYYY-MM-DD')
        newRange = [formatDateQParam(selected, 'day'), formatDateQParam(end, 'day')]
      } else {
        newRange = [formatDateQParam(selected, 'day'), formatDateQParam(selected, 'day')]
      }
    }
    newQuery = newQuery.setFilter(`gte:${field}`, newRange[0])
      .setFilter(`lte:${field}`, newRange[1]);

    updateQuery(newQuery)
  }

  toggleShowHidden() {
    const { query, navigate, location, showAll } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash['show_all_dates'] = !showAll;

    navigate({
      pathname: location.pathname,
      search: query.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  renderShowHiddenToggle() {
    const { showAll } = this.props;
    const button = (
      <Button minimal small intent={Intent.PRIMARY} onClick={this.toggleShowHidden}>
        <FormattedMessage
          id="search.screen.dates.show-hidden.click"
          defaultMessage="Click here"
        />
      </Button>
    );

    return (
      <div className="DateFacet__secondary text-muted">
        {!showAll && (
          <FormattedMessage
            id="search.screen.dates.show-hidden"
            defaultMessage="* Showing only date filter options from {start} to the present. { button } to view dates outside this range."
            values={{ start: DEFAULT_START_INTERVAL, button }}
          />
        )}
        {showAll && (
          <FormattedMessage
            id="search.screen.dates.show-all"
            defaultMessage="* Showing all date filter options. { button } to view recent dates only."
            values={{ button }}
          />
        )}
      </div>
    );
  }

  renderParentLabel() {
    const { facetInterval, filteredIntervals } = this.props;

    const sampleDate = filteredIntervals[0].label

    const content = facetInterval === 'month'
      ? moment.utc(sampleDate).year()
      : (
        <FormattedDate
          value={sampleDate}
          year="numeric"
          month="long"
        />
      )
    return <span className="DateFacet__parent-label">{content}</span>
  }

  formatUncertainWarning(timestamp) {
    const { facetInterval, intl } = this.props;
    const year = moment.utc(timestamp).year()

    if (facetInterval === 'month') {
      return intl.formatMessage(messages.uncertainMonth, { year })
    } else {
      const isFirstMonth = moment.utc(timestamp).month() === 0
      return intl.formatMessage(messages[isFirstMonth ? 'uncertainDayMonth' : 'uncertainDay'], { year });
    }
  }

  formatData(dataPropName) {
    const { facetInterval, filteredIntervals, locale } = this.props;

    return filteredIntervals.map(({ label, count, id }) => {
      const isUncertain = facetInterval !== 'year' && isDateIntervalUncertain(label, facetInterval)
      const uncertainWarning = isUncertain && this.formatUncertainWarning(label)

      return ({
        ...timestampToLabel(label, facetInterval, locale),
        [dataPropName]: count,
        isUncertain,
        uncertainWarning,
        id
      })
    })
  }

  render() {
    const { dataLabel, emptyComponent, facetInterval, filteredIntervals, intl, displayShowHiddenToggle, showLabel = true } = this.props;
    let content;

    if (filteredIntervals) {
      if (!filteredIntervals.length) {
        content = emptyComponent;
      } else {
        const dataPropName = dataLabel || intl.formatMessage(messages.results);

        content = (
          <>
            {facetInterval !== 'year' && this.renderParentLabel()}
            <Histogram
              data={this.formatData(dataPropName)}
              dataPropName={dataPropName}
              onSelect={this.onSelect}
              containerProps={{
                height: DATE_FACET_HEIGHT,
              }}
            />
            {displayShowHiddenToggle && this.renderShowHiddenToggle()}
          </>
        )
      }
    } else {
      content = (
        <div style={{ minHeight: `${DATE_FACET_HEIGHT}px` }}>
          <Spinner />
        </div>
      );
    }

    return (
      <Card className="DateFacet">
        {showLabel && (
          <div className="DateFacet__label">
            <Icon icon="calendar" className="left-icon" />
            <span className="DateFacet__label__text">
              <FormattedMessage id="search.screen.dates_title" defaultMessage="Dates" />
              {displayShowHiddenToggle && "*"}
            </span>
          </div>
        )}
        {content}
      </Card>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { field, location, intervals, query } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  const showAll = hashQuery.show_all_dates === 'true';
  const result = selectEntitiesResult(state, query);

  if (intervals && !result.isPending) {
    const { filteredIntervals, hasOutOfRange } = filterDateIntervals({ field, query, intervals, useDefaultBounds: !showAll })
    const locale = selectLocale(state);
    return {
      filteredIntervals,
      displayShowHiddenToggle: hasOutOfRange,
      facetInterval: query.getString(`facet_interval:${field}`),
      showAll,
      locale: locale === 'en' ? 'en-gb' : locale
    };
  }
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(DateFilter);
