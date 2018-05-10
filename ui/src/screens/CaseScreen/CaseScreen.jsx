import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection, ErrorScreen } from 'src/components/common';
import { CaseInfo, CaseContent, CaseDocumentsContent } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { selectCollectionsResult } from "src/selectors";
import Query from "src/app/Query";

class CaseScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: []
    }
  }

  async componentDidMount() {
    await this.fetchData();
  }

  async fetchData() {
    let {query} = this.props;
    this.props.queryCollections({query});
    this.setState({result: this.props.result})
  }

  render() {
    const {collection, result} = this.props;
    console.log(this.props);

    if (collection.isError) {
      return <ErrorScreen error={collection.error}/>;
    }

    return (
      <Screen title={collection.label} breadcrumbs={<Breadcrumbs collection={collection}/>}>
        <DualPane>
          <CaseInfo cases={result.results} casefile={collection}/>
          <div>
            {this.props.children}
          </div>
          <CaseContent collection={collection}/>
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const context = {
    facet: [ 'category', 'countries' ],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = connect(mapStateToProps, {queryCollections})(CaseScreen);
export default ({ match, ...otherProps }) => (
  <Collection.Load
    id={match.params.collectionId}
    renderWhenLoading={<ScreenLoading />}
  >{collection => (
    <CaseScreen collection={collection} {...otherProps} />
  )}</Collection.Load>
);
