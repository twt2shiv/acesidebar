import React, { useState, useEffect, useRef } from "react";
import TicketFilterPanel from "./TicketSidebar";
import {
  IconButton,
  Button,
  Checkbox,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import QuickreplyIcon from "@mui/icons-material/Quickreply";
import LeftMenu from "./LeftMenu";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import ConfirmationModal from "../../../components/reusable/ConfirmationModal";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useGetTicketListQuery,
  useGetPriorityListQuery,
  useGetTicketListSortingQuery,
  useGetTicketSortingOptionsQuery,
  useGetStatusListQuery,
} from "../../../services/ticketAuth";
import TicketSkeleton from "../../skeleton/TicketSkeleton";
import TablePagination from "@mui/material/TablePagination";

import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import TicketSortingPopover from "../../../components/shared/TicketSortingPopover";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate } from "react-router-dom";
import UserHoverPopup from "../../../components/popup/UserHoverPopup";
import emptyticketimg from "../../../assets/24681956_6988299.svg";
import { useCommanApiMutation } from "../../../services/threadsApi";

import { useToast } from "../../../hooks/useToast";
import {
  useLazyGetAgentsBySeachQuery,
  useLazyGetDepartmentBySeachQuery,
} from "../../../services/agentServices";
import SingleValueAsynAutocomplete from "../../../components/reusable/SingleValueAsynAutocomplete";
import CustomToolTip from "../../../reusable/CustomToolTip";
import { Close } from "@mui/icons-material";
import { useTicketsLayout } from "../../../contextApi/TicketsLayoutContext";

// Priority/Status/Agent dropdown options
interface PriorityOption {
  label: string;
  value: string;
  color: string;
  key: string;
}

interface StatusOption {
  label: string;
  value: string;
}

const Tickets: React.FC = () => {
  const navigate = useNavigate();
 const location = useLocation();
  const [sortBy, setSortBy] = useState("Sort By");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [masterChecked, setMasterChecked] = useState(false);
  const [dept, setDept] = useState<any>("");
  const { showToast } = useToast();
  const [triggerDept, { isLoading: deptLoading }] =
    useLazyGetDepartmentBySeachQuery();
  const [triggerStatus, { isLoading: statusLoading }] = useCommanApiMutation();
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortType, setSortType] = useState<string | null>(null);
  const { filtersOpen, setFiltersOpen, addTicketTab } = useTicketsLayout();
  // Sorting popover state
  const [sortingPopoverAnchorEl, setSortingPopoverAnchorEl] =
    useState<HTMLElement | null>(null);
  const [sortingPopoverOpen, setSortingPopoverOpen] = useState(false);
  const [userPopupAnchorEl, setUserPopupAnchorEl] =
    useState<HTMLElement | null>(null);
  const [userPopupUser, setUserPopupUser] = useState<any>(null);
  const userPopupTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isSpamModal, setIsSpamModal] = useState(false);
  const [agentValue, setAgentValue] = useState<any>(null);

  const [trackTicketId, setTrackTicketId] = useState("");
  const [quickUpdateAnchorEl, setQuickUpdateAnchorEl] = useState<any>(false);
  const [quickUpdateValues, setQuickUpdateValues] = useState({
    priority: "",
    status: "",
  });
  const [triggerSeachAgent, { isLoading: seachAgentLoading }] =
    useLazyGetAgentsBySeachQuery();
  const [commanApi] = useCommanApiMutation();
  const [loadingImportantTickets, setLoadingImportantTickets] = useState<
    Set<string>
  >(new Set());

  // Ref for the popup to handle click outside
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickUpdateAnchorEl &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-testid="more-vert-button"]')
      ) {
        handleQuickUpdateClose();
      }
    };

    if (quickUpdateAnchorEl) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickUpdateAnchorEl]);

  // Fetch live priority list
  const { data: priorityList } = useGetPriorityListQuery();
  const { data: statusList } = useGetStatusListQuery();
  const STATUS_OPTIONS: StatusOption[] =
    statusList?.map((item: any) => ({
      label: item.name,
      value: item.key,
    }));

  const { data: sortingOptions } = useGetTicketSortingOptionsQuery();
