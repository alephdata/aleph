import { Component } from 'react';
import { connect } from 'react-redux';
import { Topic as VLTopic, TopicSelect } from '/src/react-ftm/index.ts';
import { selectLocale, selectModel } from '/src/selectors.js';

const mapStateToProps = (state) => {
  const model = selectModel(state);
  const locale = selectLocale(state);
  return { fullList: model.types.topic.values, locale };
};

class Topic extends Component {
  static Name = connect(mapStateToProps)(VLTopic.Label);

  static List = connect(mapStateToProps)(VLTopic.List);

  static MultiSelect = connect(mapStateToProps)(TopicSelect);
}

export default Topic;
