import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Badge, Table } from "react-bootstrap";
import "./staff-mangament.css";

type StaffStatus = "active" | "suspended";

type StaffMember = {
    id: number;
    username: string;
    name: string;
    facility: string;
    status: StaffStatus;
};

const MOCK_STAFF: StaffMember[] = [
    { id: 1, username: "john.doe", name: "John Doe", facility: "Badminton Court", status: "active" },
    { id: 2, username: "jane.smith", name: "Jane Smith", facility: "Swimming Pool", status: "active" },
    { id: 3, username: "mike.jones", name: "Mike Jones", facility: "Football Pitch", status: "suspended" },
    { id: 4, username: "sara.lee", name: "Sara Lee", facility: "Tennis Court", status: "active" },
];

export default function StaffManagement() {
    const navigate = useNavigate();
    const [staffList] = useState<StaffMember[]>(MOCK_STAFF);

    const onDelete = (id: number) => {
        // TODO: call delete API
        console.log("Delete staff:", id);
    };

    const ToggleStatus = (id: number, currentStatus: StaffStatus) => {
        // TODO: call update status API
        console.log("Toggle status:", id, currentStatus);
    };

    const fetchStaffList = () => {

    };
    
    useEffect(() => { void fetchStaffList(); }, []);

    return (
        <main className="staff-page">
            <div className="staff-page-header">
                <div>
                    <h1>Staff Management</h1>
                    <p>Manage staff accounts and their facility assignments.</p>
                </div>
                <Button variant="primary" onClick={() => navigate("/admin/staff/create")}>
                    Create New Staff
                </Button>
            </div>

            <div className="staff-table-wrapper">
                <Table className="staff-table" hover responsive>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Staff Name</th>
                            <th>Facility</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="staff-empty-row">
                                    No staff members found.
                                </td>
                            </tr>
                        ) : (
                            staffList.map((staff, index) => (
                                <tr key={staff.id}>
                                    <td className="staff-cell-index">{index + 1}</td>
                                    <td className="staff-cell-username">{staff.username}</td>
                                    <td>{staff.name}</td>
                                    <td>{staff.facility}</td>
                                    <td>
                                        <Badge
                                            bg={staff.status === "active" ? "success" : "secondary"}
                                            className="staff-status-badge"
                                        >
                                            {staff.status === "active" ? "Active" : "Suspended"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="staff-action-buttons">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => navigate(`/admin/staff/edit/${staff.id}`, { state: staff })}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant={staff.status === "active" ? "outline-warning" : "outline-success"}
                                                size="sm"
                                                onClick={() => ToggleStatus(staff.id, staff.status)}
                                            >
                                                {staff.status === "active" ? "Suspend" : "Activate"}
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => onDelete(staff.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </main>
    );
}
