import React, { lazy } from 'react';
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


import './DocumentViewMode.scss';
import { selectEntityDirectionality } from 'selectors';

const PdfViewer = lazy(() => import(/* webpackChunkName: 'base' */ 'src/viewers/PdfViewer'));


export class DocumentViewMode extends React.Component {
  renderContent() {
    const { document, queryText, activeMode, dir } = this.props;
    const processingError = document.getProperty('processingError');

    if (processingError && processingError.length) {
      return <DefaultViewer document={document} queryText={queryText} dir={dir} />;
    }

    if (document.schema.isA('Email')) {
      if (activeMode === 'browse') {
        return (
          <FolderViewer document={document} queryText={queryText} dir={dir} />
        );
      }
      return (
        <EmailViewer document={document} queryText={queryText} activeMode={activeMode} dir={dir} />
      );
    }
    if (document.schema.isA('Image')) {
      if (activeMode === 'text') {
        return (
          <TextViewer document={document} queryText={queryText} dir={dir} />
        );
      }
      return (
        <ImageViewer
          document={document}
          queryText={queryText}
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
        <TableViewer document={document} queryText={queryText} dir={dir} />
      );
    }
    if (document.schema.isA('PlainText')) {
      return (
        <TextViewer document={document} queryText={queryText} dir={dir} />
      );
    }
    if (document.schema.isA('HyperText')) {
      return (
        <HtmlViewer document={document} queryText={queryText} dir={dir} />
      );
    }
    if (document.schema.isA('Pages')) {
      return (
        <PdfViewer
          document={document}
          queryText={queryText}
          activeMode={activeMode}
          dir={dir}
        />
      );
    }
    if (document.schema.isA('Folder')) {
      return (
        <FolderViewer document={document} queryText={queryText} dir={dir} />
      );
    }

    return <DefaultViewer document={document} queryText={queryText} dir={dir} />;
  }

  render() {
    return (
      <div className="DocumentViewMode">
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
    queryText: query.getString('q'),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(DocumentViewMode);
