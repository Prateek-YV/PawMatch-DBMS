db = db.getSiblingDB("pawmatch_nosql");
db.dropDatabase();
db = db.getSiblingDB("pawmatch_nosql");

db.createCollection("pet_profiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["pet_id", "name", "species", "adoption_status", "energy_level", "traits", "feature_vector"],
      properties: {
        pet_id: { bsonType: "string", pattern: "^P[0-9]{3,}$" },
        name: { bsonType: "string" },
        species: { enum: ["Dog", "Cat", "Rabbit", "Bird", "Other"] },
        breed: { bsonType: "string" },
        age: { bsonType: "number", minimum: 0 },
        size: { enum: ["small", "medium", "large"] },
        adoption_status: { enum: ["available", "pending", "fostered", "adopted"] },
        energy_level: { bsonType: "number", minimum: 1, maximum: 5 },
        traits: { bsonType: "array", items: { bsonType: "string" } },
        good_with: {
          bsonType: "object",
          properties: { kids: { bsonType: "bool" }, dogs: { bsonType: "bool" }, cats: { bsonType: "bool" } }
        },
        needs: {
          bsonType: "object",
          properties: { yard_required: { bsonType: "bool" }, experienced_owner: { bsonType: "bool" } }
        },
        description: { bsonType: "string" },
        feature_vector: { bsonType: "array", minItems: 5, maxItems: 5, items: { bsonType: "number", minimum: 0, maximum: 1 } },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("user_preferences", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "preferred_species", "desired_energy", "preference_vector"],
      properties: {
        user_id: { bsonType: "string", pattern: "^U[0-9]{3,}$" },
        preferred_species: { bsonType: "array", minItems: 1, items: { enum: ["Dog", "Cat", "Rabbit", "Bird", "Other"] } },
        preferred_sizes: { bsonType: "array", items: { enum: ["small", "medium", "large"] } },
        desired_energy: { bsonType: "number", minimum: 1, maximum: 5 },
        has_kids: { bsonType: "bool" },
        has_other_pets: { bsonType: "bool" },
        housing: { enum: ["house", "apartment", "farm", "other"] },
        has_yard: { bsonType: "bool" },
        experience_level: { enum: ["beginner", "intermediate", "experienced"] },
        wanted_traits: { bsonType: "array", items: { bsonType: "string" } },
        preference_vector: { bsonType: "array", minItems: 5, maxItems: 5, items: { bsonType: "number", minimum: 0, maximum: 1 } },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("user_activity", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "action", "ts"],
      properties: {
        user_id: { bsonType: "string" },
        pet_id: { bsonType: "string" },
        action: { enum: ["view", "favorite", "search", "apply"] },
        ts: { bsonType: "date" },
        meta: { bsonType: "object" }
      }
    }
  }
});

db.pet_profiles.createIndex({ pet_id: 1 }, { unique: true, name: "uq_pet_profiles_pet_id" });
db.pet_profiles.createIndex({ species: 1, adoption_status: 1 }, { name: "idx_pet_species_status" });
db.pet_profiles.createIndex({ traits: 1 }, { name: "idx_pet_traits" });
db.pet_profiles.createIndex({ name: "text", description: "text" }, { name: "txt_pet_name_description" });
db.user_preferences.createIndex({ user_id: 1 }, { unique: true, name: "uq_user_preferences_user_id" });
db.user_activity.createIndex({ user_id: 1, ts: -1 }, { name: "idx_activity_user_time" });
db.user_activity.createIndex({ pet_id: 1, action: 1 }, { name: "idx_activity_pet_action" });
db.user_activity.createIndex({ ts: 1 }, { name: "ttl_activity_180_days", expireAfterSeconds: 15552000 });

