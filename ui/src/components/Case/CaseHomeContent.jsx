import React, { Component } from 'react';
import { connect } from "react-redux";

import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
import { fetchCollection } from "src/actions";
import { selectCollection } from "src/selectors";

class CaseHomeContent extends Component {

  constructor() {
    super();
  }

  async componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
    this.setState({result: this.props.result})
  }

  componentDidUpdate(prevProps) {
    const { collectionId } = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const {collection} = this.props;

    return (
      <CaseScreen className='CaseHome' activeTab='Home'>

      </CaseScreen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId) };
};

CaseHomeContent = connect(mapStateToProps, {fetchCollection})(CaseHomeContent);
export default CaseHomeContent;
