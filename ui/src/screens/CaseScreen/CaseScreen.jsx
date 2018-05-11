import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { Screen, Breadcrumbs, DualPane, ErrorScreen } from 'src/components/common';
import { CaseInfo, CaseContent } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { withRouter } from "react-router";

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
    const {collection, result} = this.props;
    //console.log(this.props);

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
  return {
  };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = withRouter(CaseScreen);
CaseScreen = connect(mapStateToProps, {queryCollections})(CaseScreen);
export default (CaseScreen);
