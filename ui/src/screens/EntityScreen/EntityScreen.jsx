import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup } from '@blueprintjs/core';

import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import EntityContextLoader from 'components/Entity/EntityContextLoader';
import { compose } from 'redux';
import { connect } from 'react-redux';
import EntityHeading from 'components/Entity/EntityHeading';
import EntityInfoMode from 'components/Entity/EntityInfoMode';
import EntityViews from 'components/Entity/EntityViews';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import { Breadcrumbs, DualPane, SearchBox } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import { DownloadButton } from 'components/Toolbar';
import { deleteEntity } from 'actions';
import { queryEntityReference } from 'queries';
import {
  selectEntity, selectEntityReference, selectEntityView,
} from 'selectors';

import 'components/common/ItemOverview.scss';

const SEARCHABLES = ['Pages', 'Folder', 'Package', 'Workbook'];


const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class EntityScreen extends Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText, entityLink) {
    const { history, location, query } = this.props;
    const parsedHash = queryString.parse(location.hash);
    const newQuery = query.setString('q', queryText);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:mode'] = undefined;
    parsedHash.page = undefined;
    history.push({
      pathname: entityLink,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      entity, entityId, activeMode, query, intl,
    } = this.props;

    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.id === undefined) {
      return (
        <EntityContextLoader entityId={entityId}>
          <LoadingScreen />
        </EntityContextLoader>
      );
    }

    const { writeable } = entity.collection;
    const hasSearch = entity.schema.isAny(SEARCHABLES) && !entity.schema.isA('Email') && !entity.schema.isA('Folder');

    const search = hasSearch && (
      <SearchBox
        onSearch={this.onSearch}
        placeholderLabel={entity.getCaption()}
        query={query}
      />
    );

    const operation = (
      <ButtonGroup>
        <DownloadButton document={entity} />
        {writeable && (
          <>
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.add_to),
                icon: "add-to-artifact"
              }}
              Dialog={EntitySetSelector}
              dialogProps={{
                collection: entity.collection,
                entities: [entity]
              }}
            />
            <EntityDeleteButton
              entities={[entity]}
              redirectOnSuccess
              actionType="delete"
              deleteEntity={this.props.deleteEntity}
            />
          </>
        )}
      </ButtonGroup>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} search={search} >
        <Breadcrumbs.Collection collection={entity.collection} />
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );

    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.getCaption()}>
          {breadcrumbs}
          <DualPane>
            <DualPane.SidePane className="ItemOverview">
              <div className="ItemOverview__heading">
                <EntityHeading entity={entity} isPreview={false} />
              </div>
              <div className="ItemOverview__content">
                <EntityInfoMode entity={entity} isPreview={false} />
              </div>
            </DualPane.SidePane>
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
  const { entityId } = ownProps.match.params;
  const { location } = ownProps;
  const entity = selectEntity(state, entityId);
  const hashQuery = queryString.parse(location.hash);
  const isDocument = entity?.schema?.isDocument();
  const activeMode = selectEntityView(state, entityId, hashQuery.mode, false);
  const reference = selectEntityReference(state, entityId, activeMode);
  const referenceQuery = queryEntityReference(location, entity, reference);
  const documentQuery = Query.fromLocation('entities', location, {}, 'document');

  return {
    entity,
    entityId,
    reference,
    activeMode,
    isDocument,
    query: referenceQuery || documentQuery,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { deleteEntity }),
  injectIntl,
)(EntityScreen);
