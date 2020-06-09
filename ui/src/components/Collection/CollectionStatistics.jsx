import _ from 'lodash';
import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { Country, Facet, Numeric, Schema } from 'src/components/common';
import Statistics from 'src/components/StatisticsGroup/Statistics';
import { selectModel } from 'src/selectors';
import getStatLink from 'src/util/getStatLink';

import './CollectionStatistics.scss';


class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);
    this.filterValues = this.filterValues.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  filterValues(count, value) {
    const { field, model } = this.props;
    if (field === 'schema') {
      const schema = model.getSchema(value);
      return schema.isThing();
    }
    return true;
  }

  renderItem({ name, count }) {
    const { collection, field } = this.props;
    const link = getStatLink(collection, field, name);
    let label = name;

    if (field === 'schema') {
      label = <Schema.Label schema={name} plural icon />;
    } else if (field === 'countries') {
      label = <Country.Name code={name} />;
    }

    return (
      <Link to={link}>
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
    const { field, values } = this.props;
    const filteredValues = _.pickBy(values, this.filterValues);
    const total = filteredValues ? Object.keys(filteredValues).length : 0;
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
          statistic={filteredValues}
          isPending={!values}
          ItemContentContainer={this.renderItem}
          styleType="dark"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { model: selectModel(state) };
};

export default compose(
  injectIntl,
  connect(mapStateToProps),
)(CollectionStatistics);
