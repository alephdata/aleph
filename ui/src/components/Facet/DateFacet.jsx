import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, FormattedDate, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Button, Card, Icon, Intent, Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';

import { DEFAULT_START_INTERVAL, filterDateIntervals, formatDateQParam, timestampToLabel, isDateIntervalUncertain } from 'components/Facet/util';
import { selectLocale } from 'selectors'

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
    this.toggleShowHidden = this.toggleShowHidden.bind(this);
  }

  onSelect(selected) {
    const { facetInterval, field, query, updateQuery } = this.props;

    let newRange;
    let newQuery = query;

    if (Array.isArray(selected)) {
      newRange = selected.sort().map(val => formatDateQParam(val, facetInterval));
    } else {
      const dateObj = new Date(`${selected}Z`)
      if (facetInterval === 'year') {
        newQuery = newQuery.set(`facet_interval:${field}`, 'month')
        const end = dateObj.setFullYear(dateObj.getFullYear() + 1)
        newRange = [formatDateQParam(selected, 'month'), formatDateQParam(new Date(end - 1).toISOString(), 'month')]
      } else if (facetInterval === 'month') {
        newQuery = newQuery.set(`facet_interval:${field}`, 'day')
        const end = dateObj.setMonth(dateObj.getMonth() + 1)
        newRange = [formatDateQParam(selected, 'day'), formatDateQParam(new Date(end - 1).toISOString(), 'day')]
      } else {
        newRange = [formatDateQParam(selected, 'day'), formatDateQParam(selected, 'day')]
      }
    }
    newQuery = newQuery.setFilter(`gte:${field}`, newRange[0])
      .setFilter(`lte:${field}`, newRange[1]);

    updateQuery(newQuery)
  }

  toggleShowHidden() {
    const { query, history, location, showAll } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash['show_all_dates'] = !showAll;

    history.push({
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
      ? new Date(sampleDate).getFullYear()
      : (
        <FormattedDate
          value={sampleDate}
          year="numeric"
          month="long"
        />
      )
    return <span className="DateFacet__parent-label">{content}</span>
  }

  formatData(dataPropName) {
    const { facetInterval, filteredIntervals, locale } = this.props;

    return filteredIntervals.map(({ label, count, id }) => {
      const isUncertain = facetInterval !== 'year' && isDateIntervalUncertain(label, facetInterval)
      return ({
        ...timestampToLabel(label, facetInterval, locale, isUncertain),
        [dataPropName]: count,
        isUncertain,
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

        console.log(this.formatData(dataPropName))

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

  if (intervals) {
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
