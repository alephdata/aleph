import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import { selectEntityReferences } from 'src/selectors';
import Fragment from 'src/app/Fragment';
import { TabCount, Property, SectionLoading, ErrorSection } from 'src/components/common';
import { EntityReferencesTable } from 'src/components/Entity';

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
    fragment.update({'content:tab': activeTab});
  }
  
  render() {
    const { entity, references, intl, activeTab } = this.props;

    if (references.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <section>
        <Tabs id="EntityReferenceTabs" onChange={this.handleTabChange} selectedTabId={activeTab}>
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
        </Tabs>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const fragment = new Fragment(ownProps.history);
  const references = selectEntityReferences(state, ownProps.entity.id);
  const reference = (!references.isLoading && references.results !== undefined && references.results.length) ? references.results[0] : undefined;
  const defaultTab = reference ? 'references-' + reference.property.qname : 'default';
  const activeTab = fragment.get('content:tab') || defaultTab;
  return { fragment, references, activeTab };
};

EntityReferences = connect(mapStateToProps, {}, null, { pure: false })(EntityReferences);
EntityReferences = withRouter(EntityReferences);
EntityReferences = injectIntl(EntityReferences);
export default EntityReferences;
