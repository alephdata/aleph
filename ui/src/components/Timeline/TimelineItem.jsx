// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { Colors } from '@blueprintjs/colors';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { ColorPicker, PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import queryString from 'query-string';
import c from 'classnames';

import withRouter from 'app/withRouter'
import { selectModel } from 'selectors';
import { Property } from 'components/common';
import TimelineItemMenu from 'components/Timeline/TimelineItemMenu';
import TimelineItemTitle from 'components/Timeline/TimelineItemTitle';

import './TimelineItem.scss';

const DEFAULT_COLOR = Colors.BLUE1;

const messages = defineMessages({
  end_date_toggle: {
    id: 'timeline.dates.button_text',
    defaultMessage: 'Add end date'
  },
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { entity, isActive, model } = props;

    this.state = {
      entity: entity || new FTMEntity(model, { schema: 'Event', id: `${Math.random()}` }),
      addedProps: [],
      draftColor: DEFAULT_COLOR,
      showEndDate: false,
      itemExpanded: isActive,
    }

    this.onSchemaChange = this.onSchemaChange.bind(this);
    this.onPropertyEdit = this.onPropertyEdit.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onNewPropertyAdded = this.onNewPropertyAdded.bind(this);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    this.setDraftColor = this.setDraftColor.bind(this);
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

  onPropertyEdit(entity) {
    this.setState({ entity });
    this.props.onUpdate(entity);
  }

  onNewPropertyAdded(prop) {
    this.setState(({ addedProps }) => ({ addedProps: [...addedProps, prop] }));
  }

  setDraftColor(draftColor) {
    this.setState({ draftColor });
  }

  getVisibleProperties() {
    const { writeable } = this.props;
    const { addedProps, entity } = this.state;

    const filledProps = [...entity.getProperties(), ...addedProps]
      .filter(prop => !prop.hidden && prop.type.toString() !== 'entity')
      .map(prop => prop.name);

    if (!writeable) {
      return filledProps;
    } else {
      // hide summary featured prop for events to avoid redundancy
      const featuredProps = entity.schema.featured.filter(prop => prop !== 'summary')
      return Array.from(new Set([...featuredProps, ...filledProps]));
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
        onEdit={this.onPropertyEdit}
        fetchEntitySuggestions={fetchEntitySuggestions}
        writeable={writeable}
        createNewReferencedEntity={createNewEntity}
        {...options}
      />
    )
  }

  renderDate() {
    const { expandedMode, intl, writeable } = this.props;
    const { entity, itemExpanded, showEndDate } = this.state;

    const hasEndDate = entity.getProperty('endDate').length;
    const dateProp = this.renderProperty('date', { minimal: true, emptyPlaceholder: ' - ' })

    if (!hasEndDate && !showEndDate) {
      if (writeable && (expandedMode || itemExpanded)) {
        return (
          <>
            {dateProp}
            <Tooltip content={intl.formatMessage(messages.end_date_toggle)}>
              <Button minimal small icon="array-date" onClick={() => this.setState({ showEndDate: true })} />
            </Tooltip>
          </>
        )
      }
      return dateProp;
    }

    return (
      <span className="TimelineItem__date__value">
        <FormattedMessage
          id="timeline.item.date"
          defaultMessage="{start}to{end}"
          values={{
            start: dateProp,
            end: this.renderProperty('endDate', { minimal: true, emptyPlaceholder: ' - ' })
          }}
        />
      </span>
    );
  }

  getEntityTypeProps() {
    const { addedProps, entity } = this.state;
    const { schema } = entity;

    let baseList;

    if (schema.name === 'Event') {
      baseList = ['involved'];
    } else if (schema.edge) {
      const { source, target } = schema.edge;
      baseList = [source, target]
    } else {
      baseList = schema.getFeaturedProperties()
        .filter(prop => prop.type.toString() === 'entity')
        .map(prop => prop.name);
    }

    const additionalEntityProps = [...entity.getProperties(), ...addedProps]
      .filter(prop => prop.type.toString() === 'entity')
      .map(prop => prop.name);

    return Array.from(new Set([...baseList, ...additionalEntityProps]))
  }

  render() {
    const { color, expandedMode, isActive, isDraft, onColorSelect, onDelete, onRemove, onSubmit, writeable } = this.props;
    const { draftColor, entity, itemExpanded } = this.state;
    const expanded = expandedMode || itemExpanded;
    const captionProp = ((!isDraft && entity.schema.caption.find(prop => entity.hasProperty(prop))) || entity.schema.caption?.[0]);
    const entityTypeProps = this.getEntityTypeProps();
    const reservedProps = [captionProp, ...entityTypeProps, 'date', 'endDate', 'startDate', 'description'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    return (
      <div id={entity.id} ref={this.ref} className={c("TimelineItem", { draft: isDraft, active: isActive, 'item-expanded': itemExpanded })} style={{"--item-color": color || draftColor }}>
        <div className="TimelineItem__content">
          {!expandedMode && (
            <div className="TimelineItem__collapse-toggle">
              <Button minimal small icon={itemExpanded ? 'chevron-down' : 'chevron-up'} onClick={this.toggleExpanded} />
            </div>
          )}
          <div className="TimelineItem__secondary">
            <div className={c("TimelineItem__date", { 'item-expanded': itemExpanded })}>
              {this.renderDate()}
            </div>
            {expanded && entityTypeProps.map(prop => (
              <div key={prop.name} className="TimelineItem__involved">
                {this.renderProperty(prop)}
              </div>
            ))}
          </div>
          <div className="TimelineItem__main">
            <TimelineItemTitle
              entity={entity}
              captionProp={captionProp}
              isDraft={isDraft}
              writeable={writeable}
              onSchemaChange={this.onSchemaChange}
              renderProperty={this.renderProperty}
            >
              {!isDraft && (
                <TimelineItemMenu
                  entity={entity}
                  color={color}
                  onColorSelect={(col) => onColorSelect(entity.id, col)}
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
            <ColorPicker
              currSelected={draftColor}
              onSelect={this.setDraftColor}
            />
            <ButtonGroup>
              <Button onClick={onDelete} icon="trash">
                <FormattedMessage
                  id="timeline.create.cancel"
                  defaultMessage="Delete"
                />
              </Button>
              <Button onClick={() => onSubmit(draftColor)} icon="add" intent={Intent.PRIMARY}>
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
