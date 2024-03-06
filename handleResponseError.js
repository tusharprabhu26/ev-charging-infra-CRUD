async function handleResponseAndError(promise, res, next, errorMessage) {
  try {
    const data = await promise;
    if (data.length === 0) {
      throw new Error(errorMessage);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleResponseAndError,
};
