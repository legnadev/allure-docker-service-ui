import React, { Component } from "react";

import Backdrop from "@material-ui/core/Backdrop";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Card from "@material-ui/core/Card";
import CardMedia from "@material-ui/core/CardMedia";
import CircularProgress from "@material-ui/core/CircularProgress";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import FileCopyRounded from "@material-ui/icons/FileCopyRounded";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Refresh from "@material-ui/icons/Refresh";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { withRouter } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";

import axios from "../../api/axios-allure-docker";
import AllureDockerReportsDropDown from "../../components/AllureDockerReportsDropDown/AllureDockerReportsDropDown";
import AllureDockerDeleteProjectDialog from "../../components/AllureDockerDeleteProjectDialog/AllureDockerDeleteProjectDialog";
import AllureDockerGenerateReport from "../../components/AllureDockerGenerateReportDialog/AllureDockerGenerateReportDialog";
import AllureDockerCleanResultsDialog from "../../components/AllureDockerCleanResultsDialog/AllureDockerCleanResultsDialog";
import AllureDockerCleanHistoryDialog from "../../components/AllureDockerCleanHistoryDialog/AllureDockerCleanHistoryDialog";
import AllureDockerSendResultsDialog from "../../components/AllureDockerSendResultsDialog/AllureDockerSendResultsDialog";
import { redirect, redirectRootInSeconds } from "../../utility/navigate";
import { isAdmin } from "../../utility/user-actions";

const styles = (theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2, 3, 0, 3),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  cardMedia: {
    height: 1000,
  },
  rootButtonGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  actionButton: {
    borderRadius: '8px',
    textTransform: 'none',
    padding: theme.spacing(1, 2),
    fontSize: '0.875rem',
    minWidth: 'auto',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    '&:hover': {
      backgroundColor: '#b91c1c',
    },
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  iconButton: {
    borderRadius: '8px',
    padding: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
});

