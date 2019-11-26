import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { fetchCollectionStatistics } from 'src/actions';
import { selectCollectionStatistics } from 'src/selectors';


class CollectionStatisticsMode extends React.PureComponent {
  // constructor(props) {
  //   super(props);
  // }

  componentDidMount() {
    const { collection } = this.props;
    this.props.fetchCollectionStatistics(collection);
  }

  render() {
    const { collection, statistics } = this.props;

    console.log(collection, statistics);
    return null;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    statistics: selectCollectionStatistics(state, collection.id),
  };
};

const mapDispatchToProps = { fetchCollectionStatistics };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionStatisticsMode);
