/**
 * Seed Script — Creates 18 teams (3 semesters × 6 groups)
 * Run: npx tsx scripts/seed-teams.ts
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set. Run with: MONGODB_URI=<uri> npx tsx scripts/seed-teams.ts");
    process.exit(1);
}

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    group: { type: String, required: true },
    semester: { type: Number, required: true },
    totalPoints: { type: Number, default: 0 },
    eventPoints: { type: [mongoose.Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now },
});

teamSchema.index({ group: 1, semester: 1 }, { unique: true });

const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

const groups = [
    {
        group: "Commerce",
        depts: "Commerce (unified)",
    },
    {
        group: "Professional",
        depts: "Computer Applications, Social Work PG, Social Work UG",
    },
    {
        group: "Life Science",
        depts: "BioChem, BioTechnology, Botany, Environmental Science, Zoology",
    },
    {
        group: "Physical Science",
        depts: "Chemistry, Computer Science, Electronics, Physics, Mathematics",
    },
    {
        group: "Social Science",
        depts: "Economics, Political Science, Psychology, Sociology",
    },
    {
        group: "Humanities",
        depts: "Education, English, Khasi, History, Geography",
    },
];

const semesters = [2, 4, 6];

async function seed() {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    const teams = [];
    for (const semester of semesters) {
        for (const g of groups) {
            const suffix = semester === 2 ? "2nd" : semester === 4 ? "4th" : "6th";
            teams.push({
                name: `${g.group} (${suffix} Sem)`,
                group: g.group,
                semester,
                totalPoints: 0,
                eventPoints: [],
            });
        }
    }

    console.log(`📝 Seeding ${teams.length} teams...`);

    for (const team of teams) {
        await Team.findOneAndUpdate(
            { group: team.group, semester: team.semester },
            { $setOnInsert: team },
            { upsert: true, new: true }
        );
    }

    console.log("✅ 18 teams seeded successfully:");
    const allTeams = await Team.find().sort({ semester: 1, group: 1 });
    for (const t of allTeams) {
        console.log(`   ${t.semester}th Sem — ${t.group}: ${t.name}`);
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected. Done!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
