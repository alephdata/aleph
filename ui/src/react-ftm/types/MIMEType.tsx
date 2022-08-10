import React from 'react';
import { Icon } from '@blueprintjs/core';
import c from 'classnames';

interface IMIMETypeCommonProps {
  type: string;
  className?: string;
}

const MIMETypeRegistry: { [index: string]: any } = {
  'application/json': { icon: 'code', label: 'JSON' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    icon: 'th',
    label: 'Microsoft Excel',
  },
  'application/vnd.ms-excel': { icon: 'th', label: 'Microsoft Excel' },
  'application/zip': { icon: 'compressed', label: 'Zip Archive' },
  'text/csv': { icon: 'th', label: 'Comma-separated table' },
};

class MIMETypeIcon extends React.Component<IMIMETypeCommonProps> {
  render() {
    const { className, type } = this.props;
    const iconKey = MIMETypeRegistry[type]?.icon || 'document';
    return <Icon icon={iconKey} className={className} />;
  }
}

interface IMIMETypeLabelProps extends IMIMETypeCommonProps {
  icon?: boolean;
}

class MIMETypeLabel extends React.Component<IMIMETypeLabelProps> {
  render() {
    const { className, icon, type } = this.props;
    const label = MIMETypeRegistry[type]?.label;
    if (!label) {
      return null;
    }

    return (
      <span className={c('MIMETypeLabel', className)}>
        {icon && <MIMEType.Icon type={type} className="left-icon" />}
        {label}
      </span>
    );
  }
}

class MIMEType extends React.Component {
  static Label = MIMETypeLabel;

  static Icon = MIMETypeIcon;
}

export default MIMEType;
