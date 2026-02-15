const Incident = require('../models/Incident');


exports.getIncidents = async (req, res) => {
  try {
    
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createIncident = async (req, res) => {
  try {
    const { clientSideId, title, description, type, location } = req.body;

   
    if (clientSideId) {
      const existingIncident = await Incident.findOne({ clientSideId });
      if (existingIncident) {
        return res.status(200).json(existingIncident);
      }
    }

    const newIncident = new Incident({
      title,
      description,
      type,
      location,
      clientSideId
    });

    const savedIncident = await newIncident.save();
    res.status(201).json(savedIncident);
  } catch (error) {
    console.error("Error al guardar:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    await Incident.findByIdAndDelete(id);
    res.json({ message: "Incidente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};