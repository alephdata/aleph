import _ from 'lodash';

export default function ensureArray(value) {
    if (_.isEmpty(value)) {
        return [];
    }
    if (_.isString(value)) {
        return [value];
    }
    return _.sortedUniq(_.toArray(value));
}
