const { Router } = require('express');
const Event = require('../models/Event.model');
const User = require('../models/User.model');

const eventRouter = Router();

eventRouter.post('/', async (req, res) => {
  const { userId, title, startDate, endDate } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newEvent = new Event({ userId, title, startDate, endDate });
    await newEvent.save();

    res.status(201).json({ message: 'Event added successfully', event: newEvent });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event', error });
  }
});

eventRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const events = await Event.find({ userId });
    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found for this user' });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Error fetching user events', error });
  }
});

eventRouter.put('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { title, startDate, endDate } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.title = title || event.title;
    event.startDate = startDate || event.startDate;
    event.endDate = endDate || event.endDate;

    await event.save();
    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error });
  }
});

eventRouter.delete('/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event', error });
  }
});

module.exports = eventRouter;