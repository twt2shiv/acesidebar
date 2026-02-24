import React, { useEffect, useState } from "react";
import ReplyIcon from "@mui/icons-material/Reply";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ListIcon from "@mui/icons-material/List";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import {
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Autocomplete,
  Drawer,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import ConfirmationModal from "../../../components/reusable/ConfirmationModal";
import { Button } from "@mui/material";
import Mergeticket from "../../components/Mergeticket";
import CustomToolTip from "../../../reusable/CustomToolTip";
import {
  useCommanApiMutation,
  useGetWatcherQuery,
} from "../../../services/threadsApi";

import { useToast } from "../../../hooks/useToast";
import { useLazyGetAgentsBySeachQuery } from "../../../services/agentServices";

const ActionButton = ({
  icon,
  tooltip,
  onClick,
  className,
  hasDropdown = false,
  onDropdownClick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  hasDropdown?: boolean;
  onDropdownClick?: (event: React.MouseEvent<HTMLElement>) => void;
}) => {
  return (
    <div className="flex items-center">
      <Tooltip title={tooltip}>
        <Button
          variant="contained"
          color="inherit"
          onClick={onClick}
          size="small"
          className={`flex items-center justify-center normal-case shadow-none px-3 py-1 text-sm ${
            className || ""
          }`}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            minWidth: "40px",
          }}
        >
          {icon}
        </Button>
      </Tooltip>
      {hasDropdown && (
        <CustomToolTip
          title={
            <Typography className="px-2 py-1" variant="subtitle2">
              {tooltip}
            </Typography>
          }
          placement="top"
        >
          <Button
            variant="contained"
            color="inherit"
            onClick={onDropdownClick}
            size="small"
            className="flex items-center justify-center normal-case shadow-none px-1 py-1 text-sm ml-0"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              minWidth: "24px",
              borderLeft: "1px solid #e0e0e0",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <ArrowDropDownIcon fontSize="small" />
          </Button>
        </CustomToolTip>
      )}
    </div>
  );
};

