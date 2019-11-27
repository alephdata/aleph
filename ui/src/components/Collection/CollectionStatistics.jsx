import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Facet, Numeric, Schema } from 'src/components/common';
import Statistics from 'src/components/StatisticsGroup/Statistics';


import './CollectionStatistics.scss';

class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);

    this.renderItem = this.renderItem.bind(this);
  }

  renderItem({ name, count }) {
    const { collection, field } = this.props;

    if (field === 'schema') {
      return (
        <Schema.Smart.Link
          schema={name}
          plural
          url={`/search?filter:collection_id=${collection.id}&filter:schema=${name}`}
        >
          <Numeric num={count} />
        </Schema.Smart.Link>
      );
    }

    return (
      <Link to={`/search?filter:collection_id=${collection.id}&filter:${field}=${name}`}>
        {name}
        <Numeric num={count} />
      </Link>
    );
  }

  render() {
    const { field, statistics } = this.props;

    return (
      <div className="CollectionStatistics">
        <div className="CollectionStatistics__inner-container">
          <Statistics
            headline={<Facet.Label field={field} />}
            seeMoreButtonText={() => (
              <FormattedMessage
                id="home.statistics.othertypes"
                defaultMessage="Show more"
              />
            )}
            statistic={statistics}
            isLoading={!statistics}
            ItemContentContainer={this.renderItem}
          />
        </div>
      </div>
    );
  }
}

export default injectIntl(CollectionStatistics);