// Map API priorities to dropdown options
  const PRIORITY_OPTIONS: PriorityOption[] = (priorityList || []).map(
    (item: any) => ({
      label: item.specification,
      value: item.key,
      color: item.color,
      key: item?.key,
    })
  );

  // Resolve option value key by matching label text (case-insensitive)
  const resolveValueByLabel = (
    options: Array<{ label: string; value: string }>,
    label?: string
  ): string => {
    if (!label) return "";
    const found = options.find(
      (o) => o.label?.toLowerCase() === label?.toLowerCase()
    );
    return found?.value || "";
  };

  // Local UI overrides for tickets (do NOT mutate RTK Query cache objects)
  const [ticketOverrides, setTicketOverrides] = useState<Record<string, any>>(
    {}
  );

  // Merge helper: applies local overrides to a ticket object for rendering
  const applyOverrides = (ticket: any) => {
    const override = ticketOverrides[ticket?.ticketNumber];

    if (!override) return ticket;
    return {
      ...ticket,
      // override only the fields we care about for display
      status: override.status ?? ticket.status,
      priority: override.priority ?? ticket.priority,
      department: override.department ?? ticket.department,
      assignee: override.agent ?? ticket.assignee,
      important: override.important ?? ticket.important,
    };
  };

  const updateData = (updateValues: any) => {
    // updateValues example: { ticketId, status, priority, department, agent, ... }
    const ticketId = updateValues.ticketId || trackTicketId;
    if (!ticketId) return;
    setTicketOverrides((prev) => ({
      ...prev,
      [ticketId]: {
        ...(prev[ticketId] || {}),
        status: updateValues.status,
        priority: updateValues.priority,
        department: updateValues.department,
        assignee: updateValues.agent,
      },
    }));
  };

  const handleQuickUpdateProperty = () => {
    const payload = {
      url: "edit-properties/" + trackTicketId,
      method: "PUT",
      body: {
        ticket: trackTicketId,
        priority: quickUpdateValues.priority,
        status: quickUpdateValues.status,
        department:
          typeof dept?.deptID === "number"
            ? String(dept?.deptID)
            : dept?.deptID,
        agent: agentValue?.UserId,
      },
    };

    triggerStatus(payload)
      .unwrap()
      .then((res) => {
        if (!res?.success) {
          showToast(res?.message || res?.error?.message, "error");

          return;
        }
        if (res?.success) {
          showToast(res?.message, "success");
          setQuickUpdateValues({
            priority: quickUpdateValues.priority,
            status: quickUpdateValues.status,
          });
          // apply local UI overrides for immediate render without mutating cache
          setDept(res?.ticket?.department);
          setAgentValue(res?.ticket?.agent);
          updateData({
            ticketId: String(res?.ticket?.ticketId || trackTicketId),
            status: res?.ticket?.status,
            priority: res?.ticket?.priority,
            department: res?.ticket?.department,
            agent: res?.ticket?.agent ?? null,
          });
          handleQuickUpdateClose();
        }
      })
      .catch((err) => {
        showToast(err?.data?.message, "error");
        console.log(err);
        handleQuickUpdateClose();
      });
  };

  // Handle sorting popover open
  const handleSortingPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortingPopoverAnchorEl(event.currentTarget);
    setSortingPopoverOpen(true);
  };

  // Handle sorting popover close
  const handleSortingPopoverClose = () => {
    setSortingPopoverOpen(false);
    setSortingPopoverAnchorEl(null);
  };

  // Handle field change
  const handleFieldChange = (field: string) => {
    setSortingPopoverOpen(false);
    setSortingPopoverAnchorEl(null);
    setSortType(field);
    setSortBy(
      sortingOptions?.fields?.find((f: any) => f.key === field)?.text ||
        "Date created"
    );
    setPage(1); // Reset to first page
  };

  // Handle mode change
  const handleModeChange = (mode: string) => {
    setSortOrder(mode);
    setPage(1); // Reset to first page
  };
  // Restore getApiParams for ticket list API
  const getApiParams = () => {
    return {
      page,
      limit,
      obj: filters,
    };
  };
  const {
    data: ticketList,
    isFetching: isTicketListFetching,
    refetch,
  } = useGetTicketListQuery(getApiParams());
  const sortingParams = sortType
    ? { type: sortType, order: sortOrder, page, limit }
    : undefined;
  const { data: sortedTicketList, isFetching: isSortedTicketListFetching } =
    useGetTicketListSortingQuery(
      sortingParams as {
        type: string;
        order: string;
        page: number;
        limit: number;
      },
      { skip: !sortType }
    );

  const ticketsToShow = sortType ? sortedTicketList : ticketList;
  const isTicketsFetching = sortType
    ? isSortedTicketListFetching
    : isTicketListFetching;

  // Handle filter apply
  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Handle master checkbox change
  const handleMasterCheckbox = () => {
    if (selectedTickets.length === ticketsToShow?.data?.length) {
      setSelectedTickets([]);
      setMasterChecked(false);
    } else {
      setSelectedTickets(
        ticketsToShow?.data?.map((t: any) => t.ticketNumber) || []
      );
      setMasterChecked(true);
    }
  };

  const handleIndividualCheck = (ticketNumber: string) => {
    if (selectedTickets.includes(ticketNumber)) {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketNumber));
    } else {
      setSelectedTickets([...selectedTickets, ticketNumber]);
    }
  };

  // Update master checkbox if all/none selected
  React.useEffect(() => {
    if (!ticketsToShow?.data) return;
    setMasterChecked(
      ticketsToShow.data.length > 0 &&
        selectedTickets.length === ticketsToShow.data.length
    );
  }, [selectedTickets, ticketsToShow]);

  // Handle user popup hover with delayuseC
  const handleUserHover = (event: React.MouseEvent<HTMLElement>, user: any) => {
    if (userPopupTimer.current) {
      clearTimeout(userPopupTimer.current);
      userPopupTimer.current = null;
    }
    setUserPopupAnchorEl(event.currentTarget);
    setUserPopupUser(user);
  };

  const handleUserLeave = () => {
    userPopupTimer.current = setTimeout(() => {
      setUserPopupAnchorEl(null);
      setUserPopupUser(null);
    }, 500); // 0.5 second delay
  };

  const handlePopupEnter = () => {
    if (userPopupTimer.current) {
      clearTimeout(userPopupTimer.current);
      userPopupTimer.current = null;
    }
  };

  const handlePopupLeave = () => {
    setUserPopupAnchorEl(null);
    setUserPopupUser(null);
  };

  // When a ticket is opened, update tabs and navigate to detail view
  const handleTicketSubjectClick = (ticket: any) => {
    if (!ticket?.ticketNumber) return;
    addTicketTab({
      ticketNumber: String(ticket.ticketNumber),
      subject: ticket.subject || ticket.topic || "Untitled ticket",
      requester:
        ticket?.fromUser?.name ||
        ticket?.requester?.name ||
        ticket?.assignee?.name ||
        "",
      status: ticket?.status?.name,
    });
    navigate(`/tickets/${ticket.ticketNumber}`);
  };

  React.useEffect(() => {
    return () => {
      if (userPopupTimer.current) {
        clearTimeout(userPopupTimer.current);
      }
    };
  }, []);

  const handleDelete = () => {
    if (selectedTickets.length < 0) {
      return;
    }
    const payload = {
      url: "delete-ticket",
      body: { ids: selectedTickets },
    };

    commanApi(payload);
  };

  const handleSpam = () => {
    if (selectedTickets.length <= 0) {
      return;
    }
    setIsSpamModal(false);
    const payload = {
      url: "spam-ticket",
      body: { ids: selectedTickets },
    };

    commanApi(payload);
  };

  // Quick update handlers
  const handleQuickUpdateOpen = (
    event: React.MouseEvent<HTMLElement>,
    ticket: any
  ) => {
    event.stopPropagation();
    const merged = applyOverrides(ticket);

    setTrackTicketId(merged?.ticketNumber);
    setQuickUpdateAnchorEl(true);
    setQuickUpdateValues({
      // Map by label when key is absent in ticket object
      priority:
        merged.priority?.key ||
        resolveValueByLabel(PRIORITY_OPTIONS, merged.priority?.name),
      status:
        merged.status?.key ||
        resolveValueByLabel(STATUS_OPTIONS as any, merged.status?.name),
    });
    // Set agent value as an object if assignee exists, otherwise null
    setAgentValue(
      merged.assignee
        ? {
            Name: merged.assignee.name,
            UserId: merged.assignee.id || merged.assignee.userID,
          }
        : null
    );

    setDept(merged?.department?.deptId || merged?.department?.name || "");
  };

  const handleQuickUpdateClose = () => {
    setQuickUpdateAnchorEl(null);
    setTrackTicketId("");
  };

  const handleQuickUpdateChange = (field: string, value: string) => {
    setQuickUpdateValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle toggle important status
  const handleToggleImportant = (ticket: any) => {
    const merged = applyOverrides(ticket);
    const newImportantStatus = !merged.important;

    // Add ticket to loading set
    setLoadingImportantTickets((prev) =>
      new Set(prev).add(merged.ticketNumber)
    );

    const payload = {
      url: `edit-property/${merged.ticketNumber}?important=${newImportantStatus}`,
      method: "PUT",
    };

    commanApi(payload)
      .then((res: any) => {
        // Remove ticket from loading set
        setLoadingImportantTickets((prev) => {
          const newSet = new Set(prev);
          newSet.delete(merged.ticketNumber);
          return newSet;
        });

        if (res?.data?.type === "error") {
          showToast(res?.message || res?.data?.message, "error");
          return;
        }
        if (res?.data?.type === "success") {
          showToast(
            res?.message || res?.data?.message,
            "success",
            "borderToast"
          );
        }

        // Only update UI after successful API response
        if (res?.data?.updatedFields?.important !== undefined) {
          setTicketOverrides((prev) => ({
            ...prev,
            [merged.ticketNumber]: {
              ...(prev[merged.ticketNumber] || {}),
              important: res.data.updatedFields.important,
            },
          }));
        } else {
          // Fallback: update with the expected value if server response doesn't include it
          setTicketOverrides((prev) => ({
            ...prev,
            [merged.ticketNumber]: {
              ...(prev[merged.ticketNumber] || {}),
              important: newImportantStatus,
            },
          }));
        }
      })
      .catch(() => {
        // Remove ticket from loading set on error
        setLoadingImportantTickets((prev) => {
          const newSet = new Set(prev);
          newSet.delete(merged.ticketNumber);
          return newSet;
        });
        showToast("Failed to update ticket importance", "error");
      });
  };

  const renderProperties = (
    <Paper
      elevation={0}
      sx={{
        border: "2px solid #7297b5",
        boxShadow: "none",
        maxWidth: 400,
        minWidth: 380,
        position: "relative",
        overflow: "visible",
        backgroundColor: "#e8f2ff",
        // borderRadius: 10,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 ">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <QuickreplyIcon fontSize="small" className="text-gray-700" />
            <h3
              className="text-lg font-semibold text-gray-700"
              style={{ lineHeight: "normal" }}
            >
              Quick Update
              <span
                className="text-gray-500"
                style={{ fontSize: "0.6rem", display: "block" }}
              >
                Update properties of ticket #{trackTicketId}
              </span>
            </h3>
          </div>
          <IconButton
            size="small"
            onClick={handleQuickUpdateClose}
            className="text-gray-400"
          >
            <Close fontSize="small" />
          </IconButton>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Priority
            </label>
            <FormControl fullWidth size="small" variant="outlined">
              <Select
                value={quickUpdateValues.priority || ""}
                onChange={(e) =>
                  handleQuickUpdateChange("priority", e.target.value)
                }
                displayEmpty
                MenuProps={{
                  disablePortal: false,
                  slotProps: {
                    paper: { sx: { zIndex: 200000 } },
                    root: { sx: { zIndex: 200000 } },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9ca3af",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2566b0",
                    },
                  },
                }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      ></div>
                      <span className="text-gray-700">{option.label}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <FormControl fullWidth size="small" variant="outlined">
              <Select
                value={quickUpdateValues.status}
                onChange={(e) =>
                  handleQuickUpdateChange("status", e.target.value)
                }
                displayEmpty
                MenuProps={{
                  disablePortal: false,
                  slotProps: {
                    paper: { sx: { zIndex: 200000 } },
                    root: { sx: { zIndex: 200000 } },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9ca3af",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2566b0",
                    },
                  },
                }}
              >
                {STATUS_OPTIONS?.map((option) => (
                  <MenuItem key={option?.value} value={option?.value}>
                    <span className="text-gray-700">{option?.label}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Groups */}
          <SingleValueAsynAutocomplete
            value={dept}
            label="Department"
            qtkMethod={triggerDept}
            onChange={setDept}
            loading={deptLoading}
            showIcon={false}
            size="small"
            optionLabelKey="deptName"
          />

          <SingleValueAsynAutocomplete
            value={agentValue?.Name}
            label="Assignee"
            qtkMethod={triggerSeachAgent}
            onChange={setAgentValue}
            loading={seachAgentLoading}
            showIcon={false}
            renderOptionExtra={(user) => (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}
            size="small"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="text"
            size="small"
            onClick={handleQuickUpdateClose}
            sx={{ minWidth: 80, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleQuickUpdateProperty}
            sx={{
              textTransform: "none",
              backgroundColor: "#2566b0",
              "&:hover": {
                backgroundColor: "#2563eb",
              },
            }}
          >
            {statusLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </div>
    </Paper>
  );

  // Card-style ticket rendering
  const renderTicketCard = (ticket: any) => {
    const merged = applyOverrides(ticket);
    // Get priority color and label - use actual API data
    const priorityColor = merged.priority?.color || "#6b7280"; // Default gray
    const priorityLabel = merged.priority?.name || "Low";
    return (
      <div
        key={merged?.ticketNumber}
        className="w-full min-w-[300px]  bg-white border-2 border-[#e8eaec] rounded-xl mb-4 p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer relative hover:bg-[#f6f8fb]"
        onClick={() => handleTicketSubjectClick(merged)}
      >
        {/* Top section */}
        <div className="flex gap-4 mb-3">
          {/* Left column: Priority badge and ticket number */}
          <div className="flex flex-col items-start gap-1">
            <div
              className="px-3 py-1 text-xs font-bold rounded text-white"
              style={{ backgroundColor: priorityColor }}
            >
              {priorityLabel.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">
              #{merged?.ticketNumber || ""}
            </span>
          </div>

          {/* Right column: Title and description */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs">{merged?.topic}</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-medium text-gray-900">
                    {merged?.subject || ""}
                  </h3>
                  <span className="text-gray-400 text-sm">
                    ({merged?.stats?.totalThreads || 0})
                  </span>
                  <span className="text-sm text-gray-500">
                    {merged?.lastupdate?.timeAgo || ""}
                  </span>
                </div>
              </div>
              <CustomToolTip
                title={renderProperties}
                open={
                  merged?.ticketNumber === trackTicketId && quickUpdateAnchorEl
                }
                disableHoverListener
                placement={"top-end"}
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleQuickUpdateOpen(e, merged)}
                  className="text-gray-400 hover:text-gray-600 "
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </CustomToolTip>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {typeof merged.description === "string"
                ? merged.description
                : merged.body || ""}
            </p>
          </div>
        </div>

        {/* Divider line */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Bottom section with counts and user info */}
        <div className="flex overflow-x-auto custom-scrollbar items-center gap-8 text-xs">
          <div>
            <Checkbox
              checked={selectedTickets.includes(merged?.ticketNumber)}
              onClick={(e) => {
                e.stopPropagation();
                handleIndividualCheck(merged?.ticketNumber);
              }}
              aria-label="Select ticket"
              sx={{
                color: "#666",
                "&.Mui-checked": {
                  color: "#2566b0",
                },
                zIndex: 99,
                "&:hover": {
                  backgroundColor: "rgba(26, 115, 232, 0.04)",
                },
              }}
              size="small"
            />

            {/* Important Pin */}
            <Tooltip
              title={
                merged?.important
                  ? "Remove from important"
                  : "Mark as important"
              }
              placement="right"
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleImportant(ticket);
                }}
                className={
                  merged?.important
                    ? "hover:text-[#1976d2]"
                    : "hover:text-[#1976d2]"
                }
              >
                {loadingImportantTickets.has(merged.ticketNumber) ? (
                  <CircularProgress size={20} color="inherit" />
                ) : merged?.important ? (
                  <PushPinIcon fontSize="small" sx={{ color: "#1976d2" }} />
                ) : (
                  <PushPinOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </div>

          {/* Separator */}
          <div className="text-gray-500">|</div>

          {/* Assignee */}
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide text-gray-500 mt-0.5"
            >
              <path d="M2 21a8 8 0 0 1 13.292-6" />
              <circle cx="10" cy="8" r="5" />
              <path d="m16 19 2 2 4-4" />
            </svg>

            <div className="flex flex-col">
              <span className="text-gray-500 mb-1">Assignee</span>
              <span className="text-gray-800 font-semibold">
                {merged?.assignee?.name || "~"}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="text-gray-500">|</div>

          {/* Raised by */}

          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide text-gray-500 mt-0.5"
            >
              <path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />
              <path d="M8 15H7a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
            </svg>

            <div className="flex flex-col">
              <span className="text-gray-500 mb-1">raised by</span>

              <span
                className="text-gray-800 font-semibold cursor-pointer hover:underline decoration-dotted"
                onMouseEnter={(e) => handleUserHover(e, merged.fromUser)}
                onMouseLeave={handleUserLeave}
              >
                {merged?.fromUser?.name || ""}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="text-gray-500">|</div>

          {/* Department */}
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide text-gray-500 mt-0.5"
            >
              <path d="M12 10h.01" />
              <path d="M12 14h.01" />
              <path d="M12 6h.01" />
              <path d="M16 10h.01" />
              <path d="M16 14h.01" />
              <path d="M16 6h.01" />
              <path d="M8 10h.01" />
              <path d="M8 14h.01" />
              <path d="M8 6h.01" />
              <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
              <rect x="4" y="2" width="16" height="20" rx="2" />
            </svg>

            <div className="flex flex-col">
              <span className="text-gray-500 mb-1">Department</span>
              <span className="text-gray-800 font-semibold">
                {merged?.department?.name || "Support"}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="text-gray-300">|</div>

          {/* Status */}
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide text-gray-500 mt-0.5"
            >
              <path d="M16 7h6v6" />
              <path d="m22 7-8.5 8.5-5-5L2 17" />
            </svg>

            <div className="flex flex-col">
              <span className="text-gray-500 mb-1">Status</span>
              <span className="text-gray-800 font-semibold">
                {merged?.status?.name || "Review"}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="text-gray-500">|</div>

          {/* Due Date */}
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide text-gray-500 mt-0.5"
            >
              <path d="M16 14v2.2l1.6 1" />
              <path d="M16 2v4" />
              <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
              <path d="M3 10h5" />
              <path d="M8 2v4" />
              <circle cx="16" cy="16" r="6" />
            </svg>

            <div className="flex flex-col">
              <span className="text-gray-500 mb-1">Due Date</span>
              <span className="text-gray-800 font-semibold">
                {`${merged?.due?.dt}  ${merged?.due?.tm}` || "~"}
              </span>
            </div>
          </div>

          {/* Red dot at the end */}
          {merged?.due.isDue && (
            <Tooltip title={`${merged?.due?.msg}`}>
              <div className="w-3 h-3 bg-red-500 rounded-full ml-auto" />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`flex flex-col bg-[#f5f5f5] ${location.pathname === "/tickets" ||location.pathname.startsWith("/tickets/") ? " h-[calc(100vh-125px)]" : "h-[calc(100vh-98px)]"} `}>
        <div className="flex items-center justify-between px-2 py-1 border border-[#e8eaec] bg-[#e8eaec] shadow-sm">
          {/* Left: Title, master checkbox, count, and action buttons (inline) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Checkbox
              checked={masterChecked}
              onChange={handleMasterCheckbox}
              aria-label="Select all tickets"
              sx={{
                color: "#666",
                "&.Mui-checked": {
                  color: "#2566b0",
                },
                "&:hover": {
                  backgroundColor: "rgba(26, 115, 232, 0.04)",
                },
              }}
            />
            <h3 className="text-md font-medium text-gray-900">All tickets</h3>
            <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-1 text-xs font-medium">
              {ticketsToShow?.data?.length || 0}
            </span>
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-2 ml-4 flex-wrap">
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  startIcon={
                    <ReportProblemIcon
                      fontSize="small"
                      sx={{ color: "#ed6c02" }}
                    />
                  }
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                  onClick={() => setIsSpamModal(true)}
                >
                  Spam
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  color="inherit"
                  startIcon={
                    <DeleteIcon fontSize="small" sx={{ color: "#d32f2f" }} />
                  }
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                  onClick={() => setIsDeleteModal(true)}
                >
                  Delete
                </Button>
              </div>
            )}
            {selectedTickets.length === 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="contained"
                  size="small"
                  color="inherit"
                  onClick={handleSortingPopoverOpen}
                  endIcon={<FilterAltOutlinedIcon fontSize="small" />}
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {sortBy}
                </Button>

                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => refetch()}
                  disabled={isTicketsFetching}
                  sx={{
                    ml: 1,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 4px rgba(202, 202, 202, 0.8)",
                  }}
                  aria-label="Refresh"
                  title="Refresh"
                >
                  {isTicketsFetching ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>

                <TicketSortingPopover
                  anchorEl={sortingPopoverAnchorEl}
                  open={sortingPopoverOpen}
                  onClose={handleSortingPopoverClose}
                  fields={sortingOptions?.sort?.type || []}
                  modes={sortingOptions?.sort?.mode || []}
                  selectedField={sortType || ""}
                  selectedMode={sortOrder}
                  onFieldChange={handleFieldChange}
                  onModeChange={handleModeChange}
                />
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pagination */}
            {ticketList?.pagination && (
              <TablePagination
                component="div"
                count={ticketList.pagination.total}
                page={page - 1}
                onPageChange={(_, newPage) => setPage(newPage + 1)}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                rowsPerPageOptions={[10, 20, 30, 50, 100]}
                labelRowsPerPage=""
              />
            )}
            {/* + New Button */}
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/create-ticket")}
              sx={{
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                backgroundColor: "#1976d2",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
            >
              + New
            </Button>
            {/* Filters Icon Button */}
            <Button
              variant="contained"
              color="inherit"
              size="small"
              sx={{
                fontWeight: 600
              }}
              onClick={() => setFiltersOpen(!filtersOpen)}
              startIcon={<FilterListIcon fontSize="small" />}
              aria-label="Toggle Filters"
            >
              Filters
            </Button>
          </div>
        </div>
        {/* Main Content: Tickets + Filters */}
        <div className="flex flex-1 h-0 min-h-0">
     
          <div className="flex-1 min-w-60 h-full overflow-y-auto bg-gray-50 custom-scrollbar">
            <div className="max-w-8xl mx-auto">
              {isTicketsFetching ? (
                <TicketSkeleton />
              ) : (
                <div className="p-4">
                  {ticketsToShow && ticketsToShow?.data?.length > 0 ? (
                    <div>{ticketsToShow?.data?.map(renderTicketCard)}</div>
                  ) : (
                    // align middle center
                    <div className="flex flex-col justify-center items-center mt-10">
                      <img
                        src={emptyticketimg}
                        alt="No tickets"
                        className="w-[35%]"
                      />
                      <div className="text-gray-400 text-lg font-bold">
                        NO TICKETS FOUND
                      </div>
                      <div className="text-gray-500 text-sm font-bold">
                        You can try to{" "}
                        <span className="underline decoration-dotted">
                          adjusting
                        </span>{" "}
                        your{" "}
                        <span className="underline decoration-dotted">
                          filters
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {filtersOpen && (
            <div className="w-80 min-w-[200px] border-l bg-white flex flex-col h-full">
              <div className="flex-1 overflow-y-auto h-full">
                <TicketFilterPanel onApplyFilters={handleApplyFilters} />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* )} */}

      {/* User Hover Popup */}
      <UserHoverPopup
        open={Boolean(userPopupAnchorEl)}
        anchorEl={userPopupAnchorEl}
        onClose={handlePopupLeave}
        onMouseEnter={handlePopupEnter}
        onMouseLeave={handlePopupLeave}
        user={userPopupUser}
      />

      <ConfirmationModal
        open={isDeleteModal}
        onClose={() => setIsDeleteModal(false)}
        onConfirm={handleDelete}
        type="delete"
        message={`Are you sure you want to delete (${selectedTickets.length}) ticket?`}
        successMessage={`Successfully deleted (${selectedTickets.length}) tickets.`}
      />
      <ConfirmationModal
        open={isSpamModal}
        onClose={() => setIsSpamModal(false)}
        onConfirm={handleSpam}
        type="spam"
        title="Mark as Spam"
        message={`Are you sure you want to mark (${selectedTickets.length}) ticket as spam?`}
      />
    </>
  );
};

export default Tickets;
