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
    // console.log(this.props.result);

  }

  onSelect(selected) {
    console.log('selected', selected)
    const { query, updateQuery } = this.props;


    let newRange;
    if (Array.isArray(selected)) {
      newRange = selected.sort().map(timestamp => `${new Date(timestamp).getFullYear()}||/y`);
    } else {
      const year = new Date(selected).getFullYear();
      // const nextInterval = new Date(selected);
      // console.log('next', nextInterval);
      //
      // nextInterval.setFullYear(new Date(selected).getFullYear() + 1);
      // console.log('next', nextInterval.toISOString());
      // newRange = [selected, nextInterval.toISOString().replace(/\.\d+Z/, "")];
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

    if (!isOpen || !intervals) return null;

    return (
      <Histogram
        data={intervals.map(({label, ...rest}) => ({ label: this.getLabel(label), ...rest }))}
        onSelect={this.onSelect}
        containerProps={{
          height: 150,
        }}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query, result } = ownProps;
  const isOpen = query.hasFacet('dates');

  // console.log('query is', query, isOpen);
  // console.log('result is', result);
  const intervals = result?.facets?.dates?.intervals;


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
  // return { intervals, isOpen };
  return { intervals, isOpen };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(DateFilter);
