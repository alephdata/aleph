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
>>>>>>> refactoring Case Screen

class CaseScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: []
    }
  }

  async componentDidMount() {
    this.setState({result: this.props.result})
  }

  render() {
    const {collection} = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error}/>;
    }

    return (
      <Screen title={collection.label} breadcrumbs={<Breadcrumbs collection={collection}/>}>
        <DualPane>
          <CaseInfo/>
          <div>
            {this.props.children}
          </div>
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);
  return {
    collection: selectCollection(state, ownProps.previewId)
  };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = withRouter(CaseScreen);
CaseScreen = connect(mapStateToProps, {queryCollections})(CaseScreen);
export default (CaseScreen);
