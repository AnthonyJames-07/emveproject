import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import EmmveeLogo from '../pictures/emvlogo.png';

const HomePage = () => {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
        <Container fluid>
          <Navbar.Brand as={Link} to="/home">
            <img
              src={EmmveeLogo}
              alt="Emmvee Logo"
              style={{ width: '120px', marginRight: '10px' }} // Inline styles for logo
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto w-100 justify-content-around">
              
              <Dropdown>
                <Dropdown.Toggle variant="dark" id="dropdown-basic">
                  Master
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/stage-master">Stage Master</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/skill-master">Skill Master</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Nav.Link as={Link} to="/user-skills">User Skills</Nav.Link>
              
              <Dropdown>
                <Dropdown.Toggle variant="dark" id="dropdown-basic">
                  UserShiftRoster
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/user-shift-upload">User Shift Upload</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/user-shift-report">User Shift Skill Report</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Nav.Link as={Link} to="/attendance">Attendance</Nav.Link>
              
              <Nav.Link as={Link} to="/login">Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <style>{`
        .navbar-custom {
          padding: 10px 0;
        }
        .navbar-custom .navbar-brand img {
          max-width: 100%;
          height: auto;
        }
        .navbar-custom .dropdown-toggle::after {
          margin-left: 0.5rem;
        }
        .navbar-custom .dropdown-menu {
          background-color: #444; /* Darker background for dropdown */
          color: #fff;
        }
        .navbar-custom .dropdown-item {
          color: #fff;
        }
        .navbar-custom .dropdown-item:hover {
          background-color: #555; /* Hover color */
        }
        .navbar-custom .nav-link {
          color: #fff !important; /* Ensure text color */
          padding: 0.5rem 1rem;
        }
        .navbar-custom .nav-link:hover {
          background-color: #555 !important; /* Hover color */
        }
      `}</style>
    </div>
  );
};

export default HomePage;
