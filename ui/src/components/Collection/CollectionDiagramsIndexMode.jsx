import { Component } from 'react';
// import _ from 'lodash';
// import queryString from 'query-string';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { fetchCollectionDiagrams } from 'src/actions';
import { selectCollectionDiagrams } from 'src/selectors';
// import ErrorScreen from 'src/components/Screen/ErrorScreen';
// import DiagramCreateButton from 'src/components/Toolbar/DiagramCreateButton';
// import DiagramList from 'src/components/Diagram/DiagramList';


// import './CollectionDiagramsIndexMode.scss';

export class CollectionDiagramsIndexMode extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    // this.fetchIfNeeded()
  }

  fetchIfNeeded() {
    const { collection } = this.props;
    this.props.fetchCollectionDiagrams(collection.id);
  }

  render() {
    const { diagrams, state } = this.props;

    // if (result.isError) {
    //   return <ErrorScreen error={result.error} />;
    // }

    // return (
    //   <DiagramList query={query} />
    // );

    return null;
  }
}

const mapStateToProps = (state, ownProps) => ({
  state,
  collectionDiagrams: selectCollectionDiagrams(state, ownProps.collection.id),
});


export default compose(
  connect(mapStateToProps, { fetchCollectionDiagrams }),
  withRouter,
)(CollectionDiagramsIndexMode);
