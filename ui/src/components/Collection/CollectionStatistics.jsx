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
    let label = name;

    if (field === 'schema') {
      label = <Schema.Smart.Label schema={name} plural icon />;
    }

    return (
      <Link to={`/search?filter:collection_id=${collection.id}&filter:${field}=${name}`}>
        <span className="label">{label}</span>
        <span className="value">
          <Numeric num={count} />
        </span>
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
                id="collection.statistics.showmore"
                defaultMessage="Show more"
              />
            )}
            statistic={statistics}
            isLoading={!statistics}
            ItemContentContainer={this.renderItem}
            styleType="dark"
          />
        </div>
      </div>
    );
  }
}

export default injectIntl(CollectionStatistics);
