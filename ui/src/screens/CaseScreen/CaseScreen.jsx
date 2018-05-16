import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

<<<<<<< HEAD
import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection, ErrorScreen } from 'src/components/common';
import { CaseInfo, CaseContent, CaseDocumentsContent } from 'src/components/Case';
import { queryCollections } from "../../actions";
import { selectCollectionsResult } from "../../selectors";
import Query from "src/app/Query";
=======
import { Screen, Breadcrumbs, DualPane, ErrorScreen } from 'src/components/common';
import { CaseInfo } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { withRouter } from "react-router";
<<<<<<< HEAD
>>>>>>> working on file upload screen, made case screen and added file upload react package
=======
import { selectCollection } from "../../selectors";
<<<<<<< HEAD
>>>>>>> refactoring Case Screen
=======
import { fetchCollection } from "../../actions";
>>>>>>> fixed case screen and case info

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
