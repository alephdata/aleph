import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import Query from 'src/app/Query';
import { selectEntityReferences, selectEntitiesResult } from 'src/selectors';
import Fragment from 'src/app/Fragment';
import { TabCount, Property, SectionLoading, ErrorSection, DualPane, TextLoading } from 'src/components/common';
import { EntityReferencesTable } from 'src/components/Entity';
import { EntitySimilarTable } from 'src/components/Entity';
import EntityViewsMenu from "../ViewsMenu/EntityViewsMenu";

import './EntityContent.css';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
  },
  default_tab: {
    id: 'entity.references.default_tab',
    defaultMessage: 'Relationships',
  }
});


class EntityReferences extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(activeTab) {
    const { fragment } = this.props;
    fragment.update({'mode': activeTab});
  }
  
  render() {
    const { entity, references, intl, activeTab } = this.props;
    const { similarResult, similarQuery } = this.props;

    if (references.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <DualPane.ContentPane className='EntityContent'>
        <EntityViewsMenu entity={entity} isFullPage={true}/>
        <Tabs onChange={this.handleTabChange} selectedTabId={activeTab} className='entity-content-tabs'>
          { references.total === 0 && (
            <Tab id="default" key="default"
                 title={intl.formatMessage(messages.default_tab)}
                 panel={<ErrorSection visual="graph" title={intl.formatMessage(messages.no_relationships)} />}
            />
          )}
          { references.results.map((ref, i) => (
            <Tab id={`references-${ref.property.qname}`} key={i}
                 title={<React.Fragment>
                          <Property.Reverse model={ref.property} />
                          <TabCount count={ref.count} />
                        </React.Fragment>}
                 panel={
                  <EntityReferencesTable
                    entity={entity}
                    schema={ref.schema}
                    property={ref.property}
                  />} />
          ))}
          <Tab id="similar" key="similar" disabled={similarResult.total === 0}
               title={<TextLoading loading={similarResult.total === undefined}>
                  <FormattedMessage id="entity.content.similar_tab" defaultMessage="Similar" />
                  <TabCount count={similarResult.total} />
                </TextLoading>}
               panel={<EntitySimilarTable entity={entity}
                                          query={similarQuery}
                                          result={similarResult} />} 
          />
        </Tabs>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { id } = ownProps.entity;
  const fragment = new Fragment(ownProps.history);
  const references = selectEntityReferences(state, ownProps.entity.id);
  const reference = (!references.isLoading && references.results !== undefined && references.results.length) ? references.results[0] : undefined;
  const defaultTab = reference ? 'references-' + reference.property.qname : 'default';
  const activeTab = fragment.get('mode') || defaultTab;
  
  const similarPath = id ? `entities/${id}/similar` : undefined;
  const similarQuery = Query.fromLocation(similarPath, {}, {}, 'similar').limit(75);

  return { fragment, references, activeTab,
    similarResult: selectEntitiesResult(state, similarQuery),
    similarQuery: similarQuery
  };
};

EntityReferences = connect(mapStateToProps, {}, null, { pure: false })(EntityReferences);
EntityReferences = withRouter(EntityReferences);
EntityReferences = injectIntl(EntityReferences);
export default EntityReferences;