const TicketDetailHeader = ({
  ticket,
  onBack,
  ticketNumber,
  onForward,
  onReply,
  onNote,
  onPreviousTicket,
  onNextTicket,
  hasPreviousTicket = true,
  hasNextTicket = true,
  isTicketLoading = false,
}: any) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [triggerDeleteWatcher, { isLoading: isDeletingLoading }] =
    useCommanApiMutation();
  const [isMergeModal, setIsMergeModal] = useState(false);

  const [statusAnchorEl, setStatusAnchorEl] =
    React.useState<HTMLElement | null>(null);
  const [statusOpen, setStatusOpen] = React.useState(false);

  const [watcherEnabled, setWatcherEnabled] = useState(true);
  const [watchersAnchorEl, setWatchersAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [onChangeAgent, setOnChangeAgent] = useState("");
  const [agentOptions, setAgentOptions] = useState<any>([]);
  const { showToast } = useToast();
  const [watchersOpen, setWatchersOpen] = useState(false);
  const {
    data: watcherData,
    refetch,
    isLoading: watcherLoading,
  } = useGetWatcherQuery(
    { ticket: ticket?.ticketId },
    { skip: !ticket?.ticketId }
  );

  const [triggerSeachAgent, { isLoading: seachAgentLoading }] =
    useLazyGetAgentsBySeachQuery();
  const [trackId, setTrackId] = useState("");
  const [triggerWatcherStatus, { isLoading: watcherStatusLoading }] =
    useCommanApiMutation();
  const [triggerWatchApi] = useCommanApiMutation();
  const displayAgentOptions = onChangeAgent ? agentOptions : [];

  const fetchAgentOptions = async (query: string) => {
    if (!query) {
      setAgentOptions([]);
      return;
    }

    try {
      const res = await triggerSeachAgent({
        search: query,
      }).unwrap();
      const data = Array.isArray(res) ? res : res?.data;

      const currentValue = onChangeAgent;
      const fallback = [
        {
          fName: currentValue,
          emailAddress: currentValue,
        },
      ];

      if (Array.isArray(data)) {
        setAgentOptions(data.length > 0 ? data : fallback);
      } else {
        setAgentOptions([]);
      }
    } catch (error) {
      setAgentOptions([]);
    }
  };

  const [commanApi] = useCommanApiMutation();


  const hanldeDeleteThread = (ticketId: any) => {
    if (!ticketId || ticketId === "") {
      return;
    }
    const payload = {
      url: `${ticketId}/delete`,
      method: "DeLETE",
    };
    commanApi(payload);
  };

  // Status dropdown options
  const statusOptions = [
    {
      label: "Hold",
      icon: <ArrowBackIcon fontSize="small" />,
      action: () => console.log("Status changed to Hold"),
    },
    {
      label: "Open",
      icon: <ArrowBackIcon fontSize="small" />,
      action: () => console.log("Status changed to Open"),
    },
    {
      label: "Resolved",
      icon: <ListIcon fontSize="small" />,
      action: () => console.log("Status changed to Resolved"),
    },
  ];

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
    setStatusOpen(true);
  };

  const handleStatusClose = () => {
    setStatusOpen(false);
    setStatusAnchorEl(null);
  };

  const handleWatcherToggle = () => {
    const urlValues = {
      ticketId: ticket?.ticketId,
      status: watcherEnabled ? 1 : 2,
    };
    const payload = {
      url: `watchers-status/${urlValues.ticketId}/${urlValues.status}`,
      method: "PUT",
    };
    triggerWatcherStatus(payload).then((res: any) => {
      if (res?.error?.data?.type === "error") {
        return;
      } else {
        setWatcherEnabled(!watcherEnabled);
      }
    });
  };

  const handleWatchersClick = (event: React.MouseEvent<HTMLElement>) => {
    setWatchersAnchorEl(event.currentTarget);
    setWatchersOpen(true);
  };

  const handleWatchersClose = () => {
    setWatchersOpen(false);
    setWatchersAnchorEl(null);
  };

  const handleRemoveWatcher = (watcherId: number) => {
    const watchID = watcherId;
    const ticketvalue = { ticket: ticket?.ticketId };
    const payload = {
      url: `remove-watcher/${ticketvalue.ticket}/${watchID}`,
      method: "DELETE",
    };

    triggerDeleteWatcher(payload)
      //@ts-ignore
      .unwrap()
      .then(() => {
        refetch();
      })
      .catch((error: any) => {
        showToast(error?.message || "Failed to remove watcher", "error");
      });
  };

  const handleAddWatcher = (newWatcher: any) => {
    const selectedAgentId = newWatcher?.agentID;
    if (!selectedAgentId) {
      return;
    }

    const isAlreadyAdded = watcherData?.some(
      (existing: any) => existing?.watchKey === selectedAgentId
    );
    if (isAlreadyAdded) {
      return;
    }

    const ticketID = ticket?.ticketId;
    const payload = {
      url: `add-watcher/${ticketID}`,
      //@ts-ignore
      body: { watchers: [selectedAgentId] },
    };
    triggerWatchApi(payload)
      //@ts-ignore
      .unwrap()
      .then(() => {
        setOnChangeAgent("");
        refetch();
      })
      .catch((error: any) => {
        showToast(error?.message || "An error occurred", "error");
      });
  };


  return (
    <div className="flex items-center justify-between w-full px-6 py-2 border border-[#e0e0e0]  bg-[#e0e0e0] z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-gray-500 font-medium gap-1">
        <IconButton
          onClick={onBack}
          size="small"
          className="text-blue-600 hover:bg-blue-50 hover:text-blue-600"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {isTicketLoading ? (
            <Skeleton variant="text" width={80} height={24} sx={{ fontSize: "1rem" }} />
          ) : (
            <>
              <span className="text-[#2566b0] font-semibold text-md">
                {ticket?.ticketId && ticket?.ticketId}
              </span>
              <Tooltip title="Copy ticket number" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (ticket?.ticketId) {
                      navigator.clipboard.writeText(ticket.ticketId);
                      showToast("Ticket number copied to clipboard", "success");
                    }
                  }}
                  sx={{
                    width: 20,
                    height: 20,
                    padding: 0.5,
                    "&:hover": { bgcolor: "rgba(26, 115, 232, 0.08)" },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 14, color: "#2566b0" }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </nav>

      {/* Action buttons */}
      <div className="flex gap-2 ml-auto mr-10 items-center">
        {isTicketLoading ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" width={40} height={32} />
            ))}
          </Box>
        ) : (
          <>
            <ActionButton
              icon={<ReplyIcon fontSize="small" className="text-blue-600" />}
              tooltip="Post Reply"
              onClick={onReply}
            />
            <ActionButton
              icon={<NoteAddIcon fontSize="small" className="text-green-600" />}
              tooltip="Add Note"
              onClick={onNote}
            />

            <ActionButton
              icon={<SwapHorizIcon fontSize="small" className="text-purple-600" />}
              tooltip="Forward"
              onClick={() => onForward()}
            />
            <ActionButton
              onClick={() => setIsMergeModal(true)}
              icon={<MergeTypeIcon fontSize="small" className="text-purple-600" />}
              tooltip="Merge"
            />
            <Mergeticket
              open={isMergeModal}
              initialPrimary={{
                id: "T-1001",
                title: "Unable to login to portal",
                group: "Support",
                agent: "John Doe",
                closedAgo: "2 days ago",
                resolvedOnTime: true,
                isPrimary: true, // this is your main ticket
              }}
              onClose={() => setIsMergeModal(false)}
            />
            <ActionButton
              icon={<DeleteIcon fontSize="small" className="text-red-600" />}
              tooltip="Delete"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </>
        )}
      </div>

      {/* Navigation buttons - Right side */}

      <div className="flex gap-8  items-center">
        {watcherStatusLoading && <CircularProgress size={15} />}
        <div className="space-x-2 flex items-center">
          {isTicketLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Skeleton variant="rounded" width={44} height={24} />
              <Skeleton variant="rounded" width={32} height={32} />
            </Box>
          ) : (
            <>
              <Tooltip
                title={watcherEnabled ? "Disable Watchers" : "Enable Watchers"}
                placement="right"
              >
                <Switch
                  checked={watcherEnabled}
                  onChange={handleWatcherToggle}
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#2566b0",
                      "& + .MuiSwitch-track": {
                        backgroundColor: "#2566b0",
                      },
                    },
                    "& .MuiSwitch-track": {
                      backgroundColor: "#d1d5db",
                    },
                  }}
                />
              </Tooltip>
              <Tooltip
                title={
                  <Box className="p-2 rounded-md text-black">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", mb: 0.5 }}
                    >
                      Ticket watchers ({watcherData?.length})
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                      Agents added as watchers will receive alerts when this ticket
                      is updated
                    </Typography>
                  </Box>
                }
                placement="bottom"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "white",
                      color: "black",
                      boxShadow: 3,
                      border: "1px solid #e0e0e0",
                    },
                  },
                }}
              >
                {watcherEnabled ? (
                  <IconButton
                    onClick={handleWatchersClick}
                    size="small"
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton disabled size="small" disableRipple>
                    <VisibilityOffIcon fontSize="small" />
                  </IconButton>
                )}
              </Tooltip>
            </>
          )}
        </div>
        {/* Previous Ticket Button */}
        <IconButton
          onClick={onPreviousTicket}
          disabled={!hasPreviousTicket}
          size="small"
          className={`${
            hasPreviousTicket
              ? "text-blue-600 hover:bg-blue-50 hover:text-blue-600"
              : "text-gray-400"
          } disabled:text-gray-400`}
        >
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>

        {/* Next Ticket Button */}
        <IconButton
          onClick={onNextTicket}
          disabled={!hasNextTicket}
          size="small"
          className={`${
            hasNextTicket
              ? "text-blue-600 hover:bg-blue-50 hover:text-blue-600"
              : "text-gray-400"
          } disabled:text-gray-400`}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </div>
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => hanldeDeleteThread(ticketNumber)}
        type="delete"
      />

      {/* Status dropdown popup */}
      <Popover
        open={statusOpen}
        anchorEl={statusAnchorEl}
        onClose={handleStatusClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          className:
            "shadow-lg rounded-lg mt-1 relative border border-gray-200 w-48",
        }}
      >
        <List className="py-1">
          {statusOptions.map((option, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => {
                  option.action();
                  handleStatusClose();
                }}
                className="py-1.5 px-3 mx-1 rounded-md hover:bg-blue-50 active:bg-blue-100"
              >
                <ListItemIcon sx={{ minWidth: 35 }}>{option.icon}</ListItemIcon>
                <ListItemText primary={option.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>

      {/* Watchers Popover */}
      <Popover
        open={watchersOpen}
        anchorEl={watchersAnchorEl}
        onClose={handleWatchersClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            p: 2,
          },
        }}
      >
        <Box>
          {/* Header */}
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            Ticket watchers ({watcherData?.length})
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Agents added as watchers will receive alerts when this ticket is
            updated
          </Typography>

          <Autocomplete
            key={`watchers-${watcherData?.length}`}
            disableClearable={false}
            popupIcon={null}
            sx={{ my: 1.5 }}
            getOptionLabel={(option: any) => {
              if (typeof option === "string") return option;
              return option.fName || "";
            }}
            value={null}
            inputValue={onChangeAgent}
            isOptionEqualToValue={(option: any, value: any) =>
              option?.agentID === value?.agentID
            }
            options={displayAgentOptions}
            onChange={(event, newValue) => {
              if (newValue) {
                handleAddWatcher(newValue);
                setOnChangeAgent("");
              }
            }}
            onInputChange={(_, value, reason) => {
              setOnChangeAgent(value);
              if (reason === "input") {
                fetchAgentOptions(value);
              }
            }}
            filterOptions={(x) => x}
            getOptionDisabled={(option) =>
              typeof option === "string" && option === "Type to search"
            }
            clearOnBlur
            selectOnFocus
            handleHomeEndKeys
            noOptionsText={
              <div>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {seachAgentLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    "Type to search"
                  )}
                </Typography>
              </div>
            }
            renderOption={(props, option: any) => (
              <li {...props}>
                {typeof option === "string" ? (
                  option
                ) : (
                  <div className="flex flex-col" key={option.agentID}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {option.fName} {option.lName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.emailAddress}
                    </Typography>
                  </div>
                )}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Add more watchers..."
                size="small"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonAddIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "4px",
                    backgroundColor: "#f9fafb",
                    "&:hover fieldset": { borderColor: "#9ca3af" },
                    "&.Mui-focused fieldset": { borderColor: "#2566b0" },
                  },
                  "& label.Mui-focused": { color: "#2566b0" },
                  "& label": { fontWeight: "bold" },
                }}
              />
            )}
          />

          {/* Watchers List */}
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {watcherLoading ? (
              <CircularProgress size={18} />
            ) : (
              <>
                {watcherData?.map((watcher: any) => (
                  <Box
                    key={watcher?.watchKey}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {isDeletingLoading && trackId === watcher?.watchKey ? (
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTrackId(watcher?.watchKey);
                            handleRemoveWatcher(watcher?.watchKey);
                          }}
                          sx={{
                            color: "#ef4444",
                            mr: 1,
                            "&:hover": { backgroundColor: "#fee2e2" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          fontSize: "0.875rem",
                        }}
                      >
                        {watcher?.firstName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {watcher.firstName} {watcher.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {watcher?.emailID}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default TicketDetailHeader;
