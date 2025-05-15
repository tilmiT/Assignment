import React from 'react';
import { Navbar as BootstrapNavbar, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Document Retrieval System
        </BootstrapNavbar.Brand>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;