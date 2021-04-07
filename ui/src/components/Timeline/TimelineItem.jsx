import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import { Button, Card, Divider } from '@blueprintjs/core';
import { PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import queryString from 'query-string';

import { selectModel } from 'selectors';
import { Entity, Property, Schema } from 'components/common';
import TimelineItemMenu from 'components/Timeline/TimelineItemMenu';
import './TimelineItem.scss';


// const messages = defineMessages({});

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
    this.ref = React.createRef();
  }

  componentDidMount() {
    const { isActive } = this.props;

    if (isActive) {
      this.ref.current?.scrollIntoView();
    }
  }

  onSchemaChange(schema) {
    const { model } = this.props;

    this.setState({
      entity: new FTMEntity(model, { schema, id: `${Math.random()}` })
    });
  }

  onPropertyEdit(entity, propName) {
    const validatedEntity = this.checkDates(entity, propName);
    this.setState({ entity: validatedEntity });
    this.props.onUpdate(validatedEntity);
  }

  onNewPropertyAdded(prop) {
    this.setState(({ addedProps }) => ({ addedProps: [...addedProps, prop.name] }));
  }

  checkDates(entity, editedProp) {
    if (editedProp === 'endDate') {
      const date = entity.getProperty('date');
      const startDate = entity.getProperty('startDate');
      const endDate = entity.getProperty('endDate');
      if (endDate.length > 0 && !startDate.length) {
        entity.properties.set(entity.schema.getProperty('startDate'), date);
        entity.properties.delete(entity.schema.getProperty('date'));
      } else if (!endDate.length && startDate.length > 0) {
        entity.properties.set(entity.schema.getProperty('date'), startDate);
        entity.properties.delete(entity.schema.getProperty('startDate'));
      }
    }
    return entity;
  }

  getVisibleProperties() {
    const { addedProps, entity } = this.state;

    return Array.from(new Set([...entity.schema.featured, ...entity.getProperties().map(prop => prop.name), ...addedProps]));
  }

  renderProperty(propName, options) {
    const { fetchEntitySuggestions } = this.props;
    const { entity } = this.state;

    return (
      <Property.Editable
        key={propName}
        entity={entity}
        prop={propName}
        onEdit={(updatedEntity) => this.onPropertyEdit(updatedEntity, propName)}
        fetchEntitySuggestions={fetchEntitySuggestions}
        {...options}
      />
    )
  }

  renderTitle() {
    const { isDraft } = this.props;
    const { entity } = this.state;

    const captionProp = entity.schema.caption?.[0];

    if (isDraft) {
      return (
        <>
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={this.onSchemaChange}
          >
            <Button
              minimal
              small
              icon={<Schema.Icon schema={entity.schema} />}
              rightIcon="caret-down"
            >
              <Schema.Label schema={entity.schema} />
            </Button>
          </Schema.Select>
          {captionProp && (
            <>
              <Divider />
              {this.renderProperty(captionProp, { defaultEditing: true, className: "TimelineItem__property" })}
            </>
          )}
        </>
      )
    } else if (captionProp) {
      return (
        <>
          <Schema.Icon schema={entity.schema} className="left-icon" />
          {this.renderProperty(captionProp)}
        </>
      );
    } else {
      return <span style={{ textTransform: 'italic'}}><Entity.Label entity={entity} icon /></span>
    }
  }


  render() {
    const { isActive, isDraft, onDelete, onRemove } = this.props;
    const { entity } = this.state;

    const captionProp = isDraft && entity.schema.caption?.[0];
    // const otherRequiredProps = entity.schema.required.filter(prop => prop !== captionProp);
    const reservedProps = [captionProp, 'date', 'startDate', 'endDate', 'description'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    const hasEndDate = entity.getProperty('endDate').length > 0;
    const dateProp = (hasEndDate || (!entity.getProperty('date').length && entity.getProperty('startDate').length > 0)) ? 'startDate' : 'date';

    return (
      <div id={entity.id} ref={this.ref}>
        <Card elevation={isActive ? 3 : 1} className="TimelineItem">
          <TimelineItemMenu
            entity={entity}
            isDraft={isDraft}
            onDelete={onDelete}
            onRemove={onRemove}
          />
          <div className="TimelineItem__main">
            <div className="TimelineItem__title bp3-heading">
              {this.renderTitle()}
            </div>
            <div className="TimelineItem__main__content">
              <div className="TimelineItem__date">
                {this.renderProperty(dateProp)}
                <span className="TimelineItem__date__divider text-muted">-</span>
                {this.renderProperty('endDate')}
              </div>
            </div>
          </div>
          <div className="TimelineItem__secondary">
            <div className="TimelineItem__secondary__content">
              {visibleProps.map(prop => this.renderProperty(prop, { showLabel: true, className: "TimelineItem__property" }))}
              <PropertySelect
                properties={availableProps}
                onSelected={this.onNewPropertyAdded}
                buttonProps={{ minimal: true, small: true }}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return {
    model: selectModel(state),
    isActive: entity && parsedHash.id === entity.id
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(TimelineItem);
