import React, { Component } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { Spinner } from '@blueprintjs/core';
import { Histogram } from '@alephdata/react-ftm';

import './DateFacet.scss';


export class DateFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(selected) {
    const { query, updateQuery } = this.props;

    let newRange;
    if (Array.isArray(selected)) {
      newRange = selected.sort().map(timestamp => `${new Date(timestamp).getFullYear()}||/y`);
    } else {
      const year = new Date(selected).getFullYear();
      newRange = [`${year}||/y`, `${year}||/y`]
    }
    const newQuery = query.setFilter('gte:dates', newRange[0])
      .setFilter('lte:dates', newRange[1]);

    this.props.updateQuery(newQuery)
  }

  getLabel(timestamp) {
    return new Date(timestamp).getFullYear();
  }

  render() {
    const { intervals, isOpen } = this.props;
    if (!isOpen || (intervals && intervals.length <= 1)) return null;

    if (!intervals) {
      return (
        <div className="DateFacet">
          <Spinner />
        </div>
      )
    }

    return (
      <div className="DateFacet">
        <Histogram
          data={intervals.map(({label, ...rest}) => ({ label: this.getLabel(label), ...rest }))}
          onSelect={this.onSelect}
          containerProps={{
            height: 150,
          }}
        />
      </div>
    );
  }
}

export default compose(
  withRouter,
)(DateFilter);
