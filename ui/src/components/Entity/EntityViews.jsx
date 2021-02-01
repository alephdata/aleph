import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs, Icon } from '@blueprintjs/core';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  Count, Property, ResultCount, Schema, SectionLoading, TextLoading,
} from 'components/common';
import {
  entityReferenceQuery, entitySimilarQuery, folderDocumentsQuery
} from 'queries';
import {
  selectEntitiesResult, selectEntityReferences, selectEntityTags, selectEntityReference, selectSimilarResult
} from 'selectors';
import EntityReferencesMode from 'components/Entity/EntityReferencesMode';
import EntityTagsMode from 'components/Entity/EntityTagsMode';
import EntitySimilarMode from 'components/Entity/EntitySimilarMode';
import EntityInfoMode from 'components/Entity/EntityInfoMode';
import EntityMappingMode from 'components/Entity/EntityMappingMode';
import DocumentViewMode from 'components/Document/DocumentViewMode';


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
      isPreview, activeMode, entity, references, tags, similar, children, reference, referenceQuery, showProfileLinks
    } = this.props;
    if (references.total === undefined || references.isPending) {
      return <SectionLoading />;
    }
    const hasTextMode = entity.schema.isAny(['Pages', 'Image']);
    const hasBrowseMode = entity.schema.isA('Folder');
    const hasViewer = entity.schema.isAny(['Pages', 'Email', 'Image', 'HyperText', 'Table', 'PlainText']);
    const hasDocumentViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);
    const hasViewMode = entity.schema.isDocument() && hasDocumentViewMode;
    const processingError = entity.getProperty('processingError');

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
              <>
                <Icon icon="info" className="left-icon" />
                <span className="tab-padding">
                  <FormattedMessage id="entity.info.info" defaultMessage="Info" />
                </span>
              </>
            )}
            panel={
              <EntityInfoMode entity={entity} showProfileLinks={showProfileLinks} />
            }
          />
        )}
        {hasViewMode && (
          <Tab
            id="view"
            title={(
              <>
                <Icon icon="documentation" className="left-icon" />
                <FormattedMessage id="entity.info.view" defaultMessage="View" />
              </>
            )}
            panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
          />
        )}
        {hasTextMode && (
          <Tab
            id="text"
            title={(
              <>
                <Icon icon="plaintext" className="left-icon" />
                <FormattedMessage id="entity.info.text" defaultMessage="Text" />
              </>
            )}
            panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
          />
        )}
        {hasBrowseMode && (
          <Tab
            id="browse"
            disabled={children.total < 1}
            title={(
              <TextLoading loading={children.isPending}>
                <Icon icon="folder" className="left-icon" />
                { entity.schema.isA('Email') && (
                  <FormattedMessage id="entity.info.attachments" defaultMessage="Attachments" />
                )}
                { !entity.schema.isA('Email') && (
                  <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                )}
                <ResultCount result={children} />
              </TextLoading>
            )}
            panel={
              <DocumentViewMode document={entity} activeMode={activeMode} />
            }
          />
        )}
        {references.results.map(ref => (
          <Tab
            id={ref.property.qname}
            key={ref.property.qname}
            title={(
              <>
                <Schema.Icon schema={ref.schema} className="left-icon" />
                <Property.Reverse prop={ref.property} />
                <Count count={ref.count} />
              </>
            )}
            panel={
              <EntityReferencesMode
                entity={entity}
                mode={activeMode}
                query={referenceQuery}
                reference={reference}
                hideCollection={true}
              />
            }
          />
        ))}
        {!references.total && references.isPending && (
          <Tab
            id='loading'
            title={<TextLoading loading={true} />}
          />
        )}
        { entity.schema.isDocument() && (!processingError || !processingError.length) && (
          <Tab
            id="tags"
            disabled={tags.total < 1}
            title={(
              <TextLoading loading={tags.isPending}>
                <Icon icon="assessment" className="left-icon" />
                <FormattedMessage id="entity.info.tags" defaultMessage="Mentions" />
                <ResultCount result={tags} />
              </TextLoading>
            )}
            panel={<EntityTagsMode entity={entity} />}
          />
        )}
        { entity?.schema?.matchable && !isPreview && (
          <Tab
            id="similar"
            disabled={similar.total === 0}
            title={(
              <TextLoading loading={similar.total === undefined}>
                <Icon icon="similar" className="left-icon" />
                <FormattedMessage id="entity.info.similar" defaultMessage="Similar" />
                <ResultCount result={similar} />
              </TextLoading>
            )}
            panel={<EntitySimilarMode entity={entity} />}
          />
        )}
        { (entity?.collection?.writeable && entity.schema.isA('Table')) && (
          <Tab
            id="mapping"
            title={(
              <>
                <Icon icon="new-object" className="left-icon" />
                <FormattedMessage id="entity.mapping.view" defaultMessage="Generate entities" />
              </>
            )}
            panel={<EntityMappingMode document={entity} />}
          />
        )}
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location, activeMode } = ownProps;
  const childrenQuery = folderDocumentsQuery(location, entity.id, undefined);
  const reference = selectEntityReference(state, entity.id, activeMode);
  return {
    reference,
    references: selectEntityReferences(state, entity.id),
    referenceQuery: entityReferenceQuery(location, entity, reference),
    tags: selectEntityTags(state, entity.id),
    similar: selectSimilarResult(state, entitySimilarQuery(location, entity.id)),
    children: selectEntitiesResult(state, childrenQuery),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EntityViews);
