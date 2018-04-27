import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { injectIntl } from 'react-intl';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection } from 'src/components/common';
import { CollectionInfo, CollectionContent } from 'src/components/Collection';

class CaseScreen extends Component {
  render() {
    const { collection } = this.props;

    if (collection.error) {
      return (
        {/*<ErrorScreen.NoTranslation title={collection.error}/>*/}
      )
    }
    return (
      <div></div>
    );
  }
}

CaseScreen = injectIntl(CaseScreen);
export default CaseScreen;
