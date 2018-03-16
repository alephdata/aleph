import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import Entity from 'src/screens/EntityScreen/Entity';
import EntityInfoTags from 'src/screens/EntityScreen/EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';
import DocumentMetadata from 'src/screens/DocumentScreen/DocumentMetadata';
import CollectionOverview from 'src/components/Collection/CollectionOverview';
import URL from 'src/components/common/URL';
import { getEntityTags } from 'src/selectors';

class DocumentInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview'
    };
    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  handleTabChange(activeTabId: TabId) {
    this.setState({ activeTabId });
  }

  render() {
    const { document } = this.props;
    return (
      <DualPane.InfoPane className="DocumentInfo with-heading">
        <div className="pane-heading">
          <span>
            <Schema.Label schema={document.schema} icon={true} />
          </span>
          <h1>
            <Entity.Label entity={document} addClass={true}/>
          </h1>
        </div>
        <div className="pane-content">
          <Tabs id="DocumentInfoTabs"  large="true" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="overview"
                title={
                  <React.Fragment>
                     <FormattedMessage id="document.info.overview" defaultMessage="Overview"/>
                  </React.Fragment>
                }
                panel={<DocumentMetadata document={document}/>} 
              />
              <Tab id="source" 
                title={
                  <React.Fragment>
                    <FormattedMessage id="document.info.source" defaultMessage="Source"/>
                  </React.Fragment>
                }
                panel={
                  <React.Fragment>
                  <CollectionOverview collection={document.collection}/>
                  {document.source_url && (
                    <ul className='info-sheet'>
                      <li>
                        <span className="key">
                          <FormattedMessage id="document.info.source_url"
                                            defaultMessage="Document Source URL"/>
                        </span>
                        <span className="value">
                          <URL value={document.source_url} />
                        </span>
                      </li>
                    </ul>
                  )}
                  </React.Fragment>
                }
              />
              <Tab id="tags"
                title={
                  <React.Fragment>
                    <FormattedMessage id="document.info.tags"
                                      defaultMessage="Tags"/>
                  </React.Fragment>
                }
                panel={<EntityInfoTags entity={document} />}
              />
              <Tabs.Expander />
          </Tabs>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  session: state.session,
  tags: getEntityTags(state, ownProps.document.id)
});

export default connect(mapStateToProps)(DocumentInfo);