class AllureDockerProject extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState;
  }

  get initialState() {
    return {
      project: null,
      projectNotFound: false,
      progress: false,
      reportSelected: null,
      reportSelectedValue: 0,
      reportUrlSelected: null,
      openDeleteProjectDialog: false,
      openGenerateReportDialog: false,
      openCleanResultsDialog: false,
      openCleanHistoryDialog: false,
      openSendResultsDialog: false,
      openCopyToolTip: false,
    };
  }

  componentDidMount() {
    this.getProject(this.props.match.params.id);
  }

  componentDidUpdate() {
    if (this.props.match.params.id) {
      if (
        !this.state.project ||
        (this.state.project &&
          this.state.project.id !== this.props.match.params.id)
      ) {
        this.getProject(this.props.match.params.id);
      }
    }
  }

  getProject = (projectId) => {
    axios
      .get(`/projects/${projectId}`)
      .then((response) => {
        this.setState({
          project: response.data.data.project,
          reportSelected: null,
          reportSelectedValue: 0,
          reportUrlSelected: null,
          projectNotFound: false,
        });
      })
      .catch((error) => {
        redirect(error);

        let projectNotFound = false;
        if (error.status === 404) {
          projectNotFound = true;
        }
        this.handleAPIErrorAlert(error);
        const project = { ...this.state.project };
        project.id = projectId;
        project.reports = [];
        this.setState({ project: project, projectNotFound: projectNotFound });
        redirectRootInSeconds(3);
      });
  };

  goToEmailableReport = (projectId) => {
    if (projectId) {
      axios
        .get(`/emailable-report/render?project_id=${projectId}`, {
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(
            new Blob([response.data], { type: "text/html" })
          );
          window.open(url, "_blank");
          this.handleAPISuccessAlert("Report successfully rendered");
        })
        .catch((error) => {
          redirect(error);
          this.handleAPIErrorAlert(error);
        });
    }
  };

  exportEmailableReport = (projectId) => {
    axios
      .get(`/emailable-report/export?project_id=${projectId}`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "text/html" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${projectId}-emailable-report-allure-docker-service.html`;
        link.click();
        this.handleAPISuccessAlert("Emailable Report successfully exported");
      })
      .catch((error) => {
        redirect(error);
        this.handleAPIErrorAlert(error);
      });
  };

  exportFullReport = (projectId) => {
    axios
      .get(`/report/export?project_id=${projectId}`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/zip" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${projectId}-allure-docker-service-report.zip`;
        link.click();
        this.handleAPISuccessAlert("Full Report successfully exported");
      })
      .catch((error) => {
        redirect(error);
        this.handleAPIErrorAlert(error);
      });
  };

  refreshProject = () => {
    this.setState(this.initialState);
  };

  copyReportUrl = (reportUrlSelected) => {
    if(reportUrlSelected) {
      navigator.clipboard.writeText(reportUrlSelected);
      this.openCopyToolTip();
    }
  };

  goToReport = (reportUrlSelected) => {
    if (reportUrlSelected) {
      window.open(reportUrlSelected, "_blank");
    }
  };

  showProgress = (show) => {
    this.setState({ progress: show });
  };

  handleAPISuccessAlert = (message) => {
    this.props.setAPIAlert("success", message, true);
  };

  handleAPIErrorAlert = (error) => {
    this.props.setAPIAlert(
      "error",
      `Something wrong => ${error.message}`,
      true
    );
  };

  openDeleteProjectDialog = () => {
    this.setState({ openDeleteProjectDialog: true });
  };

  closeDeleteProjectDialog = () => {
    this.setState({ openDeleteProjectDialog: false });
  };

  openGenerateReportDialog = () => {
    this.setState({ openGenerateReportDialog: true });
  };

  closeGenerateReportDialog = () => {
    this.setState({ openGenerateReportDialog: false });
  };

  openCleanResultsDialog = () => {
    this.setState({ openCleanResultsDialog: true });
  };

  closeCleanResultsDialog = () => {
    this.setState({ openCleanResultsDialog: false });
  };

  openCleanHistoryDialog = () => {
    this.setState({ openCleanHistoryDialog: true });
  };

  closeCleanHistoryDialog = () => {
    this.setState({ openCleanHistoryDialog: false });
  };

  openSendResultsDialog = () => {
    this.setState({ openSendResultsDialog: true });
  };

  closeSendResultsDialog = () => {
    this.setState({ openSendResultsDialog: false });
  };

  openCopyToolTip = () => {
    this.setState({ openCopyToolTip: true });
  };

  closeCopyToolTip = () => {
    this.setState({ openCopyToolTip: false });
  };

  buildReportIPath = (projectId, reportId) => {
    return `/projects/${projectId}/reports/${reportId}/index.html?redirect=false`;
  };

  selectReport = (event, projectId) => {
    const reportUrlSelected =
      event.target["options"][event.target["options"].selectedIndex].text;
    const reportSelectedValue = event.target.value;
    const reportPath = this.buildReportIPath(projectId, reportSelectedValue);

    axios
      .get(reportPath)
      .then((response) => {
        this.setState({
          reportSelectedValue: reportSelectedValue,
          reportSelected: `${window._env_.ALLURE_DOCKER_API_URL}${reportPath}`,
          reportUrlSelected: reportUrlSelected,
        });
      })
      .catch((error) => {
        redirect(error);
        this.handleAPIErrorAlert(error);
      });
  };

  render() {
    const { classes } = this.props;
    let projectId = "";
    let reports = [];
    let reportIframe = "";
    let reportSelectedValue = "";
    let reportUrlSelected = "";

    if (this.state.project) {
      const project = this.state.project;
      projectId = project.id;
      if (project.reports.length !== 0) {
        for (let i in project.reports) {
          reports.push({
            linkValue: project.reports_id[i],
            linkVisibleText: `${window.location.href}/reports/${project.reports_id[i]}`,
          });
        }
        const reportPath = this.buildReportIPath(
          projectId,
          reports[0].linkValue
        );
        reportIframe = `${window._env_.ALLURE_DOCKER_API_URL}${reportPath}`;
        reportSelectedValue = reports[0].linkValue;
        reportUrlSelected = reports[0].linkVisibleText;

        if (
          this.state.reportSelected &&
          this.state.reportSelected !== reportIframe
        ) {
          reportIframe = this.state.reportSelected;
          reportSelectedValue = this.state.reportSelectedValue;
        }

        if (this.state.reportUrlSelected) {
          reportUrlSelected = this.state.reportUrlSelected;
        }
      }
    }

    let progress = "";
    if (this.state.progress) {
      progress = (
        <Backdrop open={true} className={classes.backdrop}>
          <CircularProgress color="inherit" />
        </Backdrop>
      );
    }

    let buttons = [];
    if (!this.state.projectNotFound) {
      buttons.push(
        <Button
          variant="contained"
          className={`${classes.actionButton} ${classes.dangerButton}`}
          onClick={this.openDeleteProjectDialog}
          key="delete"
          disabled={!isAdmin()}
        >
          Delete Project
        </Button>
      );
    }

    if (
      !reportSelectedValue ||
      reportSelectedValue === "latest" ||
      reports.length === 0
    ) {
      const adminButtons = [
        { key: 'clean-history', label: 'Clean History', onClick: this.openCleanHistoryDialog, isDanger: true },
        { key: 'send-results', label: 'Send Results', onClick: this.openSendResultsDialog },
        { key: 'generate-report', label: 'Generate Report', onClick: this.openGenerateReportDialog },
        { key: 'clean-results', label: 'Clean Results', onClick: this.openCleanResultsDialog },
      ].map(btn => (
        <Button
          key={btn.key}
          variant="contained"
          className={`${classes.actionButton} ${btn.isDanger ? classes.dangerButton : classes.primaryButton}`}
          onClick={btn.onClick}
          disabled={!isAdmin()}
        >
          {btn.label}
        </Button>
      ));

      const exportButtons = [
        { key: 'get-emailable-report', label: 'Get Emailable Report', onClick: () => this.goToEmailableReport(projectId) },
        { key: 'export-emailable-report', label: 'Export Emailable Report', onClick: () => this.exportEmailableReport(projectId) },
        { key: 'export-full-report', label: 'Export Full Report', onClick: () => this.exportFullReport(projectId) },
      ].map(btn => (
        <Button
          key={btn.key}
          variant="contained"
          className={`${classes.actionButton} ${classes.primaryButton}`}
          onClick={btn.onClick}
        >
          {btn.label}
        </Button>
      ));

      buttons.push(...adminButtons, ...exportButtons);
    }

    const buttonsGroup = (
      <div className={classes.buttonGroup}>
        {buttons}
      </div>
    );

    return (
      <React.Fragment>
        <Grid container spacing={8}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Typography variant="h4" align="left">
                {projectId}
              </Typography>
              <div align="center">{progress}</div>
              <div>
                <AllureDockerReportsDropDown
                  selectReport={(event) => this.selectReport(event, projectId)}
                  reportSelected={reportSelectedValue}
                  reports={reports}
                />
                <Button 
                  key="refresh" 
                  onClick={this.refreshProject}
                  className={classes.iconButton}
                >
                  <Refresh />
                </Button>

                <ClickAwayListener onClickAway={this.closeCopyToolTip}>
                  <Tooltip
                    PopperProps={{
                      disablePortal: true,
                    }}
                    onClose={this.closeCopyToolTip}
                    open={this.state.openCopyToolTip}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    title="URL copied"
                    placement="top"
                  >
                    <Button
                      key="file-copy"
                      onClick={() => this.copyReportUrl(reportUrlSelected)}
                    >
                      <FileCopyRounded />
                    </Button>
                  </Tooltip>
                </ClickAwayListener>
                <Button
                  key="go-to"
                  onClick={() => this.goToReport(reportUrlSelected)}
                >
                  <FullscreenIcon />
                </Button>
              </div>
              <div>
                {buttonsGroup}
                <AllureDockerDeleteProjectDialog
                  projectId={this.props.match.params.id}
                  open={this.state.openDeleteProjectDialog}
                  handleCloseDialog={this.closeDeleteProjectDialog}
                  setAPIAlert={this.props.setAPIAlert}
                  getProjects={this.props.getProjects}
                  showProgress={this.showProgress}
                />
                <AllureDockerSendResultsDialog
                  projectId={this.props.match.params.id}
                  open={this.state.openSendResultsDialog}
                  handleCloseDialog={this.closeSendResultsDialog}
                  setAPIAlert={this.props.setAPIAlert}
                  getProjects={this.props.getProjects}
                  refreshProject={this.refreshProject}
                  showProgress={this.showProgress}
                />
                <AllureDockerGenerateReport
                  projectId={this.props.match.params.id}
                  open={this.state.openGenerateReportDialog}
                  handleCloseDialog={this.closeGenerateReportDialog}
                  setAPIAlert={this.props.setAPIAlert}
                  getProjects={this.props.getProjects}
                  refreshProject={this.refreshProject}
                  showProgress={this.showProgress}
                />
                <AllureDockerCleanResultsDialog
                  projectId={this.props.match.params.id}
                  open={this.state.openCleanResultsDialog}
                  handleCloseDialog={this.closeCleanResultsDialog}
                  setAPIAlert={this.props.setAPIAlert}
                  getProjects={this.props.getProjects}
                  refreshProject={this.refreshProject}
                  showProgress={this.showProgress}
                />
                <AllureDockerCleanHistoryDialog
                  projectId={this.props.match.params.id}
                  open={this.state.openCleanHistoryDialog}
                  handleCloseDialog={this.closeCleanHistoryDialog}
                  setAPIAlert={this.props.setAPIAlert}
                  getProjects={this.props.getProjects}
                  refreshProject={this.refreshProject}
                  showProgress={this.showProgress}
                />
                <Card>
                  <CardMedia
                    className={classes.cardMedia}
                    component="iframe"
                    image={reportIframe}
                    title="Allure Report"
                  ></CardMedia>
                </Card>
              </div>
            </Paper>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default withStyles(styles, { withTheme: true })(
  withRouter(AllureDockerProject)
);
