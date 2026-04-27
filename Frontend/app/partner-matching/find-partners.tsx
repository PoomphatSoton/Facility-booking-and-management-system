import { useMemo, useState } from "react";
import "./partner-matching.css";

type PartnerItem = {
  id: number;
  name: string;
  sport: string;
  skillLevel: string;
  availability: string;
  preferredTime: string;
  bio: string;
};

const mockPartners: PartnerItem[] = [
  {
    id: 1,
    name: "Alex Chen",
    sport: "Badminton",
    skillLevel: "Intermediate",
    availability: "Weekdays",
    preferredTime: "Evenings",
    bio: "Looking for casual badminton games after class.",
  },
  {
    id: 2,
    name: "Sarah Khan",
    sport: "Football",
    skillLevel: "Beginner",
    availability: "Weekends",
    preferredTime: "Afternoons",
    bio: "Interested in friendly football matches on weekends.",
  },
  {
    id: 3,
    name: "James Lee",
    sport: "Squash",
    skillLevel: "Advanced",
    availability: "Weekdays",
    preferredTime: "Mornings",
    bio: "Competitive squash player seeking regular practice partners.",
  },
  {
    id: 4,
    name: "Emily Wong",
    sport: "Tennis",
    skillLevel: "Intermediate",
    availability: "Weekends",
    preferredTime: "Evenings",
    bio: "Enjoys evening tennis sessions and beginner-friendly games.",
  },
];

export default function FindPartners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState("All");

  const sports = useMemo(
    () => ["All", ...new Set(mockPartners.map((partner) => partner.sport))],
    []
  );

  const skillLevels = useMemo(
    () => ["All", ...new Set(mockPartners.map((partner) => partner.skillLevel))],
    []
  );

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mockPartners.filter((partner) => {
      const matchesSport =
        selectedSport === "All" || partner.sport === selectedSport;
      const matchesSkill =
        selectedSkill === "All" || partner.skillLevel === selectedSkill;
      const matchesSearch =
        !query ||
        partner.name.toLowerCase().includes(query) ||
        partner.sport.toLowerCase().includes(query) ||
        partner.bio.toLowerCase().includes(query);

      return matchesSport && matchesSkill && matchesSearch;
    });
  }, [searchQuery, selectedSport, selectedSkill]);

  return (
    <main className="partner-matching-page">
      <div className="partner-matching-page-header">
        <h1>Find Partners</h1>
        <p>Browse and connect with members looking for sports partners</p>
      </div>

      <div className="partner-matching-toolbar">
        <div className="partner-matching-filter-row">
          <input
            className="partner-matching-search"
            placeholder="Search partners"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="partner-matching-select"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>

          <select
            className="partner-matching-select"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
          >
            {skillLevels.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="partner-matching-list">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="partner-card">
            <h3>{partner.name}</h3>
            <p>{partner.bio}</p>

            <div className="partner-card-tags">
              <span className="partner-card-tag">{partner.sport}</span>
              <span className="partner-card-tag">{partner.skillLevel}</span>
              <span className="partner-card-tag">{partner.availability}</span>
              <span className="partner-card-tag">{partner.preferredTime}</span>
            </div>

            <p>
              <strong>Sport:</strong> {partner.sport}
            </p>
            <p>
              <strong>Skill Level:</strong> {partner.skillLevel}
            </p>
            <p>
              <strong>Availability:</strong> {partner.availability}
            </p>
            <p>
              <strong>Preferred Time:</strong> {partner.preferredTime}
            </p>

            <div className="partner-card-actions">
              <button
                className="partner-primary-btn"
                onClick={() =>
                  alert(`Mock match request sent to ${partner.name}`)
                }
              >
                Send Match Request
              </button>
              <button
                className="partner-secondary-btn"
                onClick={() => alert(`Viewing ${partner.name}'s profile`)}
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 ? (
        <p className="partner-empty-state">
          No partners matched your search or filters.
        </p>
      ) : null}
    </main>
  );
}