import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';

import { selectEntityReferences } from 'src/selectors';
import Fragment from 'src/app/Fragment';
import { SectionLoading, DualPane, ErrorSection } from 'src/components/common';
import { EntityReferencesTable } from 'src/components/Entity';
import EntityViewsMenu from "../ViewsMenu/EntityViewsMenu";

import './EntityContent.css';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
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

    if (references.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <DualPane.ContentPane className='view-menu-flex-direction'>
        { references.total === 0 && (
          <ErrorSection visual="graph" title={intl.formatMessage(messages.no_relationships)} />
        )}
        {references.results.map((ref, i) => (
          <EntityReferencesTable
            entity={entity}
            schema={ref.schema}
            property={ref.property}
            activeTab={activeTab}
          />
        ))}
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { id } = ownProps.entity;
  const fragment = new Fragment(ownProps.history);
  const references = selectEntityReferences(state, id);
  const reference = (!references.isLoading && references.results !== undefined && references.results.length) ? references.results[0] : undefined;
  const defaultTab = reference ? 'references-' + reference.property.qname : 'default';
  const activeTab = fragment.get('mode') || defaultTab;
  
  // const similarPath = id ? `entities/${id}/similar` : undefined;
  // const similarQuery = Query.fromLocation(similarPath, {}, {}, 'similar').limit(75);

  return { fragment, references, activeTab };
};

EntityReferences = connect(mapStateToProps, {}, null, { pure: false })(EntityReferences);
EntityReferences = withRouter(EntityReferences);
EntityReferences = injectIntl(EntityReferences);
export default EntityReferences;
