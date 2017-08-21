'use strict';

function createStatsName(statsName, feedName) {
  let name = statsName || 'http';
  if (feedName) {
    name += `.${feedName}`;
  }
  return name;
}

module.exports = (stats, statsName, feedName) => {
  return (ctx, next) => {
    return next().then(() => {
      stats.increment(`${createStatsName(statsName, feedName)}.requests`);
      stats.increment(`${createStatsName(statsName, feedName)}.responses.${ctx.res.statusCode}`);
      stats.timing(`${createStatsName(statsName, feedName)}.response_time`, ctx.res.elapsedTime);
    });
  };
};
