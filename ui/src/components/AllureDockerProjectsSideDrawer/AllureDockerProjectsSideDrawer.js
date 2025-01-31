import React, { useState } from "react";

import { withStyles, MuiThemeProvider } from "@material-ui/core/styles";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import Typography from "@material-ui/core/Typography";

import { Link, withRouter } from "react-router-dom";

const drawerWidth = 240;
const styles = (theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
  },
  title: {
    display: "block",
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  teamHeader: {
    backgroundColor: theme.palette.action.hover,
  },
});

const AllureDockerProjectsSideDrawer = (props) => {
  const { classes } = props;
  const [openTeams, setOpenTeams] = useState({});

  // Agrupar proyectos por equipo
  const groupProjects = () => {
    const groups = {};
    
    for (let key in props.projects) {
      const teamPrefix = key.split('-')[0];
      if (!groups[teamPrefix]) {
        groups[teamPrefix] = [];
      }
      groups[teamPrefix].push(key);
    }
    
    return groups;
  };

  const handleTeamClick = (team) => {
    setOpenTeams(prev => ({
      ...prev,
      [team]: !prev[team]
    }));
  };

  const groupedProjects = groupProjects();

  return (
    <Drawer
      className={classes.drawer}
      variant="persistent"
      anchor="left"
      open={props.isSideDrawerOpen}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.drawerHeader}>
        <IconButton onClick={props.handleSideDrawerClose}>
          {MuiThemeProvider.direction === "ltr" ? (
            <ChevronLeftIcon />
          ) : (
            <React.Fragment>
              <Typography className={classes.title} variant="subtitle1" noWrap>
                {props.title}
              </Typography>
              <ChevronRightIcon />
            </React.Fragment>
          )}
        </IconButton>
      </div>
      <Divider />
      <List>
        {Object.entries(groupedProjects).map(([team, projects]) => (
          <React.Fragment key={team}>
            <ListItem 
              button 
              onClick={() => handleTeamClick(team)}
              className={classes.teamHeader}
            >
              <ListItemText 
                primary={team.toUpperCase()} 
                primaryTypographyProps={{ variant: 'subtitle2' }}
              />
              {openTeams[team] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openTeams[team]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {projects.map(projectId => (
                  <Link
                    to={`/projects/${projectId}`}
                    key={projectId}
                    style={{ color: "inherit", textDecoration: "inherit" }}
                  >
                    <ListItem 
                      button 
                      id={projectId} 
                      onClick={() => props.selectProject(projectId)}
                      className={classes.nested}
                    >
                      <ListItemText 
                        primary={projectId.substring(projectId.indexOf('-') + 1)} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  </Link>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default withStyles(styles, { withTheme: true })(
  withRouter(AllureDockerProjectsSideDrawer)
);
