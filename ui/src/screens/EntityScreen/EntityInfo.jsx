import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";
import _ from 'lodash';

import Property from './Property';
import Entity from './Entity';
import EntityInfoTags from './EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';
import CollectionInfo from 'src/components/common/Collection/CollectionInfo';
import URL from 'src/components/common/URL';
import { fetchEntityReferences } from 'src/actions/index';
import { getEntityTags } from 'src/selectors';

class EntityInfo extends React.Component {
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
  FormattedMessage
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { references, entity, schema } = this.props;
    
    let sourceUrl = null;
    const entityProperties = _.values(schema.properties).filter((prop) => {
      if (prop.caption) {
        return false;
      }
      if (prop.name === 'sourceUrl' && entity.properties[prop.name]) {
        sourceUrl = entity.properties[prop.name][0]
        return false;
      }
      return entity.properties[prop.name];
    });
    
    return (
      <DualPane.InfoPane className="EntityInfo with-heading">
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon={true} />
          </span>
          <h1>
            <Entity.Label entity={entity} addClass={true}/>
          </h1>
        </div>
        <div className="pane-content">
          <Tabs id="EntityInfoTabs" large="true" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
              <Tab id="overview" 
                title={
                  <React.Fragment>
                    <FormattedMessage id="entity.info.overview" defaultMessage="Overview"/>
                  </React.Fragment>
                }
                panel={
                  <React.Fragment>
                    <ul className="info-sheet">
                      { entityProperties.map((prop) => (
                        <li key={prop.name}>
                          <span className="key">
                            <Property.Name model={prop} />
                          </span>
                          <span className="value">
                            <Property.Values model={prop} values={entity.properties[prop.name]} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    { (references && !references.isFetching && references.results && !!references.results.length && (
                      <ul className="info-rank">
                        { references.results.map((ref) => (
                          <li key={ref.property.qname}>
                            <span className="key">
                              <Schema.Icon schema={ref.schema} />{' '}
                              <Property.Reverse model={ref.property} />
                            </span>
                            <span className="value">
                              <FormattedNumber value={ref.count} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </React.Fragment>
                }
              />
              <Tab id="source" 
                title={
                  <React.Fragment>
                    <FormattedMessage id="entity.info.source" defaultMessage="Source"/>
                  </React.Fragment>
                }
                panel={
                  <React.Fragment>
                    <CollectionInfo collection={entity.collection}/>
                    {sourceUrl && (
                      <ul className='info-sheet'>
                        <li>
                          <span className="key">
                            <FormattedMessage id="entity.info.source_url"
                                              defaultMessage="Source URL"/>
                          </span>
                          <span className="value">
                            <URL value={sourceUrl} />
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
                    <FormattedMessage id="entity.info.tags" defaultMessage="Tags"/>
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
    schema: state.metadata.schemata[ownProps.entity.schema],
    tags: getEntityTags(state, ownProps.entity.id)
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
