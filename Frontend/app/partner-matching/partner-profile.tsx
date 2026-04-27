import { useMemo } from "react";
import { Link, useParams } from "react-router";
import "./partner-matching.css";

type PartnerProfileItem = {
  id: number;
  name: string;
  sport: string;
  skillLevel: string;
  availability: string;
  preferredTime: string;
  bio: string;
};

const mockPartners: PartnerProfileItem[] = [
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

export default function PartnerProfile() {
  const params = useParams();
  const partnerId = Number(params.partnerId);

  const partner = useMemo(
    () => mockPartners.find((item) => item.id === partnerId),
    [partnerId]
  );

  if (!partner) {
    return (
      <main className="partner-matching-page">
        <div className="partner-matching-page-header">
          <h1>Partner Profile</h1>
          <p>Partner not found.</p>
        </div>

        <section className="partner-request-section">
          <Link to="/find-partners" className="partner-secondary-btn">
            Back to Find Partners
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="partner-matching-page">
      <div className="partner-matching-page-header">
        <h1>{partner.name}</h1>
        <p>View detailed partner information before sending a match request</p>
      </div>

      <section className="partner-request-section">
        <h2>Profile Details</h2>

        <div className="partner-request-card">
          <p>
            <strong>Name:</strong> {partner.name}
          </p>
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
          <p>
            <strong>Bio:</strong> {partner.bio}
          </p>

          <div className="partner-card-tags">
            <span className="partner-card-tag">{partner.sport}</span>
            <span className="partner-card-tag">{partner.skillLevel}</span>
            <span className="partner-card-tag">{partner.availability}</span>
            <span className="partner-card-tag">{partner.preferredTime}</span>
          </div>

          <div className="partner-card-actions" style={{ marginTop: "1rem" }}>
            <button
              className="partner-primary-btn"
              onClick={() => alert(`Mock match request sent to ${partner.name}`)}
            >
              Send Match Request
            </button>

            <Link to="/find-partners" className="partner-secondary-btn">
              Back
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}