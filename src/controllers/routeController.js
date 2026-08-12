import { getSession } from '../config/db.js';

export const calculateRoute = async (req, res) => {
  const { startLocation, endLocation, criteria } = req.body;
  const session = getSession();
  const prop = criteria === 'time' ? 'duration' : 'distance';

  



  try {
    const query = `
      MATCH (start:Location {name: $start}), (end:Location {name: $end})
      MATCH p = shortestPath((start)-[:CONNECTED_TO*]-(end))
      RETURN p, 
             reduce(s = 0, r in relationships(p) | s + r.${prop}) as totalCost
    `;

    console.log("[DEBUG] startLOcation ",startLocation);
  console.log("[DEBUG] startLendLocationOcation ",endLocation);
//   console.log("[DEBUG] session ,",session);

    const result = await session.run(query, { start: startLocation, end: endLocation });
    console.log(" result ********** ",result);
    
    // if (result.records.length === 0) {
    //   return res.status(404).json({ message: "Pas de chemin trouvé" });
    // }
    const path = result.records[0].get('p');
    const nodes = path.segments.map(s => ({
        from: s.start.properties.name,
        to: s.end.properties.name,
        distance: s.relationship.properties.distance,
        duration: s.relationship.properties.duration
    }));

    res.json({ totalCost: result.records[0].get('totalCost'), criteria, nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};