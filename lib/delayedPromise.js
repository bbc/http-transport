module.exports = (timeInSecs) => {
  return (reason) => {
    return new Promise((resolve, reject) => {
      setTimeout(reject.bind(null, reason), timeInSecs);
    });
  };
};
