import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Pre } from '@blueprintjs/core';

import SectionLoading from 'src/components/common/SectionLoading';
import Property from 'src/components/Property';
import wordList from 'src/util/wordList';

import './EmailViewer.scss';


class EmailViewer extends React.Component {
  headerProperty(name, entitiesProp) {
    const { document } = this.props;
    const prop = document.schema.getProperty(name);
    const values = document.getProperty(prop).map((value) => {
      let result = <Property.Value key={value.id || value} prop={prop} value={value} />;
      if (entitiesProp) {
        const normValue = value.toLowerCase().trim();
        const eprop = document.schema.getProperty(entitiesProp);
        document.getProperty(eprop).forEach((entity) => {
          entity.getProperty('email').forEach((email) => {
            if (normValue.indexOf(email.toLowerCase().trim()) !== -1) {
              result = <Property.Value key={entity.id} prop={eprop} value={entity} />;
            }
          });
        });
      }
      return result;
    });
    if (values.length === 0) {
      return null;
    }
    return (
      <tr key={prop.name}>
        <th>{prop.label}</th>
        <td>{wordList(values, ', ')}</td>
      </tr>
    );
  }

  renderHeaders() {
    return (
      <div className="email-header">
        <table className="bp3-html-table">
          <tbody>
            {this.headerProperty('from', 'emitters')}
            {this.headerProperty('date')}
            {this.headerProperty('subject')}
            {this.headerProperty('to', 'recipients')}
            {this.headerProperty('cc', 'recipients')}
            {this.headerProperty('bcc', 'recipients')}
            {this.headerProperty('inReplyToEmail')}
          </tbody>
        </table>
      </div>
    );
  }

  renderBody() {
    const { document } = this.props;
    if (document.safeHtml && document.safeHtml.length) {
      return <span dangerouslySetInnerHTML={{ __html: document.safeHtml }} />;
    }
    const bodyText = document.getFirst('bodyText');
    if (bodyText && bodyText.length > 0) {
      return <Pre>{bodyText}</Pre>;
    }
    return (
      <p className="bp3-text-muted">
        <FormattedMessage id="email.body.empty" defaultMessage="No message body." />
      </p>
    );
  }

  render() {
    const { document } = this.props;
    if (document.isPending) {
      return <SectionLoading />;
    }
    return (
      <div className="outer">
        <div className="inner EmailViewer">
          {this.renderHeaders()}
          <div className="email-body">
            {this.renderBody()}
          </div>
        </div>
      </div>
    );
  }
}

export default EmailViewer;
