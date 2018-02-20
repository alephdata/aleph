import React from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tab, Tabs, Icon } from "@blueprintjs/core";

import Entity from 'src/components/EntityScreen/Entity';
import EntityInfoTags from 'src/components/EntityScreen/EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import DocumentMetadata from 'src/components/DocumentScreen/DocumentMetadata';
import DocumentCollection from 'src/components/DocumentScreen/DocumentCollection';

import './DocumentInfo.css';

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
    const {document} = this.props;
    return (
      <DualPane.InfoPane className="DocumentInfo">
        <div className="PaneHeading">
          <h1 style={{margin: 0, border: 0}}>
            <Entity.Label entity={document} addClass={true}/>
          </h1>
        </div>
        <div className="PaneContent">
          <Tabs id="TabsExample"  large="true" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="overview"
                title={
                  <React.Fragment>
                    <Icon icon="info-sign"/> <FormattedMessage id="document.info.overview" defaultMessage="Overview"/>
                  </React.Fragment>
                }
                panel={<DocumentMetadata document={document}/>} 
              />
              <Tab id="source" 
                title={
                  <React.Fragment>
                    <Icon icon="graph"/> <FormattedMessage id="document.info.source" defaultMessage="Source"/>
                  </React.Fragment>
                }
                panel={<DocumentCollection collection={document.collection}/>}
              />
              <Tab id="tags"
                title={
                  <React.Fragment>
                    <Icon icon="tag"/> <FormattedMessage id="document.info.tags" defaultMessage="Related Tags"/>
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

const mapStateToProps = state => ({
  session: state.session,
});

DocumentInfo = injectIntl(DocumentInfo)
export default connect(mapStateToProps)(DocumentInfo);
