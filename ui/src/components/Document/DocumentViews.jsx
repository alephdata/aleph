import _ from 'lodash';
import React from 'react';
import { connect } from "react-redux";
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from "query-string";
import { withRouter } from "react-router";

import { Count } from 'src/components/common';
import { selectEntityTags, selectEntitiesResult } from "src/selectors";
import { queryFolderDocuments } from "src/queries";
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import TextLoading from "src/components/common/TextLoading";
import Icon from "src/components/common/Icon";
import EntityInfoMode from "src/components/Entity/EntityInfoMode";


class DocumentViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  hasSchemata(schemata) {
    const { document } = this.props;
    return _.intersection(document.schemata, schemata).length > 0;
  }

  handleTabChange(mode) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if(isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash['mode'] = mode;
    }

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { document, isPreview, activeMode, tags, childrenResult } = this.props;
    const hasTextMode = this.hasSchemata(['Pages', 'Image']);
    const hasBrowseMode = this.hasSchemata(['Folder']);
    const hasViewer = this.hasSchemata(['Pages', 'Email', 'Image', 'HyperText', 'Table', 'PlainText']);
    const hasViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);

    return (
      <Tabs id="DocumentInfoTabs"
            onChange={this.handleTabChange}
            selectedTabId={activeMode}
            renderActiveTabPanelOnly={true}
            className='info-tabs-padding'>
        {isPreview && (
          <Tab id="info"
               title={
                  <React.Fragment>
                    <Icon name="info" />
                    <FormattedMessage id="entity.info.info" defaultMessage="Info"/>
                  </React.Fragment>
               }
               panel={
                  <EntityInfoMode entity={document}/>
               } />
        )}
        {hasViewMode && (
          <Tab id="view"
             title={
               <React.Fragment>
                 <Icon name="showdocuments" />
                 <FormattedMessage id="entity.info.view" defaultMessage="View"/>
               </React.Fragment>
             }
             panel={
               <DocumentViewMode document={document} activeMode={activeMode}/>
             }
        />)}
        {hasTextMode && (
          <Tab id="text"
               title={
                  <React.Fragment>
                    <Icon name="plaintext" />
                    <FormattedMessage id="entity.info.text" defaultMessage="Text"/>
                  </React.Fragment>
               }
               panel={
                  <DocumentViewMode document={document} activeMode={activeMode}/>
               } />
        )}
        {hasBrowseMode && (
          <Tab id="browse"
               disabled={childrenResult.total < 1}
               title={
                  <TextLoading loading={childrenResult.isLoading} children={<React.Fragment>
                    <Icon name="folder" />
                    <FormattedMessage id="entity.info.browse" defaultMessage="Documents"/>
                    <Count count={childrenResult.total} />
                  </React.Fragment>}/>
               }
               panel={
                  <DocumentViewMode document={document} activeMode={activeMode}/>
               } />
        )}
        <Tab id="tags"
             disabled={tags.total < 1}
             title={
               <TextLoading loading={tags.shouldLoad || tags.isLoading}>
                 <Icon name="tags" />
                 <FormattedMessage id="entity.info.tags" defaultMessage="Tags"/>
                 <Count count={tags.total} />
               </TextLoading>
             }
             panel={
               <EntityTagsMode entity={document} />
             }
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  const childrenQuery = queryFolderDocuments(location, document.id, undefined);
  return {
    tags: selectEntityTags(state, document.id),
    childrenResult: selectEntitiesResult(state, childrenQuery)
  };
};

DocumentViews = connect(mapStateToProps, {}, null, {pure: false})(DocumentViews);
DocumentViews = withRouter(DocumentViews);
DocumentViews = injectIntl(DocumentViews);
export default DocumentViews;