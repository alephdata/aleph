import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";
import _ from 'lodash';

import Property from './Property';
import Entity from './Entity';
import EntityInfoTags from './EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import TabCount from 'src/components/common/TabCount';
import Schema from 'src/components/common/Schema';
import CollectionOverview from 'src/components/Collection/CollectionOverview';
import URL from 'src/components/common/URL';
import { fetchEntityReferences } from 'src/actions/index';
import { selectEntityTags } from 'src/selectors';
import getPath from 'src/util/getPath';

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

  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  referenceLink(reference) {
    const { entity } = this.props;
    const path = getPath(entity.links.ui);
    const tabName = 'references-' + reference.property.qname;
    const query = queryString.stringify({'content:tab': tabName})
    return path + '?' + query;
  }

  render() {
    const { references, entity, schema, tags, showToolbar } = this.props;
    const tagsTotal = tags !== undefined ? tags.total : undefined;
    const connectionsTotal = (references && !references.isFetching && references.results) ? references.results.length : undefined;
    
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
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            <Link to={getPath(entity.links.ui)} className="pt-button button-link">
              <span className={`pt-icon-folder-open`}/>
              <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
            </Link>
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon={true} />
          </span>
          <h1>
            <Entity.Label entity={entity} addClass={true}/>
          </h1>
        </div>
        <div className="pane-content">
          <Tabs id="EntityInfoTabs" onChange={this.handleTabChange} selectedTabId={this.state.activeTabId}>
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
                    <CollectionOverview collection={entity.collection}/>
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
              <Tab id="connections" disabled={!connectionsTotal || connectionsTotal === 0}
                title={
                  <React.Fragment>
                    <FormattedMessage id="entity.info.connections" defaultMessage="Connections"/>
                    <TabCount count={connectionsTotal} />
                  </React.Fragment>
                }
                panel={
                  <React.Fragment>
                    {connectionsTotal && connectionsTotal > 0 && (
                      <ul className="info-rank">
                        { references.results.map((ref) => (
                          <li key={ref.property.qname}>
                            <span className="key">
                              <Schema.Icon schema={ref.schema} />{' '}
                              <Link to={this.referenceLink(ref)}>
                                <Property.Reverse model={ref.property} />
                              </Link>
                            </span>
                            <span className="value">
                              <FormattedNumber value={ref.count} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </React.Fragment>
                }
              />
              <Tab id="tags" disabled={!tagsTotal || tagsTotal === 0}
                title={
                  <React.Fragment>
                    <FormattedMessage id="entity.info.tags" defaultMessage="Tags"/>
                    <TabCount count={tagsTotal} />
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
    tags: selectEntityTags(state, ownProps.entity.id)
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
