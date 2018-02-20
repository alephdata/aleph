import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab, Tabs, Icon } from "@blueprintjs/core";
import _ from 'lodash';


import Property from './Property';
import Entity from './Entity';
import EntityInfoTags from './EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import Schema from 'src/components/common/Schema';
import CollectionInfo from 'src/components/common/Collection/CollectionInfo';
import { fetchEntityReferences } from '../../actions/index';

import './EntityInfo.css';

class EntityInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'source'
    };
    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  handleTabChange(activeTabId: TabId) {
    this.setState({ activeTabId });
  }
  
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { references, entity, schema } = this.props;

    const properties = _.values(schema.properties).filter((prop) => {
      if (prop.caption) {
        return false;
      }
      return prop.featured || !!entity.properties[prop.name];
    });
  
    return (
      <DualPane.InfoPane className="EntityInfo">
        <div className="PaneHeading">
          <h1 style={{margin: 0, border: 0}}>
            <Entity.Label entity={entity} addClass={true}/>
          </h1>
        </div>
        <div className="PaneContent">
          <Tabs id="TabsExample"  large="true" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="source" 
                title={
                  <React.Fragment>
                    <Icon icon="graph"/> <FormattedMessage id="document.info.source" defaultMessage="Source"/>
                  </React.Fragment>
                }
                panel={<CollectionInfo collection={entity.collection}/>}
              />
              <Tab id="tags"
                title={
                  <React.Fragment>
                    <Icon icon="tag"/> <FormattedMessage id="document.info.tags" defaultMessage="Related Tags"/>
                  </React.Fragment>
                }
                panel={<EntityInfoTags entity={entity} />}
              />
              <Tabs.Expander />
          </Tabs>
        </div>
        
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    references: state.entityReferences[ownProps.entity.id],
    schema: state.metadata.schemata[ownProps.entity.schema]
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
