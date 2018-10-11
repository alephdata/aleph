import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
import Screen from 'src/components/Screen/Screen';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentHeading from 'src/components/Document/DocumentHeading';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import { selectEntity } from 'src/selectors';

const messages = defineMessages({
  placeholder: {
    id: 'documents.screen.filter',
    defaultMessage: 'Search in {label}',
  }
});


class DocumentScreenContext extends Component {
  constructor(props) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    const { history, location, query } = this.props;
    const parsedHash = queryString.parse(location.hash);
    const newQuery = query.setString('q', queryText);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { intl, document, documentId, activeMode, query } = this.props;
    if (document.isError) {
      return <ErrorScreen error={document.error} />;
    }
    if (document.shouldLoad || document.isLoading) {
      return (
        <DocumentContextLoader documentId={documentId}>
          <LoadingScreen />
        </DocumentContextLoader>
      ); 
    }

    const placeholder = intl.formatMessage(messages.placeholder, {label: document.name});
    const breadcrumbs = (
      <Breadcrumbs onSearch={this.onSearch}
                   searchPlaceholder={placeholder}
                   searchText={query.getString('q')} >
        <Breadcrumbs.Collection collection={document.collection} />
        {document.parent && (
          <Breadcrumbs.Entity entity={document.parent} />
        )}
        <Breadcrumbs.Entity entity={document} />
      </Breadcrumbs>
    );

    return (
      <DocumentContextLoader documentId={documentId}>
        <Screen title={document.name}>
          {breadcrumbs}
          <DualPane>
            <DualPane.ContentPane className="view-menu-flex-direction">
              <DocumentViewsMenu document={document}
                                 activeMode={activeMode}
                                 isPreview={false} />
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <DocumentToolbar document={document} isPreview={false} />
              <DocumentHeading document={document} isPreview={false} />
              <div className="pane-content">
                <DocumentInfoMode document={document} isPreview={false} />
              </div>
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </DocumentContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId, location } = ownProps;
  const document = selectEntity(state, documentId);
  const query = Query.fromLocation('search', location, {}, 'document');
  return { document, query };
};

DocumentScreenContext = connect(mapStateToProps, {})(DocumentScreenContext);
DocumentScreenContext = withRouter(DocumentScreenContext);
DocumentScreenContext = injectIntl(DocumentScreenContext);
export default (DocumentScreenContext);
