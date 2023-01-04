import { FormattedMessage } from 'react-intl';
import { Intent, Spinner, Tag } from '@blueprintjs/core';

enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  IN_PROGRESS = 'IN_PROGRESS',
}

type UpdateStatusProps = {
  status?: Status;
};

function UpdateStatus({ status }: UpdateStatusProps) {
  const commonProps = { className: 'UpdateStatus', large: true, minimal: true };

  if (status === Status.ERROR) {
    return (
      <Tag intent={Intent.DANGER} icon="error" {...commonProps}>
        <FormattedMessage
          id="entity.status.error"
          defaultMessage="Error saving"
        />
      </Tag>
    );
  }

  if (status === Status.IN_PROGRESS) {
    return (
      <Tag
        intent={Intent.PRIMARY}
        icon={<Spinner size={16} intent={Intent.PRIMARY} />}
        {...commonProps}
      >
        <FormattedMessage
          id="entity.status.in_progress"
          defaultMessage="Saving"
        />
      </Tag>
    );
  }

  // If no status or an unknown status is passed to the component, it will
  // display "Saved". It would be better to be strict and always require a
  // valid status. Keeping this behavior to prevent breaking API changes.
  return (
    <Tag intent={Intent.SUCCESS} icon="tick" {...commonProps}>
      <FormattedMessage id="entity.status.success" defaultMessage="Saved" />
    </Tag>
  );
}

UpdateStatus.SUCCESS = Status.SUCCESS;
UpdateStatus.ERROR = Status.ERROR;
UpdateStatus.IN_PROGRESS = Status.IN_PROGRESS;

export default UpdateStatus;
