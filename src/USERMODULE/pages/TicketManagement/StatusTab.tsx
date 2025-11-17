import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  useGetPriorityListQuery,
  useGetStatusListQuery,
  useGetTagListQuery,
  useGetTypeListQuery,
} from "../../../services/ticketAuth";
import {
  useLazyGetAgentsBySeachQuery,
  useLazyGetDepartmentBySeachQuery,
  useLazyTriggerGetSLAListQuery,
} from "../../../services/agentServices";

import { useToast } from "../../../hooks/useToast";
import { useCommanApiMutation } from "../../../services/threadsApi";
import SingleValueAsynAutocomplete from "../../../components/reusable/SingleValueAsynAutocomplete";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useDebounce } from "../../../hooks/useDebounce";

const StatusTab = ({ ticket }: any) => {
  const { showToast } = useToast();
  const [tagValue, setTagValue] = useState<any[]>([]);
  const [changeTagValue, setChangeTabValue] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [sla, setSLA] = useState<any>("");
  const [status, setStatus] = useState<any>("");
  const [dept, setDept] = useState<any>("");
  const [agent, setAgent] = useState<any>("");
  const [options, setOptions] = useState<any>([]);
  const [dueDate, setDueDate] = useState<any>("");
  const [isUpdate, setIsUpdate] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const initialSnapshotRef = useRef<any>(null);
  const { data: tagList } = useGetTagListQuery();
  const { data: priorityList } = useGetPriorityListQuery();
  const { data: statusList } = useGetStatusListQuery();
  const { data: typeList } = useGetTypeListQuery();
  const [triggerDept, { isLoading: deptLoading }] =
    useLazyGetDepartmentBySeachQuery();
  const [triggerSeachAgent, { isLoading: seachAgentLoading }] =
    useLazyGetAgentsBySeachQuery();
  const [triggerStatus, { isLoading: statusLoading }] = useCommanApiMutation();
  const displayOptions = changeTagValue.length >= 3 ? options : [];
  const [triggerSLA] = useLazyTriggerGetSLAListQuery();
  const [inputValue, setInputValue] = useState("");
  const [slaOptions, setSlaOptions] = useState<any[]>([]);
  const [isSlaLoading, setIsSlaLoading] = useState(false);
  const debouncedValue: any = useDebounce(inputValue, 500);

  const getSlaKey = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") return value.key ?? "";
    return "";
  };

  const normalizeTags = (tags: any) => {
    if (!Array.isArray(tags)) return "";
    return tags
      .map((tag: any) => {
        if (typeof tag === "string") return tag;
        return tag?.tagID ?? tag?.id ?? "";
      })
      .filter((tag: any) => tag !== "" && tag !== null && tag !== undefined)
      .map((tag: any) => String(tag))
      .sort()
      .join("|");
  };

  const formatDueDateValue = (value: any) => {
    if (!value) return "";
    const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : "";
  };

  const buildSnapshotFromState = () => ({
    type: type || "",
    priority: priority || "",
    status: status || "",
    slaKey: getSlaKey(sla),
    deptId: dept?.deptID ?? "",
    agentId: agent?.agentID ?? "",
    tags: normalizeTags(tagValue),
    dueDate: formatDueDateValue(dueDate),
  });

  const formatDueDateForPayload = (value: any) => {
    if (!value) return undefined;
    const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
    if (!parsed.isValid()) return undefined;
    return parsed.format("YYYY-MM-DD HH:mm:00");
  };

  const buildSnapshotFromTicket = (ticketData: any) => ({
    type: ticketData?.type?.key ?? "",
    priority: ticketData?.priority?.key ?? "",
    status: ticketData?.status?.key ?? "",
    slaKey: getSlaKey(ticketData?.sla),
    deptId: ticketData?.deptName?.key ?? "",
    agentId: ticketData?.assignee?.agentID ?? "",
    tags: normalizeTags(ticketData?.tags),
    dueDate: formatDueDateValue(ticketData?.dueDate),
  });

  const areSnapshotsEqual = (a: any, b: any) => {
    if (!a || !b) return false;
    return (
      a.type === b.type &&
      a.priority === b.priority &&
      a.status === b.status &&
      a.slaKey === b.slaKey &&
      a.deptId === b.deptId &&
      a.agentId === b.agentId &&
      a.tags === b.tags &&
      a.dueDate === b.dueDate
    );
  };

  const handleUpdateTicket = () => {
    const payload = {
      url: "edit-properties/" + ticket?.ticketId,
      method: "PUT",
      body: {
        ticket: ticket?.ticketId,
        sla: sla.key,
        type: type,
        priority: priority,
        status: status,
        tags: tagValue.map((tag: any) => tag?.tagID),
        department: `${dept.deptID}`,
        agent: agent.agentID,
        duedate: formatDueDateForPayload(dueDate),
      },
    };

    triggerStatus(payload)
      .unwrap()
      .then((res) => {
        if (!res?.success) {
          showToast(res?.message || res?.error?.message, "error");
          setIsUpdate((prev) => prev + 1);
          return;
        }
        if (res?.success) {
          showToast(res?.message || res?.error?.message, "success");
          initialSnapshotRef.current = buildSnapshotFromState();
          setIsDirty(false);
        }
      })
      .catch((err) => {
        showToast(err?.data?.message, "error");
        setIsUpdate((prev) => prev + 1);
      });
  };

  useEffect(() => {
    if (ticket) {
      const initialTags = Array.isArray(ticket.tags) ? [...ticket.tags] : [];
      const initialStatus = ticket?.status?.key ?? "";
      const initialPriority = ticket?.priority?.key ?? "";
      const initialType = ticket?.type?.key ?? "";
      const initialDept = ticket?.deptName
        ? {
            deptID: ticket?.deptName?.key,
            deptName: ticket?.deptName?.name,
          }
        : "";
      const initialSla = ticket?.sla ?? "";
      const initialAgent = ticket?.assignee ?? "";
      const initialDueDate = ticket?.dueDate ? dayjs(ticket.dueDate) : "";

      setTagValue(initialTags);
      setStatus(initialStatus);
      setPriority(initialPriority);
      setType(initialType);
      setDept(initialDept);
      setSLA(initialSla);
      setAgent(initialAgent);
      setDueDate(initialDueDate);

      initialSnapshotRef.current = buildSnapshotFromTicket(ticket);
      setIsDirty(false);
    }
  }, [ticket, isUpdate]);

  const fetchOptions = (value: string) => {
    if (!value || value.length < 3) return [];
    const filteredOptions = tagList?.filter((option: any) =>
      option.tagName?.toLowerCase().includes(value?.toLowerCase())
    );
    return filteredOptions || [];
  };

  useEffect(() => {
    if (changeTagValue.length >= 3) {
      const filterValue: any = fetchOptions(changeTagValue);
      setOptions(filterValue);
    } else {
      setOptions([]);
    }
  }, [changeTagValue, tagList]);

  useEffect(() => {
    if (!initialSnapshotRef.current) return;
    const currentSnapshot = buildSnapshotFromState();
    const hasChanges = !areSnapshotsEqual(
      initialSnapshotRef.current,
      currentSnapshot
    );
    setIsDirty(hasChanges);
  }, [type, priority, status, sla, dept, agent, dueDate, tagValue]);

  const handleSelectedOption = (_: any, newValue: any, type: string) => {
    if (type === "tag") {
      if (!Array.isArray(newValue) || newValue.length === 0) {
        showToast("Tag already exists", "error");
        return;
      }

      setTagValue((prev) => {
        // Find newly added tags (those not already in prev)
        const addedTags = newValue.filter(
          (tag: any) => !prev.some((p) => p.tagID === tag.tagID)
        );

        if (addedTags.length === 0) {
          // No new tags (all duplicates)
          showToast("Tag already exists", "error");
          return prev;
        }

        return [...prev, ...addedTags];
      });
    }
  };

  const handleOnChange = (newValue: any) => {
    setSLA(newValue);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      if (!debouncedValue) {
        setSlaOptions([]);
        setIsSlaLoading(false);
        return;
      }

      if (!dept?.deptID || !priority) {
        setSlaOptions([]);
        setIsSlaLoading(false);
        return;
      }

      const decoded = decodeURIComponent(debouncedValue);
      const value = decoded.replace(/\D/g, "");
      const valueInNumber = Number(value);

      if (isNaN(valueInNumber)) {
        showToast("Please enter a valid Key of SLA.", "error");
        setIsSlaLoading(false);
        return;
      }

      setIsSlaLoading(true);

      try {
        const res = await triggerSLA({
          search: value,
          department: dept.deptID,
          priority: priority,
        }).unwrap();

        const data = Array.isArray(res) ? res : res?.data;

        if (Array.isArray(data) && data.length > 0) {
          setSlaOptions(data);
        } else {
          setSlaOptions([]);
        }
      } catch (error) {
        console.error("SLA fetch error:", error);
        setSlaOptions([]);
      } finally {
        setIsSlaLoading(false);
      }
    };

    fetchOptions();
  }, [debouncedValue, triggerSLA, dept?.deptID, priority]);

  return (
    <div className="w-full h-[calc(100vh-100px)] overflow-hidden bg-[#ededed]">
      <div className="w-full min-h-[calc(100vh-265px)] max-h-[calc(100vh-265px)] overflow-y-auto custom-scrollbar">
        <div className="w-full space-y-3 p-2 sm:p-3">
          <Typography variant="subtitle1">Properties</Typography>

          <div>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: { xs: "11px", sm: "13px" }, mb: 0.5 }}
            >
              Type
            </Typography>
            {!ticket ? (
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{
                  backgroundColor: "#e0e0e0",
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                    "100%": { opacity: 1 },
                  },
                }}
              />
            ) : (
              <Select
                variant="standard"
                fullWidth
                size="medium"
                value={type || ""}
                onChange={(e) => setType(e.target.value)}
                sx={{
                  fontSize: { xs: "10px", sm: "12px" },
                }}
              >
                {[...((typeList as any[]) || [])].map((name: any) => (
                  <MenuItem key={name.key} value={name.key}>
                    {name.typeName}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px" }}>
              Status
            </Typography>
            {!ticket ? (
              <Skeleton variant="rectangular" height={40} />
            ) : (
              <Select
                fullWidth
                variant="standard"
                size="medium"
                value={status || ""}
                onChange={(e) => setStatus(e.target.value)}
                sx={{
                  fontSize: { xs: "10px", sm: "12px" },
                }}
              >
                {statusList?.map((status: any) => (
                  <MenuItem key={status.key} value={status.key}>
                    {status?.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>

          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px" }}>
              Priority
            </Typography>
            {!ticket ? (
              <Skeleton variant="rectangular" height={40} />
            ) : (
              <Select
                fullWidth
                variant="standard"
                size="medium"
                value={priority || ""}
                defaultValue=""
                onChange={(e) => setPriority(e.target.value)}
                sx={{
                  fontSize: { xs: "10px", sm: "12px" },
                }}
              >
                {[...((priorityList as any[]) || [])]?.map((priority: any) => (
                  <MenuItem key={priority?.key} value={priority?.key}>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: { xs: "10px", sm: "12px" },
                      }}
                    >
                      <span
                        className="w-3 h-3 inline-block"
                        style={{ backgroundColor: priority.color || "#cccccc" }}
                      />
                      {priority?.specification}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px" }}>
              SLA
            </Typography>
            {!ticket ? (
              <Skeleton variant="rectangular" height={40} />
            ) : (
              <Autocomplete
                disableClearable
                popupIcon={null}
                disablePortal={false}
                slotProps={{
                  popper: {
                    sx: { zIndex: 200000 },
                  },
                }}
                value={sla}
                options={slaOptions}
                loading={isSlaLoading}
                getOptionLabel={(option: any) => {
                  if (typeof option === "string") return option;
                  return `${option?.hrs} : ${option?.graceMinutes}`;
                }}
                onChange={(_, newVal: any) => handleOnChange(newVal)}
                onInputChange={(_, newVal) => setInputValue(newVal)}
                filterOptions={(x) => x}
                noOptionsText="No Data Found"
                renderOption={(props, option: any) => (
                  <li {...props} key={option?.key}>
                    <div className="flex flex-col">
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: "12px", sm: "14px" },
                        }}
                      >
                        {`${option?.hrs} : ${option?.graceMinutes}`}
                      </Typography>
                    </div>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    variant="standard"
                    sx={{
                      // For single select selected value
                      "& .MuiAutocomplete-inputRoot": {
                        "& .MuiAutocomplete-input": {
                          fontSize: { xs: "14px", sm: "12px" }, // selected value font size
                        },
                      },
                      // For multiple select chips
                      "& .MuiChip-root": {
                        fontSize: { xs: "12px", sm: "14px" },
                        height: { xs: 24, sm: 28 },
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,

                      endAdornment: (
                        <>
                          {isSlaLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          </div>
          <div>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: { xs: "11px", sm: "13px" }, mb: 0.5 }}
            >
              Due Date
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={dueDate || null}
                onChange={(newValue: any) => {
                  if (newValue && newValue.isBefore(dayjs())) return;

                  setDueDate(newValue); // store Day.js object
                }}
                minDateTime={dayjs()}
                maxDateTime={dayjs().add(7, "day")}
                shouldDisableDate={(date) => {
                  // Disable dates before today and after 7 days from today
                  return (
                    date.isBefore(dayjs(), "day") ||
                    date.isAfter(dayjs().add(7, "day"), "day")
                  );
                }}
                shouldDisableTime={(value, view) => {
                  const now = dayjs();
                  const selectedDate = dayjs(value);

                  if (view === "minutes") {
                    // Only disable past minutes for current hour on today
                    if (
                      selectedDate.isSame(now, "day") &&
                      selectedDate.isSame(now, "hour")
                    ) {
                      return value.minute() < now.minute();
                    }
                  }

                  return false;
                }}
                openTo="day"
                views={["year", "month", "day", "hours", "minutes"]}
                timeSteps={{ hours: 1, minutes: 15 }}
                slotProps={{
                  textField: {
                    variant: "standard",
                    fullWidth: true,
                    size: "small",
                    name: "Due Date",
                    placeholder: "DD/MM/YYYY HH:mm",
                    InputProps: {
                      sx: {
                        "&:before": {
                          borderBottom: "none !important", // normal state
                        },
                        "&:hover:before": {
                          borderBottom: "none !important", // hover state
                        },
                        "&:after": {
                          borderBottom: "none !important", // focused state
                        },
                        "&.Mui-focused:after": {
                          borderBottom: "none !important", // focused state
                        },
                        "&.Mui-focused:before": {
                          borderBottom: "none !important", // focused state
                        },
                        "& .MuiInputBase-input": {
                          fontSize: "10px !important",
                          padding: "8px 0 !important",
                        },
                      },
                    },
                  },
                  actionBar: {
                    actions: ["clear", "cancel", "accept"],
                    sx: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: { xs: "8px 16px", sm: "12px 24px" },
                      "& .MuiPickersActionBar-actionButton:first-of-type": {
                        marginRight: "auto",
                      },
                      "& .MuiPickersActionBar-actionButton": {
                        fontSize: { xs: "0.75rem", sm: "0.775rem" },
                        padding: { xs: "6px 12px", sm: "8px 16px" },
                      },
                    },
                  },
                  popper: {
                    sx: {
                      zIndex: 1300,
                      position: { xs: "fixed !important", sm: "absolute" },
                      top: { xs: "50% !important", sm: "auto" },
                      left: { xs: "50% !important", sm: "auto" },
                      transform: {
                        xs: "translate(-50%, -50%) !important",
                        sm: "none",
                      },
                      // width: { xs: '90vw !important', sm: 'auto' },
                      // maxWidth: { xs: '400px !important', sm: 'none' },
                      maxHeight: { xs: "80vh !important", sm: "none" },
                      margin: { xs: "0 !important", sm: "auto" },
                      borderRadius: { xs: "12px !important", sm: "8px" },
                      boxShadow: {
                        xs: "0 20px 40px rgba(0,0,0,0.3) !important",
                        sm: "0 4px 20px rgba(0,0,0,0.15)",
                      },
                      "& .MuiPaper-root": {
                        position: { xs: "fixed !important", sm: "absolute" },
                        top: { xs: "50% !important", sm: "auto" },
                        left: { xs: "50% !important", sm: "auto" },
                        transform: {
                          xs: "translate(-50%, -50%) !important",
                          sm: "none",
                        },
                        // width: { xs: '90vw !important', sm: 'auto' },
                        // maxWidth: { xs: '400px !important', sm: 'none' },
                        maxHeight: { xs: "80vh !important", sm: "none" },
                        margin: { xs: "0 !important", sm: "auto" },
                        borderRadius: { xs: "12px !important", sm: "8px" },
                        boxShadow: {
                          xs: "0 20px 40px rgba(0,0,0,0.3) !important",
                          sm: "0 4px 20px rgba(0,0,0,0.15)",
                        },
                      },
                    },
                  },
                }}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
              />
            </LocalizationProvider>
          </div>

          <Divider />
          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px", mb: 0.5 }}>
              Department
            </Typography>
            {!ticket ? (
              <Skeleton variant="rectangular" height={40} />
            ) : (
              <SingleValueAsynAutocomplete
                value={dept}
                qtkMethod={triggerDept}
                onChange={setDept}
                loading={deptLoading}
                isFallback={true}
                variant={"standard"}
                size="small"
                showIcon={false}
                optionLabelKey="deptName"
                placeholder="Select Department"
              />
            )}
          </div>
          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px", mb: 0.5 }}>
              Agent
            </Typography>
            {!ticket ? (
              <Skeleton variant="rectangular" height={40} />
            ) : (
              <SingleValueAsynAutocomplete
                value={agent}
                // label="Assignee"
                qtkMethod={triggerSeachAgent}
                onChange={setAgent}
                loading={seachAgentLoading}
                variant={"standard"}
                size="small"
                showIcon={false}
                placeholder="Select Agent"
                optionLabelKey="name"
              />
            )}
          </div>
          <Divider />
          <div>
            <Typography variant="subtitle1" sx={{ fontSize: "13px" }}>
              Tags
            </Typography>
            <Autocomplete
              multiple
              disableClearable
              popupIcon={null}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option.tagName || option.name || "";
              }}
              options={displayOptions}
              value={tagValue}
              onChange={(event, newValue) => {
                handleSelectedOption(event, newValue, "tag");
              }}
              onInputChange={(_, value) => setChangeTabValue(value)}
              filterOptions={(x) => x}
              getOptionDisabled={(option) => option === "Type to search"}
              noOptionsText={
                changeTagValue.length < 3
                  ? "Type at least 3 characters to search"
                  : "No tags found"
              }
              ListboxProps={{ className: "custom-scrollbar" }}
              renderOption={(props, option) => {
                return (
                  <li {...props}>
                    {typeof option === "string" ? (
                      option
                    ) : (
                      <div
                        className="flex items-center gap-3 p-1 rounded-md w-full "
                        style={{ cursor: "pointer" }}
                      >
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {option.tagName}
                          </Typography>
                        </div>
                      </div>
                    )}
                  </li>
                );
              }}
              renderTags={(editTags, getTagProps) =>
                editTags?.map((option, index) => (
                  <Chip
                    key={index}
                    label={
                      typeof option === "string"
                        ? option
                        : option.name ?? option.tagName
                    }
                    onDelete={() => {
                      const newTags = editTags.filter((_, i) => i !== index);
                      setTagValue(newTags);
                    }}
                    sx={{
                      "& .MuiChip-deleteIcon": {
                        color: "error.main",
                      },
                      "& .MuiChip-deleteIcon:hover": {
                        color: "#e87f8c",
                      },
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="medium"
                  fullWidth
                  placeholder="Type to search tags..."
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
          </div>
        </div>
      </div>
      {isDirty && (
        <div className="my-2 px-2 sm:px-0">
          <Button
            fullWidth
            variant="contained"
            onClick={handleUpdateTicket}
            disabled={statusLoading || !ticket}
            sx={{
              padding: { xs: "13px 16px", sm: "10px 24px" },
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: { xs: 600, sm: 500 },
              borderRadius: { xs: "8px", sm: "4px" },
              textTransform: "none",
              boxShadow: { xs: "0 2px 8px rgba(0,0,0,0.15)", sm: "none" },
            }}
          >
            {!ticket ? (
              <Skeleton width={60} height={20} />
            ) : statusLoading ? (
              <CircularProgress color="primary" size={20} />
            ) : (
              "Update"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatusTab;
