import React, { Component } from 'react';
import { withRouter } from "react-router";
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { Screen, Breadcrumbs, DualPane, ErrorScreen } from 'src/components/common';
import { CaseInfo } from 'src/components/Case';
import { queryCollections } from "src/actions";
import { selectCollection } from "../../selectors";
import { selectCollectionsResult } from "../../selectors";
import { fetchCollection } from "../../actions";


class CaseContext extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {collection, activeTab, className} = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error}/>;
    }

    return (
      <DualPane>
        <CaseInfo activeTab={activeTab} collection={collection}/>
        <DualPane.ContentPane>
          <div className={className}>
            {this.props.children}
          </div>
        </DualPane.ContentPane>
      </DualPane>
    );
  }
}

CaseContext = injectIntl(CaseContext);
CaseContext = withRouter(CaseContext);
export default (CaseContext);
