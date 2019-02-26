import React, {Component} from 'react';
import {FormattedMessage} from "react-intl";
import {Count, Property} from 'src/components/common';




class EntityInfoMode extends Component {
  render() {
    const { entity } = this.props;

    const entityProperties = entity.getProperties()
      .filter(propValue => !propValue.isEmpty())
      .filter(propValue => !propValue.property.hidden);

    return <ul className="info-sheet">
      { entityProperties.map((propValue) => (
        <li key={propValue.name}>
          <span className="key">
            <Property.Name model={propValue.property} />
          </span>
          <span className="value">
            <Property.Values model={propValue} />
          </span>
        </li>
      ))}
        <li>
          <span className='key'>
            <span><FormattedMessage
              id="infoMode.collection"
              defaultMessage="Collection"
            /></span>
          </span>
          <span className='value bp3-running-text'>
            <span>
              <ui className="info-sheet">
                <li>
                  <a href={entity.collection.links.ui}>
                    <b>{entity.collection.label}</b>
                  </a>
                </li>
                {entity.collection.summary && <li>
                  <span className='bp3-text-muted'>{entity.collection.summary}</span>
                </li>}
                <li>
                  <span>
                    <FormattedMessage
                      id="infoMode.collection.entries"
                      defaultMessage="{count} entries"
                      values={{
                        count:<Count count={entity.collection.count}/>
                      }}
                    />
                  </span>
                </li>
              </ui>
            </span>
          </span>
        </li>
    </ul>
  }
}


export default EntityInfoMode;
