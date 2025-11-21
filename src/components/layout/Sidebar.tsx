import React from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Box, IconButton, styled } from "@mui/material";
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import {
  SignalCellularAlt as SignalIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Forum as ForumIcon,
} from "@mui/icons-material";
import AddTaskIcon from "@mui/icons-material/AddTask";
import { useHelpCenter } from "../../contextApi/HelpCenterContext";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import setupWizardIcon from "../../assets/image/setup-wizard.svg";
import logo from "../../assets/image/logo.svg";
const SIDEBAR_WIDTH = 80;
const SIDEBAR_COLLAPSED_WIDTH = 0;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
  transition: "width 150ms cubic-bezier(0.4,0,0.2,1) 0ms",
  overflowX: "hidden",
  position: "relative",
  top: 0,
  left: 0,
  height: "100vh",
  zIndex: 1200,
  "& .MuiDrawer-paper": {
    width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
    transition: "width 150ms cubic-bezier(0.4,0,0.2,1) 0ms",
    overflowX: "hidden",
    backgroundColor: "#133e5e",
    borderRight: "none",
  },
}));

const iconColors = [
  "#ffffff1a", // green
  "#ffffff1a", // blue
  "#ffffff1a", // orange
  "#ffffff1a", // red
  "#ffffff1a", // purple
  "#ffffff1a", // cyan
];

const ColoredShortcutButton = styled(IconButton)<{ bgcolor: string }>(
  ({ theme, bgcolor }) => ({
    margin: theme.spacing(1),
    color: "#ffffff",
    backgroundColor: bgcolor,
    borderRadius: 8,
    width: 40,
    height: 40,
    "&:hover": {
      backgroundColor: bgcolor,
      opacity: 0.85,
    },
    boxShadow: theme.shadows[1],
    fontSize: 20,
  })
);

interface SidebarProps {
  open: boolean;
  handleDrawerToggle: () => void;
  onClose?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { toggleHelpCenter } = useHelpCenter();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <StyledDrawer
      variant="permanent"
      open={open}
      sx={{
        "& .MuiDrawer-paper": {
          backgroundColor: "theme.palette.background.paper",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",

          py: 2,
          position: "relative",
          overflow: "visible",
        }}
      >
        {open && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              // mb: 2,
            }}
          >
            <img
              src={logo}
              alt="MS Corp"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
              }}
            />
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {/* icon group */}
          <ColoredShortcutButton bgcolor={iconColors[0]}>
            <SignalIcon fontSize="inherit" />
          </ColoredShortcutButton>
          <ColoredShortcutButton
            bgcolor={iconColors[1]}
            onClick={() => handleNavigation("/tickets")}
          >
            <ConfirmationNumberIcon fontSize="inherit" />
          </ColoredShortcutButton>
          <ColoredShortcutButton
            bgcolor={iconColors[4]}
            onClick={() => handleNavigation("/chat")}
          >
            {/* <ForumIcon fontSize="inherit" />
          </ColoredShortcutButton>
          <ColoredShortcutButton
            bgcolor={iconColors[5]}
            onClick={() => handleNavigation("/tasks")}
          >
            <AddTaskIcon fontSize="inherit" />
          </ColoredShortcutButton>
          <ColoredShortcutButton
            bgcolor={iconColors[2]}
            onClick={() => handleNavigation("/user")}
          > */}
            <PeopleIcon fontSize="inherit" />
          </ColoredShortcutButton>
          <ColoredShortcutButton
            bgcolor={iconColors[3]}
            onClick={() => handleNavigation("/settings")}
          >
            <SettingsIcon fontSize="inherit" />
          </ColoredShortcutButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <IconButton
            size="medium"
            onClick={toggleHelpCenter}
            sx={{ background: "#fff", mb: 1 }}
          >
            <img
              src={setupWizardIcon}
              alt="Setup Wizard"
              style={{ width: 24, height: 24 }}
            />
          </IconButton>
        </Box>
      </Box>
    </StyledDrawer>
  );
};

export default Sidebar;
