import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Facet, Numeric, Schema } from 'src/components/common';
import Statistics from 'src/components/StatisticsGroup/Statistics';

import './CollectionStatistics.scss';

const messages = defineMessages({
  search_placeholder: {
    id: 'collection.statistics.searchPlaceholder',
    defaultMessage: 'Search {field}',
  },
  search_placeholder_subset: {
    id: 'collection.statistics.searchPlaceholderSubset',
    defaultMessage: 'Search top {statLength} {field}',
  },
});

const maxQueryLength = 300;

class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);

    this.renderItem = this.renderItem.bind(this);
  }

  renderItem({ name, count }) {
    const { collection, field } = this.props;
    let label = name;

    if (field === 'schema') {
      label = <Schema.Smart.Label schema={name} plural icon />;
    }

    return (
      <Link target="_blank" to={`/search?filter:collection_id=${collection.id}&filter:${field}=${name}`}>
        <div className="inner-container">
          <span className="label">{label}</span>
          <span className="value">
            <Numeric num={count} />
          </span>
        </div>
      </Link>
    );
  }

  render() {
    const { field, intl, statistics } = this.props;

    const statLength = Object.keys(statistics).length;
    const isSubset = statLength === maxQueryLength;

    return (
      <div className="CollectionStatistics">
        <div className="CollectionStatistics__inner-container">
          <div className="CollectionStatistics__heading">
            <h5 className="CollectionStatistics__heading__total">
              <Numeric num={Object.keys(statistics).length} abbr={3} />
            </h5>
            <h5 className="CollectionStatistics__heading__label">
              <Facet.Label field={field} />
            </h5>
          </div>
          <Statistics
            seeMoreButtonText={() => (
              <FormattedMessage
                id="collection.statistics.showmore"
                defaultMessage="Show more"
              />
            )}
            statistic={statistics}
            isLoading={!statistics}
            ItemContentContainer={this.renderItem}
            styleType="dark"
            hasFilter={statLength > 15}
            filterPlaceholder={
              isSubset
                ? intl.formatMessage(messages.search_placeholder_subset, { field, statLength })
                : intl.formatMessage(messages.search_placeholder, { field })
            }
          />
        </div>
      </div>
    );
  }
}

export default injectIntl(CollectionStatistics);
