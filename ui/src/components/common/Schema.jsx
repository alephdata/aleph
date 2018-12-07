import React, {Component, PureComponent} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {selectSchemata} from 'src/selectors';
import Icon from "./Icon";

class SchemaIcon extends PureComponent {
  render() {
    const {schema} = this.props;

    return <Icon className='entity-icon'
                 iconSize='16px'
                 name={schema.toLowerCase()} />;
  }
}

class SchemaLabel extends Component {
  render() {
    const { schema, schemata, plural, icon } = this.props;
    const model = schemata[schema];
    const label = model.getLabel({
      forcePlural: plural
    });
    if (icon) {
      return (
        <span><Schema.Icon schema={schema}/> {label}</span>
      );
    }
    return label;
  }
}

class SchemaLink extends Component {
  render() {
    const { schema, plural, url } = this.props;
    return (
        <React.Fragment>
          <Schema.Icon schema={schema}/>
          <Link to={url}>
            <Schema.Label schema={schema} icon={false} plural={plural}/>
          </Link>
        </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  schemata: selectSchemata(state),
});

class Schema extends Component {
  static Label = connect(mapStateToProps)(SchemaLabel);
  static Icon = connect(mapStateToProps)(SchemaIcon);
  static Link = connect(mapStateToProps)(SchemaLink);
}

export default Schema;
