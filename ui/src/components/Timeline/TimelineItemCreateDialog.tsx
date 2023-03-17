import { FC, useState, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Dialog, Intent, Classes } from '@blueprintjs/core';
import { Model, Schema, Entity } from '@alephdata/followthemoney';
import TimelineItemCreateForm from './TimelineItemCreateForm';
import { useFormValidity } from './util';

type TimelineItemCreateDialogProps = Dialog['props'] & {
  model: Model;
  onCreate: (entity: Entity) => void;
  fetchEntitySuggestions: (
    schema: Schema,
    query: string
  ) => Promise<Array<Entity>>;
};

const TimelineItemCreateDialog: FC<TimelineItemCreateDialogProps> = ({
  model,
  isOpen,
  onClose,
  onCreate,
  fetchEntitySuggestions,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isValid, onInput] = useFormValidity(formRef);

  // Reset the loading state when the dialog is closed
  useEffect(() => {
    !isOpen && setIsSubmitting(false);
  }, [isOpen]);

  const title = (
    <FormattedMessage
      id="timeline.create_entitity.title"
      defaultMessage="Add new item to timeline"
    />
  );

  return (
    <Dialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      shouldReturnFocusOnClose={false}
    >
      <div className={Classes.DIALOG_BODY}>
        <TimelineItemCreateForm
          id="timeline-item-create-form"
          ref={formRef}
          model={model}
          onInput={onInput}
          onKeyDown={(event) =>
            event.key === 'Enter' && formRef.current?.reportValidity()
          }
          onSubmit={(entity) => {
            setIsSubmitting(true);
            onCreate(entity);
          }}
          fetchEntitySuggestions={fetchEntitySuggestions}
        />
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            type="submit"
            form="timeline-item-create-form"
            intent={Intent.PRIMARY}
            loading={isSubmitting}
            disabled={!isValid}
          >
            <FormattedMessage
              id="timeline.create_entity.submit"
              defaultMessage="Add"
            />
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default TimelineItemCreateDialog;
