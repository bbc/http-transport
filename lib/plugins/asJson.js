module.exports = () => {
  return (ctx, next) => {
    return next().then(() => {
      ctx.res.body = JSON.parse(ctx.res.body);
    });
  };
};
