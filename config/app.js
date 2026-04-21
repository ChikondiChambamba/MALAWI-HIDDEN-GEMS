const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const env = require('./env');

const pageRoutes = require('../routes/pageRoutes');
const postRoutes = require('../routes/postRoutes');
const contactRoutes = require('../routes/contactRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { requestLogger } = require('../middleware/requestLogger');
const { securityHeaders } = require('../middleware/securityHeaders');
const { notFoundHandler } = require('../middleware/notFoundHandler');
const { errorHandler } = require('../middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.locals.siteName = 'Malawi Tourism Blog';

app.use(securityHeaders);
app.use(requestLogger);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.isAdmin = Boolean(req.session && req.session.isAdmin);
  next();
});

app.use('/', pageRoutes);
app.use('/', postRoutes);
app.use('/', contactRoutes);
app.use('/', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
