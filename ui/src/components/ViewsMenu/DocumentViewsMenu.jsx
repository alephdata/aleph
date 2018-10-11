import _ from 'lodash';
import React from 'react';
import { connect } from "react-redux";
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from "query-string";
import { withRouter } from "react-router";

import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import { DocumentMetadata } from 'src/components/Document';
import TextLoading from "src/components/common/TextLoading";

import './ViewsMenu.css';

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
    const { document, isPreview, activeMode, tags } = this.props;
    const { mode } = this.state;

    const hasTextMode = this.hasSchemata(['Pages', 'Image']);
    const hasBrowseMode = this.hasSchemata(['Folder']);
    const hasViewer = this.hasSchemata(['Pages', 'Email', 'Image', 'HyperText', 'Table', 'PlainText']);
    const hasViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);

    return (
      <Tabs id="DocumentInfoTabs" onChange={this.handleTabChange} selectedTabId={mode} className='info-tabs-padding'>
        {isPreview && (<Tab id="info"
             title={
               <React.Fragment>
                 <i className="fa fa-fw fa-info" />
                 <FormattedMessage id="entity.info.overview" defaultMessage="Overview"/>
               </React.Fragment>
             }
             panel={
               <DocumentMetadata document={document}/>
             }
        />)}
        {hasViewMode && ( <Tab id="view"
             title={
               <React.Fragment>
                 <i className="fa fa-fw fa-file-o"  />
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
                 <i className="fa fa-fw fa-align-justify" />
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
                                <TextLoading loading={document.isLoading} children={<React.Fragment>
                                  <i className="fa-folder-open" />
                                  <FormattedMessage id="entity.info.overview" defaultMessage="Browse documents"/>
                                  <span> ({document.children !== undefined ? document.children : 0})</span>
                                </React.Fragment>}/>
                              }
                              panel={
                                <DocumentViewMode document={document} activeMode={activeMode}/>
                              }
        />)}
        <Tab id="tags"
             disabled={tags !== undefined && tags.total !== undefined ? tags.total < 1 : true}
             title={
               <TextLoading loading={tags.isLoading} children={<React.Fragment>
                 <i className="fa fa-fw fa-tags"  />
                 <FormattedMessage id="entity.info.overview" defaultMessage="Show tags"/>
                 <span> ({tags.total !== undefined ? tags.total : 0})</span>
               </React.Fragment>}/>
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
  const { document } = ownProps;
  return {
    //tags: selectEntityTags(state, document.id)
  };
};

DocumentViewsMenu = withRouter(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
export default DocumentViewsMenu;