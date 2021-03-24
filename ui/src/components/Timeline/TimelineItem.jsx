import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, EditableText } from '@blueprintjs/core';
import { PropertyEditor, PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';


import { selectModel } from 'selectors';
import { Entity, Property, Schema } from 'components/common';


import './TimelineItem.scss';


const messages = defineMessages({
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  // empty: {
  //   id: 'timeline.empty',
  //   defaultMessage: 'This timeline is empty',
  // }
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { entity, model } = props;

    this.state = {
      entity: entity || new FTMEntity(model, { schema: 'Event', id: `${Math.random()}` }),
      addedProps: []
    }

    this.onSchemaChange = this.onSchemaChange.bind(this);
    this.onPropertyEdit = this.onPropertyEdit.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onNewPropertyAdded = this.onNewPropertyAdded.bind(this);
  }

  onSchemaChange(schema) {
    const { model } = this.props;

    this.setState({
      entity: new FTMEntity(model, { schema, id: `${Math.random()}` })
    });
  }

  onPropertyEdit(entity) {
    this.setState({ entity });
    this.props.onUpdate(entity);
  }

  onNewPropertyAdded(prop) {
    this.setState(({ addedProps }) => ({ addedProps: [...addedProps, prop.name] }));
  }

  getVisibleProperties() {
    const { addedProps, entity } = this.state;

    return Array.from(new Set([...entity.schema.featured, ...entity.getProperties().map(prop => prop.name), ...addedProps]));
  }

  renderProperty(propName) {
    const { fetchEntitySuggestions } = this.props;
    const { entity } = this.state;

    return (
      <Property.Editable
        key={propName}
        entity={entity}
        property={propName}
        onEdit={this.onPropertyEdit}
        fetchEntitySuggestions={fetchEntitySuggestions}
      />
    )
  }

  render() {
    const { intl, model } = this.props;
    const { entity } = this.state;

    const captionProp = entity.schema.caption?.[0];
    const reservedProps = [captionProp, 'date', 'endDate', 'description'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    return (
      <Card className="TimelineItem">
        <div className="TimelineItem__secondary">
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={this.onSchemaChange}
          >
            <Schema.Label schema={entity.schema} icon />
          </Schema.Select>
          <h5 className="TimelineItem__date">
            {this.renderProperty('date')}
            -
            {this.renderProperty('endDate')}
          </h5>
          <div className="TimelineItem__date">
          </div>
        </div>
        <div className="TimelineItem__main">
          {captionProp && (
            <div className="TimelineItem__main__title">
              {this.renderProperty(captionProp)}
            </div>
          )}
          <div className="TimelineItem__main__content">
            {this.renderProperty('description')}
            {visibleProps.map(this.renderProperty)}
            <PropertySelect
              properties={availableProps}
              onSelected={this.onNewPropertyAdded}
            />
          </div>
        </div>
      </Card>
    )

  //   return (
  //     <Card className="TimelineItem">
  //       <div className="TimelineItem__secondary">
  //         <Schema.Label schema={item.schema} icon />
  //         <h5 className="TimelineItem__date">
  //           <Property.Values prop={item.schema.getProperty('date')} values={properties['date']} />
  //         </h5>
  //         <div className="TimelineItem__property">
  //           <h5 className="TimelineItem__property__label">Organized by</h5>
  //           <div className="TimelineItem__property__values">
  //             <Entity.Link entity={testPerson} icon />
  //           </div>
  //         </div>
  //         <div className="TimelineItem__property">
  //           <h5 className="TimelineItem__property__label">Involved</h5>
  //           <div className="TimelineItem__property__values">
  //             <Entity.Link className="TimelineItem__property__value" entity={testCompany} icon />
  //             <Entity.Link className="TimelineItem__property__value" entity={testPerson} icon />
  //           </div>
  //         </div>
  //       </div>
  //       <div className="TimelineItem__main">
  //         <div className="TimelineItem__main__title">
  //           <Entity.Link entity={testEntity} icon />
  //         </div>
  //         <div className="TimelineItem__main__content">
  //           <p className="TimelineItem__summary">
  //             Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  //           </p>
  //         </div>
  //       </div>
  //     </Card>
  //   );
  }
}

const mapStateToProps = (state) => {
  return {
    model: selectModel(state)
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(TimelineItem);
