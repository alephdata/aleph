// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import CollectionStatistics from './CollectionStatistics';
import CollectionDateHistogram from './CollectionDateHistogram';
import { selectCollection } from 'selectors';

import './CollectionStatisticsGroup.scss';

const statFields = [
  'schema', 'countries', 'names', 'emails', 'addresses', 'ibans', 'phones',
];

class CollectionStatisticsGroup extends React.Component {
  renderStatisticsItem({ key, total, values }) {
    const { collectionId } = this.props;
    return (
      <div className="CollectionStatisticsGroup__item" key={key}>
        <CollectionStatistics
          collectionId={collectionId}
          field={key}
          values={values}
          total={total}
        />
      </div>
    );
  }

  render() {
    const { collectionId, emptyComponent, isPending, statsToRender } = this.props;
    const skeletonItems = [...Array(3).keys()];

    if (!isPending && !statsToRender.length) {
      return emptyComponent;
    }

    return (
      <div className="CollectionStatisticsGroup">
        <CollectionDateHistogram collectionId={collectionId} className="CollectionStatisticsGroup__item" />
        {isPending && skeletonItems.map((key) => this.renderStatisticsItem({ key }))}
        {!isPending && statsToRender.map((stat) => this.renderStatisticsItem(stat))}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  const collection = selectCollection(state, collectionId);
  const { statistics } = collection;

  if (!statistics) {
    return { isPending: true, statsToRender: [] };
  }

  const statsToRender = statFields.map(key => ({ key, ...statistics[key] }))
    .filter(stat => stat && stat.total);

  return { statsToRender };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionStatisticsGroup);
