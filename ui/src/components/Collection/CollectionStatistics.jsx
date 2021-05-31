import _ from 'lodash';
import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import SearchField from 'components/SearchField/SearchField';
import { getGroupField } from 'components/SearchField/util';
import { Country, Numeric, Schema, Statistics } from 'components/common';
import { selectCollection, selectModel } from 'selectors';
import { collectionSearchQuery } from 'queries';
import getCollectionLink from 'util/getCollectionLink';
import collectionViewIds from 'components/Collection/collectionViewIds';

import './CollectionStatistics.scss';

class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);
    this.filterValues = this.filterValues.bind(this);
    this.getLabel = this.getLabel.bind(this);
    this.getLink = this.getLink.bind(this);
  }

  filterValues(count, value) {
    const { field, model } = this.props;
    if (field === 'schema') {
      const schema = model.getSchema(value);
      return schema.isThing();
    }
    return true;
  }

  getLabel(name) {
    const { field } = this.props;

    if (field === 'schema') {
      return <Schema.Label schema={name} plural icon />;
    } else if (field === 'countries') {
      return <Country.Name code={name} />;
    } else {
      return name;
    }
  }

  getLink(value) {
    const { collection, field, baseQuery } = this.props;
    const newQuery = baseQuery.setFilter(field, value);

    return getCollectionLink({
      collection,
      mode: collectionViewIds.SEARCH,
      search: newQuery.toLocation()
    });
  }

  render() {
    const { field, total, values } = this.props;
    const filteredValues = _.pickBy(values, this.filterValues);
    const filteredTotal = field === 'schema' ? Object.keys(filteredValues).length : total;

    return (
      <div className={c("CollectionStatistics bp3-card bp3-elevation-1", { [Classes.SKELETON]: !values })}>
        <div className="CollectionStatistics__heading">
          <h5 className="CollectionStatistics__heading__total">
            <Numeric num={filteredTotal} abbr={3} />
          </h5>
          <h5 className="CollectionStatistics__heading__label">
            <SearchField.Label field={getGroupField(field)} count={filteredTotal} icon />
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
          itemLink={this.getLink}
          itemLabel={this.getLabel}
          ItemContentContainer={this.renderItem}
          styleType="dark"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const baseQuery = collectionSearchQuery(location, collectionId);
  return {
    model: selectModel(state),
    collection: selectCollection(state, collectionId),
    baseQuery,
  };
};

export default compose(
  injectIntl,
  withRouter,
  connect(mapStateToProps),
)(CollectionStatistics);
