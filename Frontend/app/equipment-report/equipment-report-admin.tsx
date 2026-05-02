import { useState } from "react";
import { useAuth } from "~/auth/auth-middleware";
import type {
  EquipmentReportItem,
  EquipmentReportStatus,
} from "../services/equipment-report.service";
import "./equipment-report.css";

const initialReports: EquipmentReportItem[] = [
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

export default function EquipmentReportAdmin() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<EquipmentReportItem[]>(initialReports);

  const isStaff = user?.role === "staff" || user?.role === "admin";

  const handleStatusChange = (
    reportId: number,
    nextStatus: EquipmentReportStatus
  ) => {
    setReports((prev) =>
      prev.map((report) =>
        report.report_id === reportId
          ? { ...report, status: nextStatus }
          : report
      )
    );
  };

  if (loading) {
    return <main className="equipment-report-page">Loading...</main>;
  }

  if (!isStaff) {
    return (
      <main className="equipment-report-page">
        <div className="equipment-report-page-header">
          <h1>Access Denied</h1>
          <p>Only staff can access this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="equipment-report-page">
      <div className="equipment-report-page-header">
        <h1>Equipment Report Management</h1>
        <p>Review submitted equipment issues and update repair status</p>
      </div>

      <section className="equipment-report-section">
        <h2>All Reports</h2>

        <div className="equipment-report-list">
          {reports.map((report) => (
            <div key={report.report_id} className="equipment-report-card">
              <p>
                <strong>Report ID:</strong> {report.report_id}
              </p>
              <p>
                <strong>Facility:</strong>{" "}
                {report.facility_name || `Facility #${report.facility_id}`}
              </p>
              <p>
                <strong>Description:</strong> {report.description}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(report.created_at).toLocaleString()}
              </p>

              <div className="equipment-report-status-row">
                <strong>Status:</strong>
                <select
                  className="equipment-report-select"
                  value={report.status}
                  onChange={(e) =>
                    handleStatusChange(
                      report.report_id,
                      e.target.value as EquipmentReportStatus
                    )
                  }
                >
                  <option value="noted">noted</option>
                  <option value="inProgress">inProgress</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}