import React, { Component } from 'react';
import { connect } from 'react-redux';

import getHost from 'src/util/getHost';
import Entity from './Entity';
import Country from 'src/components/common/Country';
import Date from 'src/components/common/Date';


class Value extends Component {
  render() {
    const { value, model } = this.props;
    if (!value) {
        return null;
    }
    if (model.type === 'country') {
        return (<Country.Name code={value} />);
    }
    if (model.type === 'url' || model.type === 'uri') {
        return (
            <a href={value} rel="noopener noreferrer" target='_blank'>
                <i className="fa fa-external-link-square" aria-hidden="true"></i>
                { getHost(value) }
            </a>
        );
    }
    if (model.type === 'entity') {
        return (<Entity.Link entity={value} />);
    }
    if (model.type === 'date') {
        return (<Date value={value} />);
    }
    return (
      <span>{value}</span>
    );
  }
}

class Name extends Component {
  render() {
    const { name, model } = this.props,
          label = model.label || name;

    return (
      <span>{label}</span>
    );
  }
}

class Table extends Component {
  render() {
    const { properties, schema, schemata, children } = this.props,
          model = schemata[schema] || {};

    let items = [];
    Object.entries(properties).forEach(([name, values]) => {
        const propModel = model.properties[name];
        if (!propModel || propModel.hidden || !values.length) {
            return;
        }
        values.forEach((value, i) => {
            var header = [];
            if (i === 0) {
                header.push((
                    <th key={name} rowSpan={ values.length }>
                        <Name name={name} model={propModel} />
                    </th>
                ))
            }
            items.push((
                <tr key={`${name}-${i}`}>
                    {header}
                    <td>
                        <Value value={value} model={propModel} />
                    </td>
                </tr>
            ));
        });
    });

    return (
      <table>
        <tbody>
            {items}
            {children}
        </tbody>
      </table>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    schemata: state.metadata.schemata
  };
}

class Property extends Component {
  static Name = Name;
  static Value = Value;
  static Table = connect(mapStateToProps)(Table);
}

export default Property;
