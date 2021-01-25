import React, { lazy, Suspense } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'app/Query';
import AudioViewer from 'viewers/AudioViewer';
import DefaultViewer from 'viewers/DefaultViewer';
import TableViewer from 'viewers/TableViewer';
import TextViewer from 'viewers/TextViewer';
import HtmlViewer from 'viewers/HtmlViewer';
import ImageViewer from 'viewers/ImageViewer';
import FolderViewer from 'viewers/FolderViewer';
import EmailViewer from 'viewers/EmailViewer';
import VideoViewer from 'viewers/VideoViewer';
import EntityActionBar from 'components/Entity/EntityActionBar';
import { SectionLoading } from 'components/common';
import { selectEntityDirectionality } from 'selectors';

import './DocumentViewMode.scss';

const PdfViewer = lazy(() => import(/* webpackChunkName: 'base' */ 'src/viewers/PdfViewer'));

const messages = defineMessages({
  placeholder: {
    id: 'entity.viewer.search_placeholder',
    defaultMessage: 'Search in {label}',
  },
});

export class DocumentViewMode extends React.Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    const { history, location, query } = this.props;
    const newQuery = query.setString('q', queryText);

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  renderActionBar() {
    const { document, query, intl } = this.props;

    if (document.schema.isA('Pages')) {
      return (
        <EntityActionBar
          query={query}
          onSearchSubmit={this.onSearch}
          searchPlaceholder={intl.formatMessage(messages.placeholder, { label: document.getCaption() })}
          searchDisabled={document.getProperty('processingError')?.length}
        />
      );
    }
    return null;
  }

  renderContent() {
    const { document, queryText, activeMode, dir } = this.props;
    const processingError = document.getProperty('processingError');

    if (processingError && processingError.length) {
      return <DefaultViewer document={document} dir={dir} />;
    }

    if (document.schema.isA('Email')) {
      if (activeMode === 'browse') {
        return (
          <FolderViewer document={document} dir={dir} />
        );
      }
      return (
        <EmailViewer document={document} activeMode={activeMode} dir={dir} />
      );
    }
    if (document.schema.isA('Image')) {
      if (activeMode === 'text') {
        return (
          <TextViewer document={document} dir={dir} />
        );
      }
      return (
        <ImageViewer
          document={document}
          activeMode={activeMode}
          dir={dir}
        />
      );
    }
    if (document.schema.isA('Audio')) {
      return (
        <AudioViewer document={document} dir={dir} />
      );
    }

    if (document.schema.isA('Video')) {
      return (
        <VideoViewer document={document} dir={dir} />
      );
    }

    if (document.schema.isA('Table')) {
      return (
        <TableViewer document={document} dir={dir} />
      );
    }
    if (document.schema.isA('PlainText')) {
      return (
        <TextViewer document={document} dir={dir} />
      );
    }
    if (document.schema.isA('HyperText')) {
      return (
        <HtmlViewer document={document} dir={dir} />
      );
    }
    if (document.schema.isA('Pages')) {
      return (
        <Suspense fallback={<SectionLoading />}>
          <PdfViewer
            document={document}
            queryText={queryText}
            activeMode={activeMode}
            dir={dir}
          />
        </Suspense>
      );
    }
    if (document.schema.isA('Folder')) {
      return (
        <FolderViewer document={document} dir={dir} />
      );
    }

    return <DefaultViewer document={document} dir={dir} />;
  }

  render() {
    return (
      <div className="DocumentViewMode">
        {this.renderActionBar()}
        {this.renderContent()}
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location, document } = ownProps;
  const query = Query.fromLocation('entities', location, {}, '');
  return {
    dir: selectEntityDirectionality(state, document),
    query,
    queryText: query.getString('q'),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(DocumentViewMode);
