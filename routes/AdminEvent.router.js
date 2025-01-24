const { Router } = require('express');
const AdminEvent = require('../models/AdminEvent.model');

const adminEventRouter =Router();

adminEventRouter.post('/', async (req, res) => {
  const { title, description, startDate, endDate, degreeId } = req.body;

  if (!degreeId) {
    return res.status(400).json({ message: 'Degree ID is required' });
  }

  try {
    const newAdminEvent = new AdminEvent({ title, description, startDate, endDate, degreeId });
    await newAdminEvent.save();
    res.status(201).json({ message: 'Admin event created successfully', event: newAdminEvent });
  } catch (error) {
    console.error('Error creating admin event:', error);
    res.status(500).json({ message: 'Error creating admin event', error });
  }
});

  adminEventRouter.get('/', async (req, res) => {
    try {
      const adminEvents = await AdminEvent.find();
      res.status(200).json({ events: adminEvents });
    } catch (error) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ message: 'Error fetching admin events', error });
    }
  });
  
  adminEventRouter.get('/:degreeId', async (req, res) => {
    const { degreeId } = req.params;
  
    try {
      const events = await AdminEvent.find({ degreeId });
      if (!events.length ) {
        return res.status(404).json({ message: 'No events found for the given degree ID' });
      }
      res.status(200).json({ events });
    } catch (error) {
      console.error('Error fetching events by degree ID:', error);
      res.status(500).json({ message: 'Error fetching events', error });
    }
  });
  adminEventRouter.get('/:degreeId', async (req, res) => {
    const { degreeId } = req.params;
    try {
      const events = await AdminEvent.find({ degreeId });

      if (!events || events.length === 0) {
        return res.status(404).json({ message: 'No events found for the given degree ID' });
      }
      res.status(200).json({ events });
    } catch (error) {
      console.error('Error fetching events by degree ID:', error);
      res.status(500).json({ message: 'Error fetching events', error });
    }
  });

  adminEventRouter.put('/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { title, description, startDate, endDate, degreeId } = req.body;
  
    try {
      const adminEvent = await AdminEvent.findById(eventId);
      if (!adminEvent) {
        return res.status(404).json({ message: 'Admin event not found' });
      }
  
      adminEvent.title = title || adminEvent.title;
      adminEvent.description = description || adminEvent.description;
      adminEvent.startDate = startDate || adminEvent.startDate;
      adminEvent.endDate = endDate || adminEvent.endDate;
      adminEvent.degreeId = degreeId || adminEvent.degreeId;
  
      await adminEvent.save();
      res.status(200).json({ message: 'Admin event updated successfully', event: adminEvent });
    } catch (error) {
      console.error('Error updating admin event:', error);
      res.status(500).json({ message: 'Error updating admin event', error });
    }
  });
  
  adminEventRouter.delete('/:eventId', async (req, res) => {
    const { eventId } = req.params;
  
    try {
      const adminEvent = await AdminEvent.findByIdAndDelete(eventId);
      if (!adminEvent) {
        return res.status(404).json({ message: 'Admin event not found' });
      }
  
      res.status(200).json({ message: 'Admin event deleted successfully' });
    } catch (error) {
      console.error('Error deleting admin event:', error);
      res.status(500).json({ message: 'Error deleting admin event', error });
    }
  });
  
  module.exports = adminEventRouter;

