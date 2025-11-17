import React, { useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Dialog,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  styled,
  TextField,
  Typography,
} from "@mui/material";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useHelpCenter } from "../../../contextApi/HelpCenterContext";
import { useTicketsLayoutOptional } from "../../../contextApi/TicketsLayoutContext";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { Close, RadioButtonChecked } from "@mui/icons-material";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const dummyData = {
  status: [
    "Answered",
    "Calling",
    "Chatting",
    "Spam",
    "Deleted",
    "New",
    "Open",
    "Resolved",
    "Postponed",
    "Closed",
  ],
  source: [
    "Email",
    "Chat button",
    "Contact form",
    "Invitation",
    "Call",
    "Call widget",
    "Facebook",
    "Facebook message",
    "Forum",
    "X",
    "Suggestion",
    "Instagram",
    "Instagram mention",
    "Viber",
    "WhatsApp",
  ],
  tags: ["Bug", "Feedback", "Feature request", "Urgent"],
};

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

interface ViewItem {
  id: string;
  label: string;
  count: number;
  isSecondary?: boolean;
}

const viewsData: ViewItem[] = [
  { id: "your-unsolved", label: "Your unsolved tickets", count: 1 },
  { id: "unassigned", label: "Unassigned tickets", count: 0 },
  { id: "all-unsolved", label: "All unsolved tickets", count: 1 },
  { id: "recently-updated", label: "Recently updated tickets", count: 1 },
  { id: "pending", label: "Pending tickets", count: 0 },
  { id: "recently-solved", label: "Recently solved tickets", count: 0 },
  { id: "suspended", label: "Suspended tickets", count: 0, isSecondary: true },
  { id: "deleted", label: "Deleted tickets", count: 0, isSecondary: true },
];

