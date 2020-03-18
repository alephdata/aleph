import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Country, Facet, Numeric, Schema } from 'src/components/common';
import Statistics from 'src/components/StatisticsGroup/Statistics';

import './CollectionStatistics.scss';


class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);
    this.renderItem = this.renderItem.bind(this);
  }

  renderItem({ name, count }) {
    const { collection, field } = this.props;
    const linkFilterVal = encodeURIComponent(name);
    let label = name;

    if (field === 'schema') {
      label = <Schema.Label schema={name} plural icon />;
    } else if (field === 'countries') {
      label = <Country.Name code={name} />;
    }

    return (
      <Link to={`/search?filter:collection_id=${collection.id}&filter:${field}=${linkFilterVal}`}>
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
    const { field, total, values } = this.props;

    return (
      <div className="CollectionStatistics bp3-card bp3-elevation-1">
        <div className="CollectionStatistics__heading">
          <h5 className="CollectionStatistics__heading__total">
            <Numeric num={total} abbr={3} />
          </h5>
          <h5 className="CollectionStatistics__heading__label">
            <Facet.Label field={field} count={total} />
          </h5>
        </div>
        <Statistics
          seeMoreButtonText={() => (
            <FormattedMessage
              id="collection.statistics.showmore"
              defaultMessage="Show more"
            />
          )}
          statistic={values}
          isLoading={!values}
          ItemContentContainer={this.renderItem}
          styleType="dark"
        />
      </div>
    );
  }
}

export default injectIntl(CollectionStatistics);
