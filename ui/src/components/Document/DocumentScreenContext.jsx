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
import DocumentViews from 'src/components/Document/DocumentViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import { selectEntity, selectSchemata } from 'src/selectors';
import { Entity } from 'src/followthemoney/Entity.ts';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';

const messages = defineMessages({
  placeholder: {
    id: 'documents.screen.filter',
    defaultMessage: 'Search in {label}',
  },
});

/* eslint-disable */

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
    parsedHash['preview:mode'] = undefined;
    parsedHash.page = undefined;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      intl, schemata, document, documentId, activeMode, query,
    } = this.props;
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

    const title = document.title || document.file_name || document.name;
    const hasSearch = document.hasSearch();
    const onSearch = hasSearch ? this.onSearch : undefined;
    const placeholder = intl.formatMessage(messages.placeholder, { label: title });
    const breadcrumbs = (
      <Breadcrumbs
        onSearch={onSearch}
        searchPlaceholder={placeholder}
        searchText={query.getString('q')}
      >
        <Breadcrumbs.Collection collection={document.collection} />
        {document.parent && (
          <Breadcrumbs.Entity entity={new Entity(schemata.getSchema(document.parent.schema), document.parent)} />
        )}
        <Breadcrumbs.Entity entity={document} />
      </Breadcrumbs>
    );

    return (
      <DocumentContextLoader documentId={documentId}>
        <Screen title={title}>
          {breadcrumbs}
          <DualPane>
            <DualPane.ContentPane className="view-menu-flex-direction">
              <DocumentViews
                document={document}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <DocumentToolbar document={document} isPreview={false} />
              <DocumentHeading document={document} isPreview={false} />
              <div className="pane-content">
                <EntityInfoMode entity={document} isPreview={false} />
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
  const schemata = selectSchemata(state);
  const query = Query.fromLocation('entities', location, {}, 'document');
  return { document, query, schemata };
};

DocumentScreenContext = connect(mapStateToProps, {})(DocumentScreenContext);
DocumentScreenContext = withRouter(DocumentScreenContext);
DocumentScreenContext = injectIntl(DocumentScreenContext);
export default (DocumentScreenContext);
