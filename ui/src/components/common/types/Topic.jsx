// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { Component } from 'react';
import { connect } from 'react-redux';
import { Topic as VLTopic, TopicSelect } from '@alephdata/react-ftm';
import { selectLocale, selectModel } from 'selectors';

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
