const dotenv = require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { buildSchema } = require("graphql");

const Event = require("./models/event");
const User = require("./models/user");

// const graphQlSchema = require('./graphql/schema/index');
// const graphQlResolvers = require('./graphql/resolvers/index');

const isAuth = require('./middleware/is-auth');

const connectDB = require("./config/connectDB");

const app = express();

const events = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(isAuth);

// Middleware
app.use("/graphql", graphqlHttp({
    schema: buildSchema(`

      type Event {
        _id: ID!
        title: String!
        description: String!
        price: Float!
        date: String!
        creator: User!
      }

      type User {
        _id: ID!
        email: String!
        password: String
        createdEvents: [Event!]
      }

      input EventInput {
        title: String!
        description: String!
        price: Float!
        date: String!
      }

      input UserInput {
        email: String!
        password: String!
      }

      type RootQuery {
        events: [Event!]!
      }

      type RootMutation {
        createEvent(eventInput: EventInput): Event
        createUser(userInput: UserInput): User
      }

      schema {
        query: RootQuery
        mutation: RootMutation
      }
    `),
    rootValue: {
      events: () => {
          return Event
          .find()
          .populate('creator')
          .then(result => {
            return result.map(event => {
              return {
                ...event._doc,
                _id: event._doc._id.toString(),
                creator: {
                  ...event._doc.creator._doc,
                  _id: event._doc.creator.id

                }
              };
            })
          })
          .catch(err => {
            console.log(err);
          })

        // return ['Romantic cooking', 'Sailing', 'All-night coding'];
        return events;
      },
      createEvent: (args) => {

        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: '6526b58ade084103b70ef6f9'
        });
        let createdEvent;
        return event
          .save()
          .then(result => {
            createdEvent = { ...result._doc, _id: result._doc._id.toString() }
            return User.findById('6526b58ade084103b70ef6f9')
          })
          .then(user => {
            if (!user) {
              throw new Error('User not found!');
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then(result => {
            return createdEvent;
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      },
      createUser: args => {
        return User.findOne({ email: args.userInput.email }).then(user => {
          if (user) {
            throw new Error('User exists alraedy!');
          }
          return bcrypt.hash(args.userInput.password, 12)
        })
        .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            return user.save();
          })
          .then(result => {
            return { ...result._doc, password: null, _id: result.id }
          })
          .catch((err) => {
            throw err;
          });

      }
    },
    graphiql: true
  })
);

const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // Connect Db
    connectDB();
    // Run server
    app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${PORT}`);
    })
  })
  .catch((error) => {
    console.log(error)}
  );

