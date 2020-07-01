import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Histogram } from '@alephdata/react-ftm';


export class DateFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidMount() {
    console.log(this.props.result);

  }

  onSelect(selected) {
    console.log('selected', selected)
    const { query, updateQuery } = this.props;
    let newRange;
    if (isArray(selected)) {
      newRange = selected.sort();
    } else {
      newRange = [selected, //selected plus 1 year]
    }
    query.setFilter('gte:dates', newRange[0])
      .setFilter('lte:dates', newRange[1]);

    this.props.updateQuery(query)
  }

  render() {
    const { intervals, isOpen } = this.props;

    if (!isOpen) return null;

    return (
      <Histogram
        data={intervals}
        onSelect={this.onSelect}
        containerProps={{
          aspect: 5,
          minHeight: 200,
        }}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  // const { location } = ownProps;
  const isOpen = query.hasFacet('dates');
  const intervals =


  // const context = {
  //   highlight: true,
  //   'filter:schemata': 'Thing',
  //   // 'filter:gte:properties.birthDate': '2000-03-01',
  //   // 'filter:lte:properties.birthDate': '2020-05-05',
  //   'facet': 'dates',
  //   'facet_interval:dates': 'year',
  // };
  //
  // console.log(context);
  // const result = selectEntitiesResult(state, query);
  return { intervals, isOpen };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(DateFilter);
