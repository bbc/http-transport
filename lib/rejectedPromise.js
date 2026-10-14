'use strict';

module.exports = (timeInMs) => {
  return (reason) => {
    return new Promise((_resolve, reject) => {
      setTimeout(reject.bind(null, reason), timeInMs);
    });
  };
};
