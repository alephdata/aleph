import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { Screen, Breadcrumbs, DualPane, ErrorScreen } from 'src/components/common';
import { CaseInfo } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { withRouter } from "react-router";
import { selectCollection } from "../../selectors";

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
  console.log(state)
  return {
    collection: selectCollection(state, ownProps.previewId)
  };
};

CaseScreen = injectIntl(CaseScreen);
CaseScreen = withRouter(CaseScreen);
CaseScreen = connect(mapStateToProps, {queryCollections})(CaseScreen);
export default (CaseScreen);
