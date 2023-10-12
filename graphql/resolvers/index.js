// const authResolver = require('./auth');
// const eventsResolver = require('./events');
// const bookingResolver = require('./booking');

// const rootResolver = {
//   ...authResolver,
//   ...eventsResolver,
//   ...bookingResolver
// };

// module.exports = rootResolver;

const bcrypt = require('bcryptjs');

const Event = require("../../models/event");
const User = require("../../models/user");


const events = async eventIds => {
  try {
    const events = await Event.find({
      _id: {
        $in: eventIds
      }
    })
    events.map(event => {
      return {
        ...event._doc,
        _id: event.id,
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, event.creator)
      }
    });
    return events;
  } catch (error) {
    throw error
  }
}

const user = async userId => {
  try {
    const user = await User.findById(userId)
    return {
      ...user._doc,
      _id: user.id,
      createdEvents: events.bind(this, user._doc.createdEvents)
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  events: async () => {
    try {
      const events = await Event.find();
      return events
        .map(event => {
          return {
            ...event._doc,
            _id: event.id,
            date: new Date(event._doc.date).toISOString(),
            creator: user.bind(this, event._doc.creator)
          };
        })
    } catch (error) {
      throw error;
    }

    // return ['Romantic cooking', 'Sailing', 'All-night coding'];
    return events;
  },
  createEvent: async (args) => {

    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: '65281e9d5f02ff6c18eec8ed'
    });
    let createdEvent;
    try {
      const result = await event.save();
      createdEvent = {
        ...result._doc,
        _id: result._doc._id.toString(),
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, result._doc.creator)
      }
      const creator = await User.findById('65281e9d5f02ff6c18eec8ed')

      if (!creator) {
        throw new Error('User not found!');
      }
      creator.createdEvents.push(event);
      await creator.save();

      return createdEvent;
    } catch (error) {
      console.log(error);
      throw error;
    }

  },
  createUser: async args => {
    try {
      const existingUser = await User.findOne({
        email: args.userInput.email
      })
      if (existingUser) {
        throw new Error('User exists already!');
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12)

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword
      });
      const result = await user.save();

      return {
        ...result._doc,
        password: null,
        _id: result.id
      }
    } catch (error) {
      throw error;
    }

  }
}