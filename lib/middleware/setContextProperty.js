import _ from 'lodash';

export default (opts, path) => {
  return (ctx, next) => {
    _.set(ctx, path, opts);
    return next();
  };
};
