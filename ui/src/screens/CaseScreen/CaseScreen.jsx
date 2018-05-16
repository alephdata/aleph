import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { Screen, Breadcrumbs, DualPane, ErrorScreen } from 'src/components/common';
import { CaseInfo } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { withRouter } from "react-router";
import { selectCollection } from "../../selectors";
import { fetchCollection } from "../../actions";

class CaseScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: []
    }
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

    if (collection.isError) {
      return <ErrorScreen error={collection.error}/>;
    }

    return (
      <Screen title={collection.label} breadcrumbs={<Breadcrumbs collection={collection}/>}>
        <DualPane>
          <CaseInfo collection={collection}/>
          <div>
            {this.props.children}
          </div>
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId) };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = connect(mapStateToProps, {queryCollections, fetchCollection})(CaseScreen);
CaseScreen = withRouter(CaseScreen);
export default (CaseScreen);
