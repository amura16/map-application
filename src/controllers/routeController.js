import { getSession } from '../config/db.js';

export const calculateRoute = async (req, res) => {

  const {
    startLocation,
    endLocation,
    criteria = 'distance'
  } = req.body;

  const session = getSession();

  try {

    const weightProperty =
      criteria === 'time'
        ? 'duration'
        : 'distance';

    const result = await session.run(
      `
      MATCH (start:Location {name: $start})
      MATCH (end:Location {name: $end})

      CALL apoc.algo.dijkstra(
        start,
        end,
        'CONNECTED_TO>',
        $weightProperty,
        1.0
      )
      YIELD path, weight

      RETURN
        start.name AS start,
        end.name AS end,
        weight AS totalCost,
        [node IN nodes(path) | node.name] AS itinerary,
        [
          r IN relationships(path) |
          {
            from: startNode(r).name,
            to: endNode(r).name,
            distance: r.distance,
            duration: r.duration
          }
        ] AS nodes
      `,
      {
        start: startLocation,
        end: endLocation,
        weightProperty
      }
    );

    if (result.records.length === 0) {

      return res.status(404).json({
        message: "Aucun itinéraire trouvé",
        nodes: [],
        itinerary: []
      });

    }

    const record = result.records[0];

    const nodes =
      record.get('nodes') || [];

    const itinerary =
      record.get('itinerary') || [];

    const totalCost =
      record.get('totalCost');

    res.json({
      start: record.get('start'),
      end: record.get('end'),
      criteria,
      totalCost,
      itinerary,
      nodes
    });

  } catch (err) {

    console.error(
      "Erreur calcul itinéraire :",
      err
    );

    res.status(500).json({
      error: err.message,
      nodes: [],
      itinerary: []
    });

  } finally {

    await session.close();

  }
};