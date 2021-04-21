import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Button, Divider, Intent } from '@blueprintjs/core';

import { Entity, Schema } from 'components/common';

import './TimelineItemTitle.scss';

class TimelineItemTitle extends Component {
  constructor(props) {
    super(props);
    this.renderDraft = this.renderDraft.bind(this);
    this.renderNondraft = this.renderNondraft.bind(this);
  }

  renderDraft(captionProp) {
    const { entity, onSchemaChange, renderProperty } = this.props;

    return (
      <>
        <div>
          <p className="EditableProperty__label">
            <FormattedMessage
              id="timeline.schema_select.label"
              defaultMessage="type"
            />
          </p>
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={onSchemaChange}
          >
            <Button
              outlined
              small
              intent={Intent.PRIMARY}
              icon={<Schema.Icon schema={entity.schema} />}
              rightIcon="caret-down"
            >
              <Schema.Label schema={entity.schema} />
            </Button>
          </Schema.Select>
        </div>
        {captionProp && (
          <>
            <Divider />
            {renderProperty(captionProp, { defaultEditing: true, className: "TimelineItem__property" })}
          </>
        )}
      </>
    );
  }

  renderNondraft(captionProp) {
    const { entity, renderProperty, writeable } = this.props;

    if (writeable) {
      const hasCaption = captionProp && entity.getProperty(captionProp).length;
      const schemaLabel = hasCaption
        ? <Schema.Icon schema={entity.schema} />
        : <Schema.Label schema={entity.schema} icon />

      return (
        <>
          {schemaLabel}
          {!!captionProp && !hasCaption && <Divider />}
          {captionProp && renderProperty(captionProp, { minimal: true })}
        </>
      );
    } else {
      return <Entity.Label entity={entity} icon />
    }
  }

  render() {
    const { children, entity, isDraft } = this.props;

    const captionProp = entity.schema.caption?.[0];

    return (
      <div className="TimelineItemTitle">
        <span className="TimelineItemTitle__text">
          {isDraft && this.renderDraft(captionProp)}
          {!isDraft && this.renderNondraft(captionProp)}
        </span>
        {children}
      </div>
    );
  }
}

export default injectIntl(TimelineItemTitle);
