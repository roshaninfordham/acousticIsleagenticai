
'use server';

import { Document, VectorStoreIndex, StorageContext, serviceContextFromDefaults } from 'llamaindex';

/**
 * @fileOverview LlamaIndex service for semantic retrieval of Nicobarese musical heritage.
 * This simulates a retrieval layer for culturally accurate audio stems.
 */

const AUDIO_STEM_CATALOG = [
  {
    id: "ambient_vocal_chant_01",
    name: "Nicobarese Morning Chant",
    description: "A low-energy, atmospheric vocal chant used during sunrise ceremonies. Ambient and calming.",
    energyLevel: "Calm",
    communityId: "community_nicobar_01",
    type: "Vocal"
  },
  {
    id: "bamboo_percussion_fast_01",
    name: "High-Tempo Bamboo Loop",
    description: "Intense, rhythmic bamboo percussion. High energy, suitable for communal dancing.",
    energyLevel: "Energetic",
    communityId: "community_nicobar_02",
    type: "Percussion"
  },
  {
    id: "flute_melody_mid_01",
    name: "Coastal Flute Melody",
    description: "A mid-tempo melody mimicking the ocean waves. Balanced energy, melodic and swaying.",
    energyLevel: "Rhythmic",
    communityId: "community_nicobar_01",
    type: "Melodic"
  }
];

export async function retrieveBestStem(queryText: string) {
  // 1. Create Documents from our catalog
  const documents = AUDIO_STEM_CATALOG.map(stem => new Document({
    text: `${stem.name}: ${stem.description}. Energy: ${stem.energyLevel}. Type: ${stem.type}`,
    id_: stem.id,
    metadata: { ...stem }
  }));

  // 2. Index the documents (In-memory for MVP hackathon)
  const index = await VectorStoreIndex.fromDocuments(documents);

  // 3. Query the index
  const queryEngine = index.asQueryEngine();
  const response = await queryEngine.query({ query: `Find the most appropriate audio stem for this musical state: ${queryText}` });

  // 4. Extract the best match (simplified for MVP)
  const bestMatch = AUDIO_STEM_CATALOG.find(s => response.toString().includes(s.name)) || AUDIO_STEM_CATALOG[0];
  
  return bestMatch;
}
