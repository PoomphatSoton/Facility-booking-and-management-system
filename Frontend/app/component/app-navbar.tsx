import { Link, useNavigate } from "react-router";
import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { authService } from "~/services/auth.service";
import { APP_BRAND_NAME } from "~/constants/app.constants";
import { useAuth } from "~/auth/auth-middleware";

export default function AppNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isMember = user?.role === "member";
  
  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/auth/login");
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="border-bottom" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          {APP_BRAND_NAME}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="global-navbar" />
        <Navbar.Collapse id="global-navbar">
          <Nav className="ms-auto align-items-lg-center gap-2">
            { isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin">
                  Facilities
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/staff">
                  Staff
                </Nav.Link>
              </>
            )}

            { isMember && (
              <>
                <Nav.Link as={Link} to="/">
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/booking/my">
                  My Bookings
                </Nav.Link>
                <Nav.Link as={Link} to="/booking/notifications">
                  Notifications
                </Nav.Link>
                <Nav.Link as={Link} to="/staff/pending">
                  Staff Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/staff/upcoming">
                  Manage Sessions
                </Nav.Link>
              </>
            )}

            { isStaff && (
              <>
              </>
            )}

            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}