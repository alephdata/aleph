import _ from 'lodash';
import React from 'react';
import { connect } from "react-redux";
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tabs, Tab } from '@blueprintjs/core';

import { selectEntityTags } from "src/selectors";
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import ViewItem from "src/components/ViewsMenu/ViewItem";
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import { DocumentMetadata } from 'src/components/Document';

import './ViewsMenu.css';
import queryString from "query-string";
import { withRouter } from "react-router";

const messages = defineMessages({
  info: {
    id: 'document.mode.info.tooltip',
    defaultMessage: 'Show properties and details',
  },
  view: {
    id: 'document.mode.view.tooltip',
    defaultMessage: 'Show the document',
  },
  browse: {
    id: 'document.mode.browse.tooltip',
    defaultMessage: 'Browse documents',
  },
  text: {
    id: 'document.mode.text.tooltip',
    defaultMessage: 'Show text',
  },
  tags: {
    id: 'document.tags',
    defaultMessage: 'Show connections'
  },
  similar: {
    id: 'document.similar',
    defaultMessage: 'Show similar documents'
  }
});


class DocumentViewsMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: props.activeMode
    };

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
    this.setState({mode: mode});
  }

  render() {
    const { intl, document, isPreview, activeMode, tags } = this.props;
    const { mode } = this.state;

    const hasTextMode = this.hasSchemata(['Pages', 'Image']);
    const hasBrowseMode = this.hasSchemata(['Folder']);
    const hasViewer = this.hasSchemata(['Pages', 'Email', 'Image', 'HyperText', 'Table', 'PlainText']);
    const hasViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);

    return (
      <Tabs id="EntityInfoTabs" onChange={this.handleTabChange} selectedTabId={mode} className='info-tabs-padding'>
        {isPreview && (<Tab id="info"
             title={
               <React.Fragment>
                 <FormattedMessage id="entity.info.overview" defaultMessage="Show properties and details"/>
               </React.Fragment>
             }
             panel={
               <DocumentMetadata document={document}/>
             }
        />)}
        {hasViewMode && ( <Tab id="view"
             title={
               <React.Fragment>
                 <FormattedMessage id="entity.info.source" defaultMessage="Show the document"/>
               </React.Fragment>
             }
             panel={
               <DocumentViewMode document={document} activeMode={activeMode}/>
             }
        />)}
        {hasTextMode && (<Tab id="text"
             title={
               <React.Fragment>
                 <FormattedMessage id="entity.info.overview" defaultMessage="Show text"/>
               </React.Fragment>
             }
             panel={
               <DocumentViewMode document={document} activeMode={activeMode}/>
             }
        />)}
        {hasBrowseMode && (<Tab id="browse"
                                disabled={document.children < 1}
                              title={
                                <React.Fragment>
                                  <FormattedMessage id="entity.info.overview" defaultMessage="Browse documents"/>
                                  <span> ({document.children})</span>
                                </React.Fragment>
                              }
                              panel={
                                <DocumentViewMode document={document} activeMode={activeMode}/>
                              }
        />)}
        <Tab id="tags"
             disabled={tags !== undefined && tags.total !== undefined ? tags.total < 1 : true}
             title={
               <React.Fragment>
                 <FormattedMessage id="entity.info.overview" defaultMessage="Show tags"/>
                 <span> ({tags.total})</span>
               </React.Fragment>
             }
             panel={
               <EntityTagsMode entity={document} />
             }
        />
      </Tabs>
    );

    /*return (
      <div className="ViewsMenu">
        {isPreview && (
          <ViewItem mode='info' activeMode={activeMode} isPreview={isPreview}
            message={intl.formatMessage(messages.info)}
            icon='fa-info' />
        )}
        {hasViewMode && (
          <ViewItem mode='view'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.view)}
                    href={`/documents/${document.id}#mode=view`}
                    icon='fa-file-o' />
        )}
        {hasTextMode && (
          <ViewItem mode='text'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.text)}
                    href={`/documents/${document.id}#mode=text`}
                    icon='fa-align-justify' />
        )}
        {hasBrowseMode && (
          <ViewItem mode='browse'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.browse)}
                    href={`/documents/${document.id}#mode=browse`}
                    icon='fa-folder-open'
                    count={document.children} />
        )}
        <ViewItem mode='tags' activeMode={activeMode} isPreview={isPreview}
                  count={tags !== undefined ? tags.total : 0}
                  message={intl.formatMessage(messages.tags)}
                  href={`/documents/${document.id}/tags`}
                  icon='fa-tags' />
      </div>
    );*/
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    //tags: selectEntityTags(state, document.id)
  };
};

DocumentViewsMenu = withRouter(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
export default DocumentViewsMenu;