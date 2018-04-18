import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {FormattedMessage, defineMessages, injectIntl} from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";
import _ from 'lodash';

import { Property, Entity, DualPane, TabCount, Schema, URL } from 'src/components/common';
import { EntityConnections } from 'src/components/Entity';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import { CollectionOverview } from 'src/components/Collection';
import { fetchEntityReferences } from 'src/actions/index';
import { selectEntityTags } from 'src/selectors';
import getPath from 'src/util/getPath';
import ErrorScreen from "../ErrorMessages/ErrorScreen";

const messages = defineMessages({
    no_data: {
        id: 'entity.info.no.data',
        defaultMessage: 'No further details on this entity contained in source.'
    }
});

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

  render() {
    const { references, entity, schema, tags, intl, showToolbar } = this.props;
    const tagsTotal = tags !== undefined ? tags.total : undefined;
    const relationshipTotal = (references && !references.isFetching && references.results) ? references.results.length : undefined;
    const connectionsTotal = relationshipTotal === undefined ?
        tagsTotal === undefined ?
            0 : tagsTotal : tagsTotal === undefined ?
            relationshipTotal : tagsTotal + relationshipTotal;
    const isThing = entity && entity.schemata && entity.schemata.indexOf('Thing') !== -1;
    
    let sourceUrl = null;
    const entityProperties = _.values(schema.properties).filter((prop) => {
      if (prop.caption) {
        return false;
      }
      if (prop.name === 'sourceUrl' && entity.properties[prop.name]) {
        sourceUrl = entity.properties[prop.name][0];
        return false;
      }
      return entity.properties[prop.name];
    });
    
    return (
      <DualPane.InfoPane className="EntityInfo with-heading">
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            {isThing && (
              <Link to={getPath(entity.links.ui)} className="pt-button button-link">
                <span className={`pt-icon-folder-open`}/>
                <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
              </Link>
            )}
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon={true} />
          </span>
          <h1>
            {isThing && (
              <Entity.Label entity={entity} addClass={true}/>
            )}
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
                      {entityProperties.length === 0 &&
                          <ErrorScreen.EmptyList title={intl.formatMessage(messages.no_data)}/>
                      }
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
                    <CollectionOverview collection={entity.collection} hasHeader={true}/>
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
                        <EntityConnections connectionsTotal={connectionsTotal} references={references} entity={entity}/>
                    </React.Fragment>
                }
              />
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

EntityInfo = injectIntl(EntityInfo);
EntityInfo = connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
export default EntityInfo;
