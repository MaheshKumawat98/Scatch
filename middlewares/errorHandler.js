const isDev = process.env.NODE_ENV === 'development';

const errorHandler = (err, req, res, next) => {
    console.error('Server Error:', err);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Something went wrong on our end';

    res.status(statusCode).render('error', {
        statusCode,
        message,
        stack: isDev ? err.stack : null,
    });
};

module.exports = errorHandler;
