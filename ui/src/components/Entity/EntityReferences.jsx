import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";

import Fragment from 'src/app/Fragment';
import { TabCount, Property } from 'src/components/common';
import { EntityReferencesTable } from 'src/components/Entity';

class EntityReferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ activeTab: nextProps.activeTab });
  }
  
  handleTabChange(activeTab) {
    const { fragment } = this.props;
    fragment.update({'content:tab': activeTab});
    this.setState({ activeTab })
  }
  
  render() {
    const { entity, references } = this.props;
    const { activeTab } = this.state;

    if (!references || references.isFetching) {
      return null;
    }

    if (!references.results.length) {
      return (
        <React.Fragment>
          <h2>
            <FormattedMessage 
              id="entity.references.title"
              defaultMessage="Relationships"/>
          </h2>
          <p className="pt-text-muted">
            <FormattedMessage 
              id="entity.references.empty.description"
              defaultMessage="There are no known relationships."/>
          </p>
        </React.Fragment>
      );
    }

    return (
      <section>
        <Tabs id="EntityReferenceTabs" onChange={this.handleTabChange} selectedTabId={activeTab}>
          { references.results.map((ref, i) => {
            return <Tab id={`references-${ref.property.qname}`} key={i}
                        title={
                          <React.Fragment>
                            <Property.Reverse model={ref.property} />
                            <TabCount count={ref.count} />
                          </React.Fragment>
                        }
              panel={
                <React.Fragment>
                  <EntityReferencesTable
                    entity={entity}
                    schema={ref.schema}
                    property={ref.property}
                  /> 
                </React.Fragment>
              }
            />
          })}
        </Tabs>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const fragment = new Fragment(ownProps.history);
  const references = state.entityReferences[ownProps.entity.id];
  const reference = (references && references.results && references.results.length) ? references.results[0] : undefined;
  const defaultTab = reference ? 'references-' + reference.property.qname : undefined;
  const activeTab = fragment.get('content:tab') || defaultTab;
  return { fragment, references, activeTab };
};

EntityReferences = connect(mapStateToProps, {})(EntityReferences)
EntityReferences = withRouter(EntityReferences);
export default EntityReferences;