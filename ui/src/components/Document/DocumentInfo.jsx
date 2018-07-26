import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import getPath from 'src/util/getPath';
import { URL, DualPane, TabCount, Schema, Entity, TextLoading } from 'src/components/common';
import { selectEntityTags } from 'src/selectors';
import { fetchEntityTags } from 'src/actions/index';
import { Toolbar, CloseButton, ModeButtons } from 'src/components/Toolbar';
import { EntityInfoTags } from 'src/components/Entity';
import { DocumentMetadata } from 'src/components/Document';
import { CollectionOverview } from 'src/components/Collection';

class DocumentInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeTabId: 'overview' };
    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  componentDidMount(prevProps) {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { document, tags } = this.props;
    if (document.id !== undefined && tags.total === undefined && !tags.isLoading) {
      this.props.fetchEntityTags(document);
    }
  }

  handleTabChange(activeTabId: TabId) {
    this.setState({ activeTabId });
  }

  render() {
    const { document: doc, tags, showToolbar } = this.props;

    return (
      <DualPane.InfoPane className="DocumentInfo with-heading">
        {showToolbar && (
          <Toolbar className='toolbar-preview'>
            <ModeButtons document={doc} isPreview={true} />
            {doc.links && doc.links.ui && (
              <Link to={getPath(doc.links.ui)} className="pt-button button-link">
                <span className={`pt-icon-share`}/>
                <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
              </Link>
            )}
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <Schema.Label schema={doc.schema} icon={true}/>
          </span>
          <h1>
            <Entity.Label entity={doc} addClass={true}/>
          </h1>
        </div>
        <div className="pane-content">
          <Tabs id="DocumentInfoTabs" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="overview"
                title={
                  <React.Fragment>
                     <FormattedMessage id="document.info.overview" defaultMessage="Overview"/>
                  </React.Fragment>
                }
                panel={<DocumentMetadata document={doc}/>} 
              />
              <Tab id="source" 
                title={
                  <React.Fragment>
                    <FormattedMessage id="document.info.source" defaultMessage="Source"/>
                  </React.Fragment>
                }
                panel={
                  <React.Fragment>
                  <CollectionOverview collection={doc.collection} hasHeader={true}/>
                  {doc.source_url && (
                    <ul className='info-sheet'>
                      <li>
                        <span className="key">
                          <FormattedMessage id="document.info.source_url"
                                            defaultMessage="Document Source URL"/>
                        </span>
                        <span className="value">
                          <URL value={doc.source_url} />
                        </span>
                      </li>
                    </ul>
                  )}
                  </React.Fragment>
                }
              />
              <Tab id="tags" disabled={tags.total === 0}
                title={
                  <TextLoading loading={tags.total === undefined}>
                    <FormattedMessage id="document.info.tags" defaultMessage="Connections"/>
                    <TabCount count={tags.total} />
                  </TextLoading>
                }
                panel={<EntityInfoTags tags={tags} entity={doc} />}
              />
              <Tabs.Expander />
          </Tabs>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  tags: selectEntityTags(state, ownProps.document.id)
});

export default connect(mapStateToProps, { fetchEntityTags })(DocumentInfo);
