import { getSession } from '../config/db.js';

export const createLocation = async (req, res) => {
  const { name, type, latitude, longitude } = req.body;
  const session = getSession();
  try {
    await session.run(
      'CREATE (l:Location {name: $name, type: $type, latitude: $lat, longitude: $lng})',
      { name, type, lat: latitude, lng: longitude }
    );
    res.status(201).json({ message: "Lieu créé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};

export const searchLocation = async (req, res) => {
  const { name } = req.query;
  const session = getSession();
  try {
    // Utilisation de CONTAINS pour une recherche partielle insensible à la casse
    const result = await session.run(`
      MATCH (l:Location)
      WHERE toLower(l.name) CONTAINS toLower($name)
      OPTIONAL MATCH (l)-[r:CONNECTED_TO]->(target:Location)
      RETURN l, collect({to: target.name, distance: r.distance, duration: r.duration}) as connections
      LIMIT 1
    `, { name });
    
    if (result.records.length === 0) {
      return res.status(404).json({ message: "Lieu introuvable" });
    }
    const node = result.records[0].get('l').properties;
    const rawConnections = result.records[0].get('connections');
    const connections = rawConnections ? rawConnections.filter(c => c.to !== null) : [];
    
    res.json({ ...node, connections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};

export const createConnection = async (req, res) => {
  const { startLocation, endLocation, distance, duration } = req.body;
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (a:Location {name: $start}), (b:Location {name: $end})
      CREATE (a)-[:CONNECTED_TO {distance: $dist, duration: $dur}]->(b)
      RETURN a, b
    `, { start: startLocation, end: endLocation, dist: distance, dur: duration });

    if (result.records.length === 0) {
      return res.status(404).json({ error: "L'un des lieux est introuvable." });
    }
    res.status(201).json({ message: "Connexion créée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};

export const getAllLocations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (l:Location) RETURN l');
    const locations = result.records.map(record => record.get('l').properties);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};