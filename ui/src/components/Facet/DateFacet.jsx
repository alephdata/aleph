import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Button, Card, Icon, Intent, Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';

import { DEFAULT_START_INTERVAL, filterDateIntervals, formatDateQParam, timestampToYear } from 'components/Facet/util';


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
    const { field, query, updateQuery } = this.props;

    let newRange;
    if (Array.isArray(selected)) {
      newRange = selected.sort().map(formatDateQParam);
    } else {
      const year = formatDateQParam(selected);
      newRange = [year, year];
    }
    const newQuery = query.setFilter(`gte:${field}`, newRange[0])
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

  render() {
    const { dataLabel, emptyComponent, filteredIntervals, intl, displayShowHiddenToggle, showAll, showLabel = true } = this.props;
    let content;

    if (filteredIntervals) {
      if (!filteredIntervals.length) {
        content = emptyComponent;
      } else {
        const dataPropName = dataLabel || intl.formatMessage(messages.results);
        content = (
          <>
            <Histogram
              data={filteredIntervals.map(({ label, count, ...rest }) => ({ label: timestampToYear(label), [dataPropName]: count, ...rest }))}
              dataPropName={dataPropName}
              onSelect={this.onSelect}
              containerProps={{
                height: DATE_FACET_HEIGHT,
              }}
            />
            {(displayShowHiddenToggle || showAll) && this.renderShowHiddenToggle()}
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
  const { location, intervals, query } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  const showAll = hashQuery.show_all_dates === 'true';

  if (intervals) {
    const { filteredIntervals, hasOutOfRange } = filterDateIntervals({ query, intervals, useDefaultBounds: !showAll })
    return {
      filteredIntervals,
      displayShowHiddenToggle: hasOutOfRange,
      showAll
    };
  }
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(DateFilter);
