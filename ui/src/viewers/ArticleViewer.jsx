import React, { PureComponent } from 'react';
import { Pre } from '@blueprintjs/core';

import { Property, Skeleton } from 'components/common';
import wordList from 'util/wordList';

import './ArticleViewer.scss';

class ArticleViewer extends PureComponent {
  headerProperty(name, entitiesProp) {
    const { document } = this.props;
    const prop = document.schema.getProperty(name);
    const values = document.getProperty(prop).map((value) => {
      let result = (
        <Property.Value key={value.id || value} prop={prop} value={value} />
      );
      return result;
    });

    if (values.length === 0) {
      return null;
    }

    return (
      <tr key={prop.qname}>
        <th>{prop.label}</th>
        <td>{wordList(values, ', ')}</td>
      </tr>
    );
  }

  renderHeaders() {
    const { document } = this.props;
    if (document.isPending) {
      return null;
    }

    return (
      <div className="article-header">
        <table className="bp3-html-table">
          <tbody>
            {this.headerProperty('title')}
            {this.headerProperty('author')}
            {this.headerProperty('publishedAt')}
            {this.headerProperty('description')}
          </tbody>
        </table>
      </div>
    );
  }

  renderBody() {
    const { document } = this.props;
    const text = document.isPending ? (
      <Skeleton.Text type="pre" length={4000} />
    ) : (
      <Pre>{document.getFirst('bodyText')}</Pre>
    );
    return text;
  }

  render() {
    const { dir } = this.props;
    return (
      <div className="outer">
        <div className="inner ArticleViewer" dir={dir}>
          {this.renderHeaders()}
          <div className="article-body" dir={dir}>
            {this.renderBody()}
          </div>
        </div>
      </div>
    );
  }
}

export default ArticleViewer;
