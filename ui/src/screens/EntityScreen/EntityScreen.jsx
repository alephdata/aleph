import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';

import Screen from 'src/components/Screen/Screen';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import { compose } from 'redux';
import { connect } from 'react-redux';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityViews from 'src/components/Entity/EntityViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs, SearchBox } from 'src/components/common';
import Query from 'src/app/Query';
import {
  selectEntity, selectEntityReference, selectEntityView,
} from 'src/selectors';


const messages = defineMessages({
  placeholder: {
    id: 'documents.screen.filter',
    defaultMessage: 'Search in {label}',
  },
});


class EntityScreen extends Component {
  static SEARCHABLES = ['Pages', 'Folder', 'Package', 'Workbook'];

  constructor(props) {
    super(props);
    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  onCollectionSearch(queryText) {
    const { history, entity } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': entity.collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
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

  getEntityTitle() {
    const { entity } = this.props;
    return entity.getFirst('title') || entity.getFirst('fileName') || entity.getCaption();
  }

  getSearchScopes() {
    const {
      entity, intl,
    } = this.props;
    const collectionScope = {
      label: entity.collection.label,
      placeholder: intl.formatMessage(messages.placeholder, { label: entity.collection.label }),
      onSearch: this.onCollectionSearch,
    };

    const hasSearch = entity.schema.isAny(EntityScreen.SEARCHABLES);
    if (!hasSearch) {
      return [collectionScope];
    }
    const entityTitle = this.getEntityTitle();
    const entityScope = {
      label: entityTitle,
      placeholder: intl.formatMessage(messages.placeholder, { label: entityTitle }),
      onSearch: this.onSearch,
    };

    return [entityScope, collectionScope];
  }

  render() {
    const {
      entity, entityId, activeMode, intl, query,
    } = this.props;
    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading) {
      return (
        <EntityContextLoader entityId={entityId}>
          <LoadingScreen />
        </EntityContextLoader>
      );
    }

    const title = this.getEntityTitle();
    const hasSearch = entity.schema.isAny(EntityScreen.SEARCHABLES);

    const operation = !hasSearch ? undefined : (
      <SearchBox
        onSearch={this.onSearch}
        searchPlaceholder={intl.formatMessage(messages.placeholder, { label: title })}
        searchText={query.getString('q')}
      />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection collection={entity.collection} />
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );

    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={title} searchScopes={this.getSearchScopes()}>
          {breadcrumbs}
          <DualPane>
            <DualPane.InfoPane className="with-heading">
              <EntityToolbar entity={entity} isPreview={false} />
              <EntityHeading entity={entity} isPreview={false} />
              <div className="pane-content">
                <EntityInfoMode entity={entity} isPreview={false} />
              </div>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              <EntityViews
                entity={entity}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </EntityContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId, mode } = ownProps.match.params;
  const { location } = ownProps;
  const reference = selectEntityReference(state, entityId, mode);
  const hashQuery = queryString.parse(location.hash);
  return {
    entityId,
    reference,
    entity: selectEntity(state, entityId),
    query: Query.fromLocation('entities', location, {}, 'document'),
    activeMode: selectEntityView(state, entityId, hashQuery.mode, false),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(EntityScreen);
