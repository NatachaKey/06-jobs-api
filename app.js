require('dotenv').config();
require('express-async-errors');

//extra security package
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

//Swagger 
const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')
//const swaggerDocument = YAML.load('./swagger.yaml')
let swaggerDocument;
if (process.env.ENVIRONMENT === "local") {
    swaggerDocument = YAML.load('./swagger-local.yaml')
} else {
    swaggerDocument = YAML.load('./swagger.yaml')
}

const express = require('express');
const app = express();

//connect DB
const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

//routers
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');


app.set('trust proxy', 1)
app.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
}));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

// app.get('/', (req, res) =>{
//   res.send('<h1>jobs API</h1> <a href="/api-docs">Read the documentation</a>')
// })

//connecting with frontend
app.use(express.static('public'))

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

// routes
//will get both /api/v1/auth/register and /api/v1/auth/login
app.use('/api/v1/auth', authRouter);
//the same for jobs router
app.use('/api/v1/jobs', authenticateUser, jobsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