db.pet_profiles.insertMany([
  { pet_id: "P001", name: "Bruno", species: "Dog", breed: "Labrador Retriever", age: 3, size: "large", adoption_status: "adopted", energy_level: 5, traits: ["friendly", "energetic", "kid-friendly", "playful"], good_with: { kids: true, dogs: true, cats: false }, needs: { yard_required: true, experienced_owner: false }, description: "Friendly, energetic Labrador who is great with kids and loves fetch.", feature_vector: [0.9, 0.95, 0.2, 0.95, 0.2], updated_at: new Date("2026-03-25T10:00:00Z") },
  { pet_id: "P002", name: "Luna", species: "Cat", breed: "Indian Shorthair", age: 2, size: "small", adoption_status: "available", energy_level: 2, traits: ["calm", "affectionate", "quiet", "lap-cat"], good_with: { kids: true, dogs: false, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Calm and affectionate cat who loves lap time and quiet evenings.", feature_vector: [0.3, 0.85, 0.9, 0.7, 0.4], updated_at: new Date("2026-06-02T10:00:00Z") },
  { pet_id: "P003", name: "Max", species: "Dog", breed: "German Shepherd", age: 4, size: "large", adoption_status: "pending", energy_level: 4, traits: ["loyal", "protective", "intelligent"], good_with: { kids: false, dogs: false, cats: false }, needs: { yard_required: true, experienced_owner: true }, description: "Loyal and protective shepherd who needs an experienced owner and firm training.", feature_vector: [0.8, 0.5, 0.4, 0.3, 0.5], updated_at: new Date("2026-10-15T10:00:00Z") },
  { pet_id: "P004", name: "Bella", species: "Dog", breed: "Beagle", age: 1, size: "medium", adoption_status: "available", energy_level: 4, traits: ["playful", "curious", "friendly"], good_with: { kids: true, dogs: true, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Playful, curious beagle puppy who gets along with other dogs.", feature_vector: [0.85, 0.9, 0.3, 0.85, 0.2], updated_at: new Date("2026-08-20T10:00:00Z") },
  { pet_id: "P005", name: "Milo", species: "Cat", breed: "Persian", age: 5, size: "small", adoption_status: "fostered", energy_level: 1, traits: ["quiet", "independent", "low-energy"], good_with: { kids: false, dogs: false, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Quiet, independent Persian who prefers a calm home.", feature_vector: [0.1, 0.4, 0.95, 0.4, 0.9], updated_at: new Date("2026-07-05T10:00:00Z") },
  { pet_id: "P006", name: "Daisy", species: "Dog", breed: "Indie", age: 2, size: "medium", adoption_status: "available", energy_level: 3, traits: ["gentle", "shy", "loyal"], good_with: { kids: true, dogs: true, cats: false }, needs: { yard_required: false, experienced_owner: false }, description: "Gentle dog, shy at first but bonds deeply once she trusts you.", feature_vector: [0.5, 0.6, 0.7, 0.7, 0.3], updated_at: new Date("2026-09-05T10:00:00Z") },
  { pet_id: "P007", name: "Rocky", species: "Dog", breed: "Boxer", age: 3, size: "large", adoption_status: "adopted", energy_level: 5, traits: ["active", "goofy", "playful"], good_with: { kids: true, dogs: true, cats: false }, needs: { yard_required: true, experienced_owner: false }, description: "Active, goofy boxer who loves long walks.", feature_vector: [0.95, 0.9, 0.15, 0.8, 0.2], updated_at: new Date("2026-03-08T10:00:00Z") },
  { pet_id: "P008", name: "Coco", species: "Rabbit", breed: "Holland Lop", age: 1, size: "small", adoption_status: "available", energy_level: 2, traits: ["docile", "gentle", "quiet"], good_with: { kids: true, dogs: false, cats: false }, needs: { yard_required: false, experienced_owner: false }, description: "Docile rabbit who enjoys being held and is very quiet.", feature_vector: [0.25, 0.7, 0.9, 0.8, 0.5], updated_at: new Date("2026-09-18T10:00:00Z") },
  { pet_id: "P009", name: "Simba", species: "Cat", breed: "Maine Coon", age: 3, size: "medium", adoption_status: "pending", energy_level: 3, traits: ["social", "playful", "kid-friendly"], good_with: { kids: true, dogs: true, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Social and playful Maine Coon who is great with children.", feature_vector: [0.6, 0.9, 0.5, 0.9, 0.3], updated_at: new Date("2026-10-28T10:00:00Z") },
  { pet_id: "P010", name: "Rani", species: "Dog", breed: "Indie", age: 6, size: "medium", adoption_status: "fostered", energy_level: 2, traits: ["senior", "calm", "house-trained"], good_with: { kids: true, dogs: true, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Calm senior dog, fully house-trained and easy to live with.", feature_vector: [0.2, 0.7, 0.95, 0.7, 0.5], updated_at: new Date("2026-05-01T10:00:00Z") },
  { pet_id: "P011", name: "Oreo", species: "Dog", breed: "Pug", age: 2, size: "small", adoption_status: "available", energy_level: 2, traits: ["cuddly", "lazy", "apartment-friendly"], good_with: { kids: true, dogs: true, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Cuddly, lazy pug who is perfect for apartment living.", feature_vector: [0.2, 0.9, 0.85, 0.8, 0.3], updated_at: new Date("2026-10-02T10:00:00Z") },
  { pet_id: "P012", name: "Pixie", species: "Cat", breed: "Siamese", age: 1, size: "small", adoption_status: "available", energy_level: 5, traits: ["vocal", "curious", "active"], good_with: { kids: true, dogs: false, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Vocal, curious Siamese who is always on the move.", feature_vector: [0.9, 0.7, 0.2, 0.6, 0.5], updated_at: new Date("2026-10-10T10:00:00Z") },
  { pet_id: "P013", name: "Tyson", species: "Dog", breed: "Rottweiler", age: 5, size: "large", adoption_status: "available", energy_level: 3, traits: ["strong", "calm", "loyal"], good_with: { kids: true, dogs: false, cats: false }, needs: { yard_required: true, experienced_owner: true }, description: "Strong but calm rottweiler who needs space and an experienced owner.", feature_vector: [0.5, 0.6, 0.7, 0.5, 0.5], updated_at: new Date("2026-09-14T10:00:00Z") },
  { pet_id: "P014", name: "Nala", species: "Cat", breed: "Indian Shorthair", age: 4, size: "small", adoption_status: "fostered", energy_level: 1, traits: ["shy", "gentle", "quiet"], good_with: { kids: false, dogs: false, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Shy, gentle cat who prefers quiet homes.", feature_vector: [0.2, 0.4, 0.9, 0.4, 0.7], updated_at: new Date("2026-06-25T10:00:00Z") },
  { pet_id: "P015", name: "Charlie", species: "Dog", breed: "Golden Retriever", age: 2, size: "large", adoption_status: "available", energy_level: 4, traits: ["friendly", "trainable", "water-lover"], good_with: { kids: true, dogs: true, cats: true }, needs: { yard_required: false, experienced_owner: false }, description: "Friendly, trainable golden retriever who loves water.", feature_vector: [0.8, 0.95, 0.4, 0.95, 0.2], updated_at: new Date("2026-10-20T10:00:00Z") }
]);

db.user_preferences.insertMany([
  { user_id: "U005", preferred_species: ["Dog"], preferred_sizes: ["medium", "large"], desired_energy: 4, has_kids: true, has_other_pets: false, housing: "house", has_yard: true, experience_level: "intermediate", wanted_traits: ["friendly", "playful", "kid-friendly"], preference_vector: [0.8, 0.9, 0.3, 0.9, 0.2], updated_at: new Date("2026-10-30T09:00:00Z") },
  { user_id: "U006", preferred_species: ["Dog", "Cat", "Rabbit"], preferred_sizes: ["small", "medium"], desired_energy: 2, has_kids: false, has_other_pets: false, housing: "apartment", has_yard: false, experience_level: "beginner", wanted_traits: ["calm", "gentle", "quiet"], preference_vector: [0.25, 0.7, 0.9, 0.5, 0.4], updated_at: new Date("2026-10-31T08:00:00Z") },
  { user_id: "U007", preferred_species: ["Dog"], preferred_sizes: ["large"], desired_energy: 4, has_kids: false, has_other_pets: false, housing: "house", has_yard: true, experience_level: "experienced", wanted_traits: ["loyal", "protective", "intelligent"], preference_vector: [0.8, 0.5, 0.4, 0.4, 0.5], updated_at: new Date("2026-11-01T13:00:00Z") },
  { user_id: "U008", preferred_species: ["Cat", "Dog"], preferred_sizes: ["small", "medium"], desired_energy: 3, has_kids: false, has_other_pets: true, housing: "apartment", has_yard: false, experience_level: "beginner", wanted_traits: ["playful", "curious", "social"], preference_vector: [0.6, 0.85, 0.4, 0.6, 0.4], updated_at: new Date("2026-11-02T10:00:00Z") },
  { user_id: "U009", preferred_species: ["Dog"], preferred_sizes: ["medium", "large"], desired_energy: 5, has_kids: true, has_other_pets: false, housing: "farm", has_yard: true, experience_level: "intermediate", wanted_traits: ["energetic", "friendly", "trainable"], preference_vector: [0.9, 0.9, 0.2, 0.9, 0.2], updated_at: new Date("2026-11-03T15:00:00Z") }
]);

db.user_activity.insertMany([
  { user_id: "U005", pet_id: "P004", action: "view", ts: new Date("2026-10-29T18:00:00Z"), meta: { device: "mobile", seconds_on_page: 42 } },
  { user_id: "U005", pet_id: "P015", action: "favorite", ts: new Date("2026-10-29T18:05:00Z"), meta: { device: "mobile" } },
  { user_id: "U005", action: "search", ts: new Date("2026-10-29T17:50:00Z"), meta: { query: "friendly dog for kids", results: 4 } },
  { user_id: "U006", pet_id: "P002", action: "view", ts: new Date("2026-10-30T20:10:00Z"), meta: { device: "desktop", seconds_on_page: 95 } },
  { user_id: "U006", pet_id: "P002", action: "favorite", ts: new Date("2026-10-30T20:12:00Z"), meta: { device: "desktop" } },
  { user_id: "U006", pet_id: "P008", action: "favorite", ts: new Date("2026-10-30T20:20:00Z"), meta: { device: "desktop" } },
  { user_id: "U006", action: "search", ts: new Date("2026-10-30T20:00:00Z"), meta: { query: "calm quiet pet for apartment", results: 6 } },
  { user_id: "U007", pet_id: "P003", action: "view", ts: new Date("2026-10-14T11:00:00Z"), meta: { device: "desktop", seconds_on_page: 120 } },
  { user_id: "U007", pet_id: "P003", action: "apply", ts: new Date("2026-10-15T09:30:00Z"), meta: { application_id: "A004" } },
  { user_id: "U008", pet_id: "P012", action: "view", ts: new Date("2026-11-01T19:00:00Z"), meta: { device: "mobile", seconds_on_page: 60 } },
  { user_id: "U008", pet_id: "P012", action: "favorite", ts: new Date("2026-11-01T19:03:00Z"), meta: { device: "mobile" } },
  { user_id: "U008", pet_id: "P011", action: "favorite", ts: new Date("2026-11-01T19:10:00Z"), meta: { device: "mobile" } },
  { user_id: "U008", pet_id: "P009", action: "apply", ts: new Date("2026-10-28T16:00:00Z"), meta: { application_id: "A005" } },
  { user_id: "U009", pet_id: "P015", action: "view", ts: new Date("2026-11-02T12:00:00Z"), meta: { device: "desktop", seconds_on_page: 80 } },
  { user_id: "U009", pet_id: "P015", action: "favorite", ts: new Date("2026-11-02T12:04:00Z"), meta: { device: "desktop" } },
  { user_id: "U009", pet_id: "P004", action: "view", ts: new Date("2026-11-02T12:15:00Z"), meta: { device: "desktop", seconds_on_page: 25 } },
  { user_id: "U005", pet_id: "P011", action: "favorite", ts: new Date("2026-11-03T08:00:00Z"), meta: { device: "mobile" } }
]);

print("pet_profiles: " + db.pet_profiles.countDocuments());
print("user_preferences: " + db.user_preferences.countDocuments());
print("user_activity: " + db.user_activity.countDocuments());
