import { useState } from "react";
import type { EquipmentReportItem } from "../services/equipment-report.service";
import "./equipment-report.css";

const mockReports: EquipmentReportItem[] = [
  {
    report_id: 1,
    description: "Badminton racket grip is damaged.",
    status: "noted",
    created_at: new Date().toISOString(),
    facility_id: 1,
    facility_name: "Badminton Court",
  },
  {
    report_id: 2,
    description: "Basketball hoop net is broken.",
    status: "inProgress",
    created_at: new Date().toISOString(),
    facility_id: 2,
    facility_name: "Basketball Court",
  },
  {
    report_id: 3,
    description: "Treadmill display is not working.",
    status: "resolved",
    created_at: new Date().toISOString(),
    facility_id: 3,
    facility_name: "Gym Room",
  },
];

export default function EquipmentReportList() {
  const [reports, setReports] = useState<EquipmentReportItem[]>(mockReports);
  const [facilityId, setFacilityId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityId || !description.trim()) {
      alert("Please enter facility ID and description");
      return;
    }

    const newReport: EquipmentReportItem = {
      report_id: Date.now(),
      description: description.trim(),
      status: "noted",
      created_at: new Date().toISOString(),
      facility_id: Number(facilityId),
      facility_name: `Facility #${facilityId}`,
    };

    setReports((prev) => [newReport, ...prev]);
    setFacilityId("");
    setDescription("");
    alert("Mock report submitted successfully");
  };

  return (
    <main className="equipment-report-page">
      <div className="equipment-report-page-header">
        <h1>Equipment Reports</h1>
        <p>Submit an equipment issue report and track your report status</p>
      </div>

      <section className="equipment-report-section">
        <h2>Submit New Report</h2>

        <form className="equipment-report-form" onSubmit={handleSubmit}>
          <div className="equipment-report-field">
            <label htmlFor="equipment-facility-id">Facility ID</label>
            <input
              id="equipment-facility-id"
              className="equipment-report-input"
              type="number"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              placeholder="Enter facility ID"
            />
          </div>

          <div className="equipment-report-field">
            <label htmlFor="equipment-description">Problem Description</label>
            <textarea
              id="equipment-description"
              className="equipment-report-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the equipment issue"
            />
          </div>

          <button className="equipment-report-submit" type="submit">
            Submit Report
          </button>
        </form>
      </section>

      <section className="equipment-report-section">
        <h2>My Reports</h2>

        {reports.length === 0 ? (
          <p className="equipment-report-empty">No equipment reports yet.</p>
        ) : (
          <div className="equipment-report-list">
            {reports.map((report) => (
              <div key={report.report_id} className="equipment-report-card">
                <p>
                  <strong>Facility:</strong>{" "}
                  {report.facility_name || `Facility #${report.facility_id}`}
                </p>
                <p>
                  <strong>Description:</strong> {report.description}
                </p>
                <p>
                  <strong>Status:</strong> {report.status}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}