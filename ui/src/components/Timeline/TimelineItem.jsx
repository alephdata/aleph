import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import queryString from 'query-string';
import c from 'classnames';

import { selectModel } from 'selectors';
import { Property } from 'components/common';
import TimelineItemMenu from 'components/Timeline/TimelineItemMenu';
import TimelineItemTitle from 'components/Timeline/TimelineItemTitle';

import './TimelineItem.scss';


const messages = defineMessages({
  involved_button_text: {
    id: 'timeline.involved.button_text',
    defaultMessage: 'Add involved entities'
  }
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { entity, isActive, model } = props;

    this.state = {
      entity: entity || new FTMEntity(model, { schema: 'Event', id: `${Math.random()}` }),
      addedProps: [],
      itemExpanded: isActive,
    }

    this.onSchemaChange = this.onSchemaChange.bind(this);
    this.onPropertyEdit = this.onPropertyEdit.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onNewPropertyAdded = this.onNewPropertyAdded.bind(this);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const { isActive } = this.props;

    if (isActive) {
      this.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  toggleExpanded() {
    this.setState(({ itemExpanded }) => ({ itemExpanded: !itemExpanded }));
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
    const { writeable } = this.props;
    const { addedProps, entity } = this.state;

    const filledProps = entity.getProperties().filter(prop => !prop.hidden).map(prop => prop.name);

    if (!writeable) {
      return filledProps;
    } else {
    return Array.from(new Set([...entity.schema.featured, ...filledProps, ...addedProps]));
    }
  }

  renderProperty(propName, options) {
    const { createNewEntity, fetchEntitySuggestions, writeable } = this.props;
    const { entity } = this.state;

    return (
      <Property.Editable
        key={propName}
        entity={entity}
        prop={propName}
        onEdit={(updatedEntity) => this.onPropertyEdit(updatedEntity, propName)}
        fetchEntitySuggestions={fetchEntitySuggestions}
        writeable={writeable}
        createNewReferencedEntity={createNewEntity}
        {...options}
      />
    )
  }

  renderDate() {
    const { writeable } = this.props;
    const { entity } = this.state;

    const hasEndDate = entity.getProperty('endDate').length;
    const dateProp = (hasEndDate || (!entity.getProperty('date').length && entity.getProperty('startDate').length)) ? 'startDate' : 'date';
    const date = this.renderProperty(dateProp, { minimal: true, emptyPlaceholder: ' - ' })

    if (!writeable && !hasEndDate) {
      return date;
    }

    return (
      <FormattedMessage
        id="timeline.item.date"
        defaultMessage="{start}to{end}"
        values={{
          start: date,
          end: this.renderProperty('endDate', { minimal: true, emptyPlaceholder: ' - ' })
        }}
      />
    );
  }

  renderInvolved() {
    const { expandedMode, intl } = this.props;
    const { entity } = this.state;

    const schemaName = entity.schema.name;

    if (schemaName === 'Event') {
      return (
        <div className="TimelineItem__involved">
          {this.renderProperty('involved', { toggleButtonProps: {
            text: intl.formatMessage(messages.involved_button_text),
            icon: 'add',
            minimal: expandedMode,
            outlined: !expandedMode,
            intent: Intent.PRIMARY,
            small: true,
            fill: true
          }})}
        </div>
      );
    } else if (entity.schema.edge) {
      return (
        <>
          <div className="TimelineItem__involved">
            {this.renderProperty(entity.schema.edge.source)}
          </div>
          <div className="TimelineItem__involved">
            {this.renderProperty(entity.schema.edge.target)}
          </div>
        </>
      );
    }
  }


  render() {
    const { expandedMode, isActive, isDraft, onDelete, onRemove, onSubmit, writeable } = this.props;
    const { entity, itemExpanded } = this.state;

    const expanded = expandedMode || itemExpanded;

    const captionProp = entity.schema.caption?.[0];
    const edgeProps = [entity.schema.edge?.source, entity.schema.edge?.target];
    const reservedProps = [captionProp, ...edgeProps, 'date', 'startDate', 'endDate', 'description', 'involved'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    return (
      <div id={entity.id} ref={this.ref} className={c("TimelineItem", { draft: isDraft, active: isActive, 'item-expanded': itemExpanded })}>
        <div className="TimelineItem__content">
          {!expandedMode && (
            <div className="TimelineItem__collapse-toggle">
              <Button minimal small icon={itemExpanded ? 'chevron-down' : 'chevron-up'} onClick={this.toggleExpanded} />
            </div>
          )}
          <div className="TimelineItem__secondary">
            <div className="TimelineItem__date">
              {this.renderDate()}
            </div>
            {expanded && this.renderInvolved()}
          </div>
          <div className="TimelineItem__main">
            <TimelineItemTitle
              entity={entity}
              isDraft={isDraft}
              writeable={writeable}
              onSchemaChange={this.onSchemaChange}
              renderProperty={this.renderProperty}
            >
              {!isDraft && (
                <TimelineItemMenu
                  entity={entity}
                  onDelete={onDelete}
                  onRemove={onRemove}
                  writeable={writeable}
                />
              )}
            </TimelineItemTitle>
            {expanded && (
              <>
                <div className="TimelineItem__description TimelineItem__property">
                  {this.renderProperty('description')}
                </div>
                <div className="TimelineItem__properties">
                  {visibleProps.map(prop => (
                    <div className="TimelineItem__property" key={prop}>
                      {this.renderProperty(prop, { showLabel: true, className: "TimelineItem__property" })}
                    </div>
                  ))}
                  {!isDraft && writeable && (
                    <div className="TimelineItem__property">
                      <PropertySelect
                        properties={availableProps}
                        onSelected={this.onNewPropertyAdded}
                        buttonProps={{ minimal: true, small: true }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {isDraft && (
          <div className="TimelineItem__draft-buttons">
            <ButtonGroup>
              <Button onClick={onDelete} icon="trash">
                <FormattedMessage
                  id="timeline.create.cancel"
                  defaultMessage="Delete"
                />
              </Button>
              <Button onClick={onSubmit} icon="add" intent={Intent.PRIMARY}>
                <FormattedMessage
                  id="timeline.create.submit"
                  defaultMessage="Create"
                />
              </Button>
            </ButtonGroup>
          </div>
        )}
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
