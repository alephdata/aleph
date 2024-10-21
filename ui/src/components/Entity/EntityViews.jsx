import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Callout, Classes, Tab, Tabs, InputGroup } from '@blueprintjs/core';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import {
  Count,
  Entity,
  Property,
  ResultCount,
  Schema,
  SectionLoading,
  TextLoading,
} from 'components/common';
import {
  entityReferenceQuery,
  entitySimilarQuery,
  folderDocumentsQuery,
} from 'queries';
import {
  selectEntitiesResult,
  selectEntityReferences,
  selectEntityTags,
  selectEntityReference,
  selectSimilarResult,
} from 'selectors';
import EntityProperties from 'components/Entity/EntityProperties';
import EntityReferencesMode from 'components/Entity/EntityReferencesMode';
import EntityTagsMode from 'components/Entity/EntityTagsMode';
import EntitySimilarMode from 'components/Entity/EntitySimilarMode';
import EntityMappingMode from 'components/Entity/EntityMappingMode';
import DocumentViewMode from 'components/Document/DocumentViewMode';
import PdfViewerSearch from 'viewers/PdfViewerSearch';

import './EntityViews.scss';

class EntityViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handlePdfSearch = this.handlePdfSearch.bind(this);
  }

  handleTabChange(mode) {
    const { navigate, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash.mode = mode;
    }
    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  handlePdfSearch(searchQuery) {
    const { navigate, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);

    if (isPreview) {
      parsedHash['preview:mode'] = 'search';
      parsedHash['preview:q'] = searchQuery;
    } else {
      parsedHash['mode'] = 'search';
      parsedHash['q'] = searchQuery;
    }

    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  hasProcessingErrors() {
    return this.props.entity.getProperty('processingError')?.length >= 1;
  }

  hasPdfSearchMode() {
    return this.props.entity.schema.isA('Pages') && !this.hasProcessingErrors();
  }

  render() {
    const { activeMode, references } = this.props;

    if (references.total === undefined || references.isPending) {
      return <SectionLoading />;
    }

    return (
      <>
        {this.renderWorkbookWarning()}
        <Tabs
          id="EntityInfoTabs"
          onChange={this.handleTabChange}
          selectedTabId={activeMode}
          renderActiveTabPanelOnly
          className="info-tabs-padding"
        >
          {this.renderInfoMode()}
          {this.renderViewMode()}
          {this.renderTextMode()}
          {this.renderBrowseMode()}
          {this.renderReferenceModes()}
          {this.renderTagsMode()}
          {this.renderSimilarMode()}
          {this.renderMappingMode()}
          {this.renderPdfSearchMode()}
          <Tabs.Expander />
          {this.renderPdfSearchForm()}
        </Tabs>
      </>
    );
  }

  renderWorkbookWarning() {
    const { entity, isPreview } = this.props;
    const parent = entity.getFirst('parent');

    if (isPreview) {
      return;
    }

    if (!entity.schema.isA('Table') || !parent?.schema?.isA('Workbook')) {
      return;
    }

    return (
      <Callout className="EntityViews__workbook-warning">
        <FormattedMessage
          id="entity.info.workbook_warning"
          defaultMessage="This sheet is part of workbook {link}"
          values={{
            link: <Entity.Link entity={parent} icon />,
          }}
        />
      </Callout>
    );
  }

  renderInfoMode() {
    const { entity, isPreview } = this.props;

    // The info tab is only rendered in entity previews. When viewing an entity
    // directly, the entity properties are always displayed in a sidebar, no
    // matter which tab is selected.
    if (!isPreview) {
      return;
    }

    return (
      <Tab
        id="info"
        icon="info"
        title={<FormattedMessage id="entity.info.info" defaultMessage="Info" />}
        panel={<EntityProperties entity={entity} />}
      />
    );
  }

  renderViewMode() {
    const { entity, activeMode } = this.props;

    if (!entity.schema.isDocument()) {
      return;
    }

    // The view mode is the default mode. It is rendered for almost all document-like
    // entities (except folders) and renders an empty state if no viewer is available
    // for a specific file type.
    if (entity.schema.isA('Folder')) {
      return;
    }

    return (
      <Tab
        id="view"
        icon="documentation"
        title={<FormattedMessage id="entity.info.view" defaultMessage="View" />}
        panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
      />
    );
  }

  renderTextMode() {
    const { entity, activeMode } = this.props;

    if (!entity.schema.isAny(['Pages', 'Image'])) {
      return;
    }

    return (
      <Tab
        id="text"
        icon="plaintext"
        title={<FormattedMessage id="entity.info.text" defaultMessage="Text" />}
        panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
      />
    );
  }

  renderBrowseMode() {
    const { entity, children, activeMode } = this.props;

    if (!entity.schema.isA('Folder')) {
      return;
    }

    return (
      <Tab
        id="browse"
        disabled={children.total < 1}
        icon="folder"
        title={
          <TextLoading loading={children.isPending}>
            {entity.schema.isA('Email') && (
              <FormattedMessage
                id="entity.info.attachments"
                defaultMessage="Attachments"
              />
            )}
            {!entity.schema.isA('Email') && (
              <FormattedMessage
                id="entity.info.documents"
                defaultMessage="Documents"
              />
            )}
            <ResultCount result={children} />
          </TextLoading>
        }
        panel={<DocumentViewMode document={entity} activeMode={activeMode} />}
      />
    );
  }

  renderReferenceModes() {
    const { entity, references, reference, referenceQuery, activeMode } =
      this.props;

    if (!references.total && references.isPending) {
      return <Tab id="loading" title={<TextLoading loading={true} />} />;
    }

    return references.results.map((ref) => (
      <Tab
        id={ref.property.qname}
        key={ref.property.qname}
        icon={<Schema.Icon schema={ref.schema} className="left-icon" />}
        title={
          <>
            <Property.Reverse prop={ref.property} />
            <Count count={ref.count} />
          </>
        }
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
    ));
  }

  renderTagsMode() {
    const { entity, tags } = this.props;

    if (!entity.schema.isDocument()) {
      return;
    }

    if (this.hasProcessingErrors()) {
      return;
    }

    return (
      <Tab
        id="tags"
        disabled={tags.total < 1}
        icon="assessment"
        title={
          <TextLoading loading={tags.isPending}>
            <FormattedMessage id="entity.info.tags" defaultMessage="Mentions" />
            <ResultCount result={tags} />
          </TextLoading>
        }
        panel={<EntityTagsMode entity={entity} />}
      />
    );
  }

  renderSimilarMode() {
    const { entity, similar, isPreview } = this.props;

    if (!entity.schema.matchable || isPreview) {
      return;
    }

    return (
      <Tab
        id="similar"
        disabled={similar.total === 0}
        icon="similar"
        title={
          <TextLoading loading={similar.total === undefined}>
            <FormattedMessage
              id="entity.info.similar"
              defaultMessage="Similar"
            />
            <ResultCount result={similar} />
          </TextLoading>
        }
        panel={<EntitySimilarMode entity={entity} />}
      />
    );
  }

  renderMappingMode() {
    const { entity } = this.props;

    if (this.hasProcessingErrors()) {
      return;
    }

    if (!entity.collection.writeable || !entity.schema.isA('Table')) {
      return;
    }

    return (
      <Tab
        id="mapping"
        icon="new-object"
        title={
          <FormattedMessage
            id="entity.mapping.view"
            defaultMessage="Generate entities"
          />
        }
        panel={<EntityMappingMode document={entity} />}
      />
    );
  }

  renderPdfSearchMode() {
    const { entity, isPreview, activeMode } = this.props;

    if (!this.hasPdfSearchMode()) {
      return;
    }

    return (
      <Tab
        id="search"
        title={<span className="visually-hidden">Search results</span>}
        panel={
          <PdfViewerSearch
            isPreview={isPreview}
            document={entity}
            activeMode={activeMode}
          />
        }
      />
    );
  }

  renderPdfSearchForm() {
    const { location, isPreview, activeMode } = this.props;

    if (!this.hasPdfSearchMode()) {
      return;
    }

    const parsedHash = queryString.parse(location.hash);
    const searchQuery = isPreview ? parsedHash['preview:q'] : parsedHash['q'];

    return (
      <form
        className="EntityViews__search"
        onSubmit={(event) => {
          event.preventDefault();
          this.handlePdfSearch(event.currentTarget.q.value);
        }}
      >
        <InputGroup
          name="q"
          leftIcon="search"
          placeholder="Search in this document"
          defaultValue={searchQuery}
        />
      </form>
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
    similar: selectSimilarResult(
      state,
      entitySimilarQuery(location, entity.id)
    ),
    children: selectEntitiesResult(state, childrenQuery),
  };
};

export default compose(withRouter, connect(mapStateToProps))(EntityViews);
