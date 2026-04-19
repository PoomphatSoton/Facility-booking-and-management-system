import { Link, useNavigate } from "react-router";
import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { authService } from "~/services/auth.service";
import { APP_BRAND_NAME } from "~/constants/app.constants";

export default function AppNavbar() {
  const navigate = useNavigate();

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
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}