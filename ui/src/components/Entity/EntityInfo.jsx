import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import { Property, Entity, DualPane, TabCount, Schema, TextLoading } from 'src/components/common';
import { EntityInfoTags, EntityInfoReferences } from 'src/components/Entity';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import { CollectionOverview } from 'src/components/Collection';
import { fetchEntityReferences, fetchEntityTags } from 'src/actions/index';
import { selectEntityTags, selectEntityReferences, selectMetadata } from 'src/selectors';
import getPath from 'src/util/getPath';


class EntityInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview'
    };
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentDidMount(prevProps) {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entity, references, tags } = this.props;
    if (entity.id !== undefined) {
      if (references.shouldLoad) {
        this.props.fetchEntityReferences(entity);
      }
      if (tags.shouldLoad) {
        this.props.fetchEntityTags(entity);
      }
    }
  }

  handleTabChange(activeTabId) {
    this.setState({ activeTabId });
  }

  render() {
    const { references, entity, schema, tags, showToolbar } = this.props;
    const tagsTotal = tags.total === undefined ? undefined: tags.total;
    const referencesTotal = references.results === undefined ? undefined: references.results.length;
    const connectionsTotal = referencesTotal === undefined || tagsTotal === undefined ? undefined : tagsTotal + referencesTotal;
    const isThing = entity && entity.schemata && entity.schemata.indexOf('Thing') !== -1;

    if (schema === undefined) {  // entity hasn't loaded.
      return null;
    }
    
    const entityProperties = _.values(schema.properties).filter((prop) => {
      return !prop.caption && (schema.featured.indexOf(prop.name) !== -1 || entity.properties[prop.name]);
    });
    
    return (
      <DualPane.InfoPane className="EntityInfo with-heading">
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            {isThing && (
              <Link to={getPath(entity.links.ui)} className="pt-button button-link">
                <span className={`pt-icon-share`}/>
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
                  </React.Fragment>
                }
              />
              <Tab id="connections" disabled={connectionsTotal === 0}
                title={
                  <TextLoading loading={connectionsTotal === undefined}>
                    <FormattedMessage id="entity.info.connections" defaultMessage="Connections"/>
                    <TabCount count={connectionsTotal} />
                  </TextLoading>
                }
                panel={
                  <React.Fragment>
                    <EntityInfoReferences references={references} entity={entity}/>
                    <EntityInfoTags tags={tags} entity={entity}/>
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
  const { entity } = ownProps;
  return {
    references: selectEntityReferences(state, entity.id),
    tags: selectEntityTags(state, entity.id),
    schema: selectMetadata(state).schemata[entity.schema]
  };
};

EntityInfo = connect(mapStateToProps, { fetchEntityReferences, fetchEntityTags }, null, { pure: false })(EntityInfo);
export default EntityInfo;