const LeftMenu: React.FC = () => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const context = useTicketsLayoutOptional();
  const [selectedViews, setSelectedViews] = useState<string[]>(["all-unsolved", "org2"]);
  
  const leftMenuExpanded = context?.leftMenuExpanded ?? internalExpanded;
  const setLeftMenuExpanded = context?.setLeftMenuExpanded ?? setInternalExpanded;
  
  const gettingStartedExpanded = leftMenuExpanded;
  
  const setGettingStartedExpanded = (value: boolean) => {
    setLeftMenuExpanded(value);
  };
  
  const { helpCenterOpen } = useHelpCenter();
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    dummyData.status.filter((s) => !["Spam", "Deleted"].includes(s))
  );
  
  const mainViews = viewsData.filter((view) => !view.isSecondary);
  const secondaryViews = viewsData.filter((view) => view.isSecondary);

  const checkAllStatus = () => setSelectedStatus(dummyData.status);
  const uncheckAllStatus = () => setSelectedStatus([]);

  const handleStatusToggle = (status: any) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleCreateFilter = () => {
    const payload = {
      filterName: "My Support Filter",
      conditions: {
        status: ["Answered", "Calling", "Open", "Resolved"],
        tags: {
          operator: "contains",
          values: ["urgent", "priority"],
        },
        source: ["Email", "Chat button", "Facebook message", "WhatsApp"],
      },
      searchCondition: "status",
    };
    console.log("Payload for create filter", payload);
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: "calc(100vh - 60px)",
        overflow: "visible",
        width: gettingStartedExpanded ? 240 : 35,
        transition: "width 0.3s ease",
        backgroundColor: "#d0d8dd",
        marginTop: "60px",
        display: helpCenterOpen ? "none" : "flex",
        position: "relative",
      }}
    >
      {/* Expanded Collapse (Replaces sidebar) */}
      <div>
        <Collapse
          in={gettingStartedExpanded}
          orientation="horizontal"
          timeout={400}
          unmountOnExit={false}
          sx={{
            display: "flex",
            backgroundColor: "#fff",
            height: "100%",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          <Box
            sx={{
              width: 240,
              py: 2,

              height: "100%",
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Views Section */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                    pb: 1,
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    Views
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      sx={{
                        width: 24,
                        height: 24,
                        padding: 0.5,
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                      }}
                      onClick={() => setIsOpenFilter(true)}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        width: 24,
                        height: 24,
                        padding: 0.5,
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                      }}
                      onClick={() => {
                        // Handle refresh views
                        console.log("Refresh views");
                      }}
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Search Input */}
                <Box sx={{ mb: 2 }}>
                  <Search>
                    <SearchIconWrapper>
                      <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                      placeholder="Search in All"
                      inputProps={{ "aria-label": "search" }}
                    />
                  </Search>
                </Box>

                {/* Main Views List */}
                <List dense sx={{ p: 0 }}>
                  {mainViews.map((view) => {
                    const isSelected = selectedViews.includes(view.id);
                    return (
                      <ListItem
                        key={view.id}
                        onClick={() => {
                          setSelectedViews((prev) =>
                            prev.includes(view.id)
                              ? prev.filter((id) => id !== view.id)
                              : [...prev, view.id]
                          );
                        }}
                        sx={{
                          px: 1,
                          py: 0.5,
                          cursor: "pointer",
                          borderRadius: "999px",
                          mb: 0.5,
                          bgcolor: isSelected ? "#e8eaec" : "transparent",
                          transition: "background-color 0.2s ease",
                          "&:hover": {
                            bgcolor: "#f1f3f4",
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: isSelected ? "#2566b0" : "#424242",
                                  fontWeight: isSelected ? 600 : 500,
                                }}
                              >
                                {view.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: "#757575",
                                  ml: 1,
                                }}
                              >
                                {view.count}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>

                {/* Separator */}
                <Divider sx={{ my: 2 }} />

                {/* Secondary Views List */}
                <List dense sx={{ p: 0 }}>
                  {secondaryViews.map((view) => {
                    const isSelected = selectedViews.includes(view.id);
                    return (
                      <ListItem
                        key={view.id}
                        onClick={() => {
                          setSelectedViews((prev) =>
                            prev.includes(view.id)
                              ? prev.filter((id) => id !== view.id)
                              : [...prev, view.id]
                          );
                        }}
                        sx={{
                          px: 1,
                          py: 0.5,
                          cursor: "pointer",
                          borderRadius: "999px",
                          mb: 0.5,
                          bgcolor: isSelected ? "#e8eaec" : "transparent",
                          transition: "background-color 0.2s ease",
                          "&:hover": {
                            bgcolor: "#f1f3f4",
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: isSelected ? "#2566b0" : "#424242",
                                  fontWeight: isSelected ? 600 : 500,
                                }}
                              >
                                {view.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: "#757575",
                                  ml: 1,
                                }}
                              >
                                {view.count}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

            </Box>

            <div className="flex justify-end py-4 border-t border-gray-200">
              <IconButton
                onClick={() => setGettingStartedExpanded(false)}
                sx={{
                  borderRadius: 0,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                }}
              >
                <ArrowForwardIosIcon sx={{ transform: "rotate(180deg)" }} />
              </IconButton>
            </div>
          </Box>
        </Collapse>
      </div>
      <div>
        {!gettingStartedExpanded && (
          <Box
            sx={{
              opacity: gettingStartedExpanded ? 0 : 1,
              transition: "opacity 0.2s ease, visibility 0.2s ease",
              width: 55,
              minWidth: 55,
              justifyItems: "flex-end",
              height: "100%",
            }}
          >
            <IconButton
              sx={{
                backgroundColor: "#fff",
                color: "#384859",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
                boxShadow: "0 2px 4px rgba(202, 202, 202, 0.8)",
                borderRadius: 0,
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
                position: "absolute",
                bottom: "5%",
                right: "5px",
              }}
              onClick={() => setGettingStartedExpanded(true)}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog
        onClose={() => setIsOpenFilter(false)}
        open={isOpenFilter}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            border: "1px solid #ccc",
            boxShadow: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 0,
            py: 1,
            px: 3,
          }}
        >
          <Typography variant="subtitle2">Tickets - Create filter</Typography>
          <IconButton color="inherit" onClick={() => setIsOpenFilter(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <div className="w-full py-2 px-8 max-h-[calc(100vh-190px)] overflow-y-auto">
          <div className="my-2">
            <Typography variant="subtitle2">Filter name</Typography>
            <TextField
              size="small"
              variant="outlined"
              error={false}
              fullWidth
              sx={{
                maxWidth: "40%",
              }}
            />
          </div>
          <Alert
            severity="error"
            sx={{
              maxWidth: "60%",
              p: 0,
              px: 2,
            }}
          >
            Filter name is mandatory
          </Alert>
          <Card
            elevation={0}
            sx={{
              my: 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Status Section */}
            <Box className="grid grid-cols-[1fr_4fr] gap-4">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Status
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton size="small" onClick={checkAllStatus}>
                    <RadioButtonChecked fontSize="small" /> 
                  </IconButton>
                  <IconButton size="small" onClick={uncheckAllStatus}>
                    <RadioButtonUncheckedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </div>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {dummyData.status.map((s) => (
                  <React.Fragment key={s}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedStatus.includes(s)}
                          onChange={() => handleStatusToggle(s)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{s}</Typography>}
                    />
                    <Divider />
                  </React.Fragment>
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Add search condition:
              </Typography>

              <Select
                size="small"
                defaultValue=""
                displayEmpty
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>Select condition</em>
                </MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="tags">Tags</MenuItem>
                <MenuItem value="source">Source</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </Box>
          </Card>
          <div className="flex  gap-2 mt-4">
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateFilter}
            >
              Create
            </Button>
            <Button variant="text" sx={{ fontWeight: 600 }}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </Box>
  );
};

export default LeftMenu;
