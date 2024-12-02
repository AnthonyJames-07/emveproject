
import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Menu, MenuItem, Button, Container, Box, Drawer, List, ListItem,
  ListItemText, Collapse, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { Link, useLocation } from 'react-router-dom';
import EmmveeLogo from '../pictures/emvlogo.png';
import styled from '@emotion/styled';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../styles/HomePage.css';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const theme = createTheme({
  typography: {
    fontSize: 16,
  },
});

const StyledMenuButton = styled(Button)(({ theme }) => ({
  color: '#fff',
  fontWeight: 'bold',
  padding: '10px 20px',
}));

const HomePage = () => {
  const [anchorElMaster, setAnchorElMaster] = useState(null);
  const [anchorElShift, setAnchorElShift] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track animation state
  const isMobile = useMediaQuery('(max-width:600px)'); // Media query for mobile screens
  const [openMaster, setOpenMaster] = useState(false);
  const [openShift, setOpenShift] = useState(false);

  const location = useLocation();

  const handleOpenMasterMenu = (event) => {
    setAnchorElMaster(event.currentTarget);
  };

  const handleOpenShiftMenu = (event) => {
    setAnchorElShift(event.currentTarget);
  };

  const handleCloseMasterMenu = () => {
    setAnchorElMaster(null);
  };

  const handleCloseShiftMenu = () => {
    setAnchorElShift(null);
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
    setIsMenuOpen(!isMenuOpen); // Toggle the menu icon state for animation
  };

  // Toggle the "Master" section
  const handleToggleMaster = () => {
    setOpenMaster(!openMaster);
  };

  // Toggle the "User Shift Roster" section
  const handleToggleShift = () => {
    setOpenShift(!openShift);
  };
  return (
    <>
      <ThemeProvider theme={theme}>
        <AppBar
          position="static"
          class="app-bar">

          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              sx={{
                justifyContent: 'space-between',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton edge="start" color="inherit" aria-label="logo" component={Link} to="/home">
                  <img src={EmmveeLogo} alt="Logo" class="logo" />
                </IconButton>
                <StyledMenuButton component={Link} to="/home" startIcon={<HomeIcon />}>
                  Home
                </StyledMenuButton>
              </Box>

              {!isMobile ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StyledMenuButton
                    onClick={handleOpenMasterMenu}
                    aria-controls="master-menu"
                    aria-haspopup="true"
                    endIcon={<ExpandMoreIcon />}
                  >
                    Master
                  </StyledMenuButton>
                  <Menu
                    id="master-menu"
                    anchorEl={anchorElMaster}
                    open={Boolean(anchorElMaster)}
                    onClose={handleCloseMasterMenu} >

                    <MenuItem component={Link} to="/stage-master">Stage Master</MenuItem>
                    <MenuItem component={Link} to="/skill-master">Skill Master</MenuItem>
                  </Menu>
                  <StyledMenuButton component={Link} to="/user-skills">User Skills</StyledMenuButton>
                  <StyledMenuButton
                    onClick={handleOpenShiftMenu}
                    aria-controls="shift-menu"
                    aria-haspopup="true"
                    endIcon={<ExpandMoreIcon />}
                  >
                    User Shift Roster
                  </StyledMenuButton>
                  <Menu
                    id="shift-menu"
                    anchorEl={anchorElShift}
                    open={Boolean(anchorElShift)}
                    onClose={handleCloseShiftMenu}>
                    <MenuItem component={Link} to="/user-shift-upload">User Shift Upload</MenuItem>
                    <MenuItem component={Link} to="/user-shift-report">User Shift Report</MenuItem>
                  </Menu>

                  <StyledMenuButton component={Link} to="/attendance">
                    Attendance
                  </StyledMenuButton>

                  <StyledMenuButton
                    component={Link}
                    to="/login"
                    startIcon={<PowerSettingsNewIcon />}
                    sx={{
                      mx: 1,
                      backgroundColor: '#e53935',
                      '&:hover': {
                        backgroundColor: '#d32f2f',
                      },
                    }}
                  >
                    Logout
                  </StyledMenuButton>
                </Box>
              ) : (
                <IconButton
                  edge="end"
                  onClick={toggleDrawer(true)}
                  class={`menu-button ${isMenuOpen ? 'open' : ''}`} // Add class for animation
                >
                  {/* Animate between MenuIcon and CloseIcon */}
                  {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              )}
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)} >
          <List>
            {/* Close Drawer Button */}
            <ListItem>
              <IconButton
                onClick={toggleDrawer(false)}
                className="close-icon"
                sx={{ marginLeft: 'auto', color: '#000' }}
              >
                <CloseIcon />
              </IconButton>
            </ListItem>

            {/* Home Link */}
            <ListItem button component={Link} to="/home">
              <ListItemText primary="Home" />
            </ListItem>

            {/* Expandable Master Section */}
            <ListItem button onClick={handleToggleMaster}>
              <ListItemText primary="Master" />
              {openMaster ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={openMaster} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/stage-master" sx={{ pl: 4 }}>
                  <ListItemText primary="Stage Master" />
                </ListItem>
                <ListItem button component={Link} to="/skill-master" sx={{ pl: 4 }}>
                  <ListItemText primary="Skill Master" />
                </ListItem>
              </List>
            </Collapse>
            {/* User Skills Link */}
            <ListItem button component={Link} to="/user-skills">
              <ListItemText primary="User Skills" />
            </ListItem>
            {/* Expandable User Shift Roster Section */}
            <ListItem button onClick={handleToggleShift}>
              <ListItemText primary="User Shift Roster" />
              {openShift ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={openShift} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem button component={Link} to="/user-shift-upload" sx={{ pl: 4 }}>
                  <ListItemText primary="User Shift Upload" />
                </ListItem>
                <ListItem button component={Link} to="/user-shift-report" sx={{ pl: 4 }}>
                  <ListItemText primary="User Shift Report" />
                </ListItem>
              </List>
            </Collapse>

            {/* Attendance Link */}
            <ListItem button component={Link} to="/attendance">
              <ListItemText primary="Attendance" />
            </ListItem>

            {/* Logout Link */}
            <ListItem button component={Link} to="/login">
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Drawer>


        {/* Full-Width Carousel Section */}
        {location.pathname === '/home' && (
          <Box sx={{ width: '100%', mt: 5 }}>
            <Carousel
              showArrows={true}
              showThumbs={false}
              infiniteLoop={true}
              autoPlay={true}
              interval={3000}
              transitionTime={1000}  /* Smooth transition effect */
              stopOnHover={true}
              renderArrowPrev={(onClickHandler, hasPrev) =>
                hasPrev && (
                  <button type="button" onClick={onClickHandler} class="custom-prev-arrow">
                    &#8249;
                  </button>
                )
              }
              renderArrowNext={(onClickHandler, hasNext) =>
                hasNext && (
                  <button type="button" onClick={onClickHandler} class="custom-next-arrow">
                    &#8250;
                  </button>
                )
              }
            >
              {/* First Slide - Emmvee Logo */}
              <div className="carouselslide" style={{ width: 'auto' }}>
                <img src={EmmveeLogo} alt="Emmvee Logo" style={{ maxWidth: '100%', maxHeight: '300px' }} />
              </div>

              {/* Second Slide - Stage Master */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>Stage Master</h2>
                  <Button component={Link} to="/stage-master" variant="contained" class="styled-button">
                    Go to Stage Master
                  </Button>
                </Box>
              </div>

              {/* Third Slide - Skill Master */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>Skill Master</h2>
                  <Button component={Link} to="/stage-master" variant="contained" class="styled-button">
                    Go to Skill Master
                  </Button>
                </Box>
              </div>

              {/* Fourth Slide - User Skills */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>User Skills</h2>
                  <Button component={Link} to="/user-skills" variant="contained" class="styled-button">
                    Go to User Skills
                  </Button>
                </Box>
              </div>

              {/* Fifth Slide - User Shift Upload */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>User Shift Upload</h2>
                  <Button component={Link} to="/user-shift-upload" variant="contained" class="styled-button">
                    Go to User Shift Upload
                  </Button>
                </Box>
              </div>

              {/* Sixth Slide - User Shift Report */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>User Shift Report</h2>
                  <Button component={Link} to="/user-shift-report" variant="contained" class="styled-button">
                    Go to User Shift Report
                  </Button>
                </Box>
              </div>

              {/* Seventh Slide - Attendance */}
              <div className="carouselslide">
                <Box sx={{ textAlign: 'center' }}>
                  <h2>Attendance</h2>
                  <Button component={Link} to="/attendance" variant="contained" class="styled-button">
                    Go to Attendance
                  </Button>
                </Box>
              </div>
            </Carousel>
          </Box>
        )}
      </ThemeProvider>

      <style>{`
 

      `}</style>
    </>
  );
};

export default HomePage;
