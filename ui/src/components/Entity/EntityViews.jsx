import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs, Icon } from '@blueprintjs/core';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  Count, SectionLoading, TextLoading,
} from 'src/components/common';
import { queryEntitySimilar, queryFolderDocuments } from 'src/queries';
import {
  selectEntitiesResult, selectEntityReferences, selectEntityTags,
} from 'src/selectors';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import Schema from 'src/components/common/Schema';
import Property from 'src/components/Property';


class EntityViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(mode) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash.mode = mode;
    }
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      isPreview, activeMode, entity, references, tags, similar, children,
    } = this.props;
    if (references.shouldLoad || references.isLoading) {
      return <SectionLoading />;
    }
    const isMatchable = entity && entity.schema && entity.schema.matchable;
    const hasTextMode = entity.schema.isAny(['Pages', 'Image']);
    const hasBrowseMode = entity.schema.isA('Folder');
    const hasViewer = entity.schema.isAny(['Pages', 'Email', 'Image', 'HyperText', 'Table', 'PlainText']);
    const hasDocumentViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);
    const hasViewMode = entity.schema.isDocument() && hasDocumentViewMode;
    const refs = !references.results ? [] : references.results.filter(ref => !ref.reverse.hidden);

    return (
      <Tabs
        id="EntityInfoTabs"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
        className="info-tabs-padding"
      >
        {isPreview && (
          <Tab
            id="info"
            title={(
              <React.Fragment>
                <Icon icon="info" iconSize="14px" className="entity-icon" />
                <span className="tab-padding">
                  <FormattedMessage id="entity.info.info" defaultMessage="Info" />
                </span>
              </React.Fragment>
            )}
            panel={
              <EntityInfoMode entity={entity} />
               }
          />
        )}
        {hasViewMode && (
          <Tab
            id="view"
            title={(
              <React.Fragment>
                <Icon icon="showdocuments" />
                <FormattedMessage id="entity.info.view" defaultMessage="View" />
              </React.Fragment>
            )}
            panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
          />
        )}
        {hasTextMode && (
          <Tab
            id="text"
            title={(
              <React.Fragment>
                <Icon icon="plaintext" />
                <FormattedMessage id="entity.info.text" defaultMessage="Text" />
              </React.Fragment>
            )}
            panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
          />
        )}
        {hasBrowseMode && (
          <Tab
            id="browse"
            disabled={children.total < 1}
            title={(
              <TextLoading loading={children.isLoading}>
                <Icon icon="folder" />
                { entity.schema.isA('Email') && (
                  <FormattedMessage id="entity.info.attachments" defaultMessage="Attachments" />
                )}
                { !entity.schema.isA('Email') && (
                  <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                )}
                <Count count={children.total} />
              </TextLoading>
              )}
            panel={
              <DocumentViewMode document={entity} activeMode={activeMode} />
            }
          />
        )}
        {refs.map(ref => (
          <Tab
            id={ref.property.qname}
            key={ref.property.qname}
            title={(
              <React.Fragment>
                <Schema.Icon schema={ref.schema} iconSize="14px" />
                <Property.Reverse prop={ref.property} />
                <Count count={ref.count} />
              </React.Fragment>
            )}
            panel={
              <EntityReferencesMode entity={entity} mode={activeMode} />
            }
          />
        ))}
        { entity.schema.isDocument() && (
          <Tab
            id="tags"
            disabled={tags.total < 1}
            title={(
              <TextLoading loading={tags.shouldLoad || tags.isLoading}>
                <Icon icon="tags" iconSize="14px" className="entity-icon" />
                <FormattedMessage id="entity.info.tags" defaultMessage="Mentions" />
                <Count count={tags.total} />
              </TextLoading>
            )}
            panel={<EntityTagsMode entity={entity} />}
          />
        )}
        { isMatchable && (
          <Tab
            id="similar"
            title={(
              <TextLoading loading={similar.shouldLoad || similar.isLoading}>
                <Icon icon="similar" iconSize="14px" className="entity-icon" />
                <FormattedMessage id="entity.info.similar" defaultMessage="Similar" />
                <Count count={similar.total} />
              </TextLoading>
            )}
            panel={<EntitySimilarMode entity={entity} />}
          />
        )}
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  const childrenQuery = queryFolderDocuments(location, entity.id, undefined);
  return {
    references: selectEntityReferences(state, entity.id),
    tags: selectEntityTags(state, entity.id),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, entity.id)),
    children: selectEntitiesResult(state, childrenQuery),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EntityViews);
