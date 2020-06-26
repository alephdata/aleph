import React, { PureComponent } from 'react';
import { Button, Icon, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import c from 'classnames';
import getDiagramLink from 'src/util/getDiagramLink';


class DiagramLabel extends PureComponent {
  render() {
    const { diagram, icon } = this.props;
    if (!diagram || !diagram.id) {
      return null;
    }

    return (
      <span className="DiagramLabel" title={diagram.label}>
        {icon && <Icon icon="graph" className="left-icon" />}
        <span>{diagram.label}</span>
      </span>
    );
  }
}

class DiagramLink extends PureComponent {
  render() {
    const { diagram, className } = this.props;
    const content = <Diagram.Label {...this.props} />;

    return <Link to={getDiagramLink(diagram)} className={c('DiagramLink', className)}>{content}</Link>;
  }
}

class DiagramSelect extends PureComponent {
  itemRenderer = (diagram, {handleClick}) => {
    return (
      <MenuItem
        key={diagram.id}
        onClick={handleClick}
        text={<DiagramLabel diagram={diagram} icon />}
      />
    );
  }

  render() {
    const { buttonProps, items, noResults, onSelect } = this.props;

    return (
      <Select
        itemRenderer={this.itemRenderer}
        items={items}
        onItemSelect={onSelect}
        popoverProps={{ minimal: true, fill: true, position: "auto-start" }}
        inputProps={{ fill: true }}
        filterable={false}
        noResults={<span className="error-text">{noResults}</span>}
        resetOnClose
        resetOnSelect
      >
        <Button
          fill
          icon="graph"
          rightIcon="caret-down"
          alignText="left"
          {...buttonProps}
        />
      </Select>
    )
  }
}

class Diagram {
  static Label = DiagramLabel;

  static Link = withRouter(DiagramLink);

  static Select = DiagramSelect;
}

export default Diagram;
