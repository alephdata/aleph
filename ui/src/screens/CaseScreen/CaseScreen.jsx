import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { injectIntl } from 'react-intl';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection } from 'src/components/common';
import { CollectionInfo, CollectionContent } from 'src/components/Collection';
import ErrorScreen from "../../components/ErrorMessages/ErrorScreen";

class CaseScreen extends Component {
  render() {
    return (
      <div></div>
    );
  }
}

CaseScreen = injectIntl(CaseScreen);
export default CaseScreen;
