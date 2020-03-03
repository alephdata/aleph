import React from 'react';
import { Icon, Spinner, Tag } from '@blueprintjs/core';

const StatusIcon = ({ finished, errors }) => {
  let renderedIcon = <Spinner size="14" />;
  if (errors && finished) {
    renderedIcon = <Icon icon="error" />;
  } else if (finished) {
    renderedIcon = <Icon icon="tick-circle" />;
  }
  return renderedIcon;
};

const StatusTag = ({ finished, errors, large }) => {
  const icon = <StatusIcon finished={finished} errors={errors} />;
  let intent;
  if (finished) {
    intent = 'success';
  }
  if (errors) {
    intent = 'danger';
  }
  return <Tag intent={intent} icon={icon} large={large}>{finished ? 'Finished' : 'Running'}</Tag>;
};

export default StatusTag;
