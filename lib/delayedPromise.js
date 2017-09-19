module.exports = (timeInMs) => {
  return (reason) => {
    return new Promise((resolve, reject) => {
      setTimeout(reject.bind(null, reason), timeInMs);
    });
  };
};
