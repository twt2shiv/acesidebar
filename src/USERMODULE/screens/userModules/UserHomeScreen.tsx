import { useMemo, useState } from "react";
import {
  Archive,
  AttachFile,
  Close,
  CloudUpload,
  LabelOutlined,
  Reply,
  Star,
} from "@mui/icons-material";
import { Refresh, Sort } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import { Plus, Search } from "lucide-react";
import emailPlaceholder from "../../../assets/email.png";
import { AnimatePresence, motion } from "framer-motion";
import UserTimeLine from "../../components/userModuleComponents/UserTimeLine";

type TicketMessage = {
  id: string;
  author: string;
  role: "Customer" | "Agent" | "Internal";
  timestamp: string;
  content: string;
  internal?: boolean;
};

type Ticket = {
  id: string;
  subject: string;
  summary: string;
  requester: {
    name: string;
    email: string;
    company?: string;
  };
  status: "Open" | "Pending" | "Resolved" | "Waiting on Customer";
  priority: "Urgent" | "High" | "Medium" | "Low";
  channel: "Email" | "Chat" | "Phone" | "Portal";
  queue: string;
  assignedTo: string;
  department: string;
  category: string;
  type: "Question" | "Incident" | "Problem" | "Task";
  lastUpdated: string;
  createdAt: string;
  slaDue: string;
  unread: boolean;
  tags: string[];
  messages: TicketMessage[];
};

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const mockTickets: Ticket[] = [
  {
    id: "TCK-2307",
    subject: "Checkout button returns 500 error",
    summary:
      "Customer unable to complete checkout. Error surfaced after the latest deployment.",
    requester: {
      name: "Alicia Coleman",
      email: "alicia@northwind.io",
      company: "Northwind Goods",
    },
    status: "Open",
    priority: "High",
    channel: "Email",
    queue: "Web Support",
    assignedTo: "Jordan Nash",
    department: "Product Engineering",
    category: "Checkout Flow",
    type: "Incident",
    lastUpdated: "3m ago",
    createdAt: "Fri, Nov 21 • 10:12 AM",
    slaDue: "Today • 6:00 PM",
    unread: true,
    tags: ["Checkout", "Bug"],
    messages: [
      {
        id: "msg-1",
        author: "Alicia Coleman",
        role: "Customer",
        timestamp: "Nov 21, 10:12 AM",
        content: `Hi team,

We noticed the checkout button throws a 500 error in production. Staging looks fine, so this might be the latest deployment. Can you take a look?`,
      },
      {
        id: "msg-2",
        author: "Jordan Nash",
        role: "Agent",
        timestamp: "Nov 21, 10:47 AM",
        content: `Thanks Alicia, confirming we can reproduce the issue. I'm looping in engineering and will update you once the hotfix is deployed.`,
      },
    ],
  },
  {
    id: "TCK-2299",
    subject: "SLA reminder: VIP account provisioning",
    summary:
      "Enterprise onboarding stuck in pending state. Customer awaiting confirmation.",
    requester: {
      name: "Ruben Castillo",
      email: "ruben.castillo@stellarhq.com",
      company: "StellarHQ",
    },
    status: "Pending",
    priority: "Urgent",
    channel: "Portal",
    queue: "Enterprise Onboarding",
    assignedTo: "Meena Rao",
    department: "Customer Success",
    category: "Account Provisioning",
    type: "Task",
    lastUpdated: "12m ago",
    createdAt: "Thu, Nov 20 • 4:52 PM",
    slaDue: "Today • 4:00 PM",
    unread: true,
    tags: ["VIP", "Provisioning"],
    messages: [
      {
        id: "msg-3",
        author: "Ruben Castillo",
        role: "Customer",
        timestamp: "Nov 20, 4:52 PM",
        content: `Checking in on the provisioning of our EU cluster. We were told it would be ready within 24 hours.`,
      },
      {
        id: "msg-4",
        author: "Meena Rao",
        role: "Agent",
        timestamp: "Nov 21, 9:18 AM",
        content: `Hi Ruben, we're waiting on a subnet allocation from our infra team. I've prioritized the task and will confirm once it's live.`,
      },
      {
        id: "msg-5",
        author: "Meena Rao",
        role: "Internal",
        timestamp: "Nov 21, 9:22 AM",
        content: `@Infra Team — need subnet assignment for StellarHQ EU tenant before 4 PM to avoid SLA breach.`,
        internal: true,
      },
    ],
  },
  {
    id: "TCK-2274",
    subject: "Feature request: export analytics dashboard",
    summary:
      "Customer would like scheduled CSV exports for analytics dashboards every Monday.",
    requester: {
      name: "Sophia Patel",
      email: "sophia.patel@lumenlabs.io",
      company: "Lumen Labs",
    },
    status: "Waiting on Customer",
    priority: "Medium",
    channel: "Email",
    queue: "Product Feedback",
    assignedTo: "Product Triage",
    department: "Product Management",
    category: "Reporting",
    type: "Question",
    lastUpdated: "32m ago",
    createdAt: "Mon, Nov 17 • 2:05 PM",
    slaDue: "Nov 28 • 12:00 PM",
    unread: false,
    tags: ["Feature", "Analytics"],
    messages: [
      {
        id: "msg-6",
        author: "Sophia Patel",
        role: "Customer",
        timestamp: "Nov 17, 2:05 PM",
        content: `Is there a way to export the analytics dashboard to CSV on a schedule? We need weekly reports.`,
      },
      {
        id: "msg-7",
        author: "Product Triage",
        role: "Agent",
        timestamp: "Nov 18, 11:34 AM",
        content: `Thanks Sophia! This isn't available today, but the product team is evaluating a reporting API. Would that solve your use-case?`,
      },
    ],
  },
  {
    id: "TCK-2260",
    subject: "Incident follow-up: EU region latency",
    summary:
      "Customer requesting RCA for degraded performance in EU cluster during maintenance window.",
    requester: {
      name: "Lucas Brown",
      email: "lucas.brown@aurora.ai",
      company: "Aurora AI",
    },
    status: "Resolved",
    priority: "Medium",
    channel: "Email",
    queue: "Incident Desk",
    assignedTo: "SRE Rotation",
    department: "Site Reliability",
    category: "Regional Performance",
    type: "Problem",
    lastUpdated: "58m ago",
    createdAt: "Sun, Nov 16 • 3:11 AM",
    slaDue: "Nov 23 • 9:00 AM",
    unread: false,
    tags: ["Incident", "EU Cluster"],
    messages: [
      {
        id: "msg-8",
        author: "Lucas Brown",
        role: "Customer",
        timestamp: "Nov 16, 3:11 AM",
        content: `We observed latency spikes between 03:00–04:00 UTC. Could you share an incident summary for our customers?`,
      },
      {
        id: "msg-9",
        author: "SRE Rotation",
        role: "Agent",
        timestamp: "Nov 16, 6:48 AM",
        content: `Hey Lucas, root cause was an overloaded cache server. Mitigation deployed at 04:07 UTC. Attached is the preliminary RCA.`,
      },
    ],
  },
  {
    id: "TCK-2252",
    subject: "Need onboarding webinar recording",
    summary:
      "Customer missed live onboarding call and is requesting recording plus next steps.",
    requester: {
      name: "Amelia Wilson",
      email: "amelia.wilson@trailway.app",
      company: "Trailway",
    },
    status: "Open",
    priority: "Low",
    channel: "Chat",
    queue: "Customer Success",
    assignedTo: "Success Queue",
    department: "Customer Education",
    category: "Onboarding",
    type: "Task",
    lastUpdated: "1h ago",
    createdAt: "Fri, Nov 14 • 9:28 AM",
    slaDue: "Nov 24 • 5:00 PM",
    unread: false,
    tags: ["Onboarding"],
    messages: [
      {
        id: "msg-10",
        author: "Amelia Wilson",
        role: "Customer",
        timestamp: "Nov 14, 9:28 AM",
        content: `Could you share the recording for yesterday’s onboarding webinar? I had to leave after 15 minutes.`,
      },
      {
        id: "msg-11",
        author: "Success Queue",
        role: "Agent",
        timestamp: "Nov 14, 10:05 AM",
        content: `Absolutely! I've attached the recording and included a checklist to help you get started.`,
      },
    ],
  },
];

const getPriorityChip = (priority: Ticket["priority"]) => {
  switch (priority) {
    case "Urgent":
      return { color: "error" as const, label: "Urgent" };
    case "High":
      return { color: "error" as const, label: "High" };
    case "Medium":
      return { color: "warning" as const, label: "Medium" };
    case "Low":
    default:
      return { color: "success" as const, label: "Low" };
  }
};

const getStatusChip = (status: Ticket["status"]) => {
  switch (status) {
    case "Open":
      return { color: "primary" as const, label: "Open" };
    case "Pending":
      return { color: "warning" as const, label: "Pending" };
    case "Resolved":
      return { color: "success" as const, label: "Resolved" };
    case "Waiting on Customer":
    default:
      return { color: "default" as const, label: "Waiting on Customer" };
  }
};

const initials = (value: string) =>
  value
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const UserHomeScreen = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [sortedTickets, setSortedTickets] = useState(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenReply, setIsOpenReply] = useState(false);
  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      return (
        ticket.requester.name.toLowerCase().includes(q) ||
        ticket.requester.email?.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.queue.toLowerCase().includes(q) ||
        ticket.status.toLowerCase().includes(q) ||
        ticket.priority.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, sortedTickets]);

  function parseTimeAgo(str: any) {
    if (str.includes("m")) return parseInt(str) * 60; // minutes → seconds
    if (str.includes("h")) return parseInt(str) * 3600; // hours → seconds
    if (str.includes("d")) return parseInt(str) * 86400; // days → seconds
    return 0;
  }
  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    const sorted = [...sortedTickets].sort((a, b) => {
      const timeA = parseTimeAgo(a.lastUpdated);
      const timeB = parseTimeAgo(b.lastUpdated);

      return newOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    setSortedTickets(sorted);
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-74px)] flex gap-3 bg-[#f3f4f6] p-2 overflow-hidden">
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          selectedTicket ? "w-[40%]" : "w-[70%]"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="transition-all duration-200 w-[320px] relative">
            <div className="flex items-center w-full bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm transition-shadow focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.18)] hover:shadow-[0_1px_6px_rgba(32,33,36,0.18)]">
              <Search className="text-gray-500 mr-3" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search tickets…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 leading-tight placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="Sort">
              <IconButton size="small" onClick={handleSort}>
                <Sort
                  fontSize="small"
                  className={`transition-transform duration-300 ${
                    sortOrder === "asc" ? "rotate-180" : ""
                  }`}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small">
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="New ticket">
              <IconButton size="small" color="primary">
                <Plus size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <Divider />
        <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[calc(100vh-160px)]">
          {filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No tickets found.
            </div>
          ) : (
            <ul>
              {filteredTickets.map((ticket) => {
                const priorityChip = getPriorityChip(ticket.priority);
                const statusChip = getStatusChip(ticket.status);
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <li
                    key={ticket.id}
                    className={`border-b border-gray-100 last:border-b-0 bg-white`}
                  >
                    <button
                      type="button"
                      className={`w-full text-left px-5 py-5 transition-all focus:outline-none ${
                        ticket.unread
                          ? "bg-[#f9fbff] hover:bg-[#eef4ff]"
                          : "bg-white hover:bg-slate-50"
                      } ${
                        isSelected
                          ? "ring-2 ring-[#ff7800] bg-[#e6f7f3] scale-[0.98]"
                          : "scale-100"
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isSelected ? "#1976d2" : "#6366f1",
                            fontSize: "0.85rem",
                          }}
                        >
                          {initials(ticket.requester.name)}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">
                                {ticket.requester.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {ticket.requester.company ??
                                  ticket.requester.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Chip
                                size="small"
                                color={priorityChip.color}
                                label={priorityChip.label}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                color={statusChip.color}
                                label={statusChip.label}
                              />
                              <span className="text-xs text-gray-500">
                                {ticket.lastUpdated}
                              </span>
                            </div>
                          </div>
                          <p
                            className={`mt-2 text-sm line-clamp-1 ${
                              ticket.unread
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {ticket.subject}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {ticket.summary}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                            <span>{ticket.id}</span>
                            <span>•</span>
                            <span>{ticket.queue}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div
        className={`bg-white rounded-xl shadow-sm border  border-gray-100 flex flex-col overflow-hidden max-h-[calc(100vh-95px)]  ease-out ${
          selectedTicket ? "flex-1" : "w-[30%]"
        }`}
      >
        {selectedTicket ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <Typography
                  variant="overline"
                  className="tracking-wide text-gray-500"
                >
                  {selectedTicket.id}
                </Typography>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900"
                >
                  {selectedTicket.subject}
                </Typography>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip title="Reply to requester">
                  <IconButton
                    size="small"
                    onClick={() => setIsOpenReply(!isOpenReply)}
                  >
                    <Reply fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Tag ticket">
                  <IconButton size="small">
                    <LabelOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            <div
              className={`${
                isOpenReply
                  ? "max-h-[calc(100vh-400px)] overflow-y-auto min-h-[calc(100vh-400px)]"
                  : "max-h-[calc(100vh-300px)] overflow-y-auto min-h-[calc(100vh-200px)]"
              } transition-height ease-in-out duration-300`}
            >
              <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#1976d2",
                    fontSize: "0.95rem",
                  }}
                >
                  {initials(selectedTicket.requester.name)}
                </Avatar>
                <div className="flex-1 min-w-[200px]">
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-gray-900"
                  >
                    {selectedTicket.requester.name}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {selectedTicket.requester.email}
                  </Typography>
                  {selectedTicket.requester.company && (
                    <Typography variant="body2" className="text-gray-500">
                      {selectedTicket.requester.company}
                    </Typography>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTicket.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </div>
                <Typography variant="body2" className="text-gray-500">
                  Updated {selectedTicket.lastUpdated}
                </Typography>
              </div>

              <div className="px-5 py-2 border-b border-gray-100 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">
                    Assigned agent:
                  </span>{" "}
                  {selectedTicket.assignedTo}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>{" "}
                  {selectedTicket.department}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>{" "}
                  {selectedTicket.category}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{" "}
                  {selectedTicket.status}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>{" "}
                  {selectedTicket.priority}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Channel:</span>{" "}
                  {selectedTicket.channel}
                </div>
                <div>
                  <span className="font-medium text-gray-700">SLA due:</span>{" "}
                  {selectedTicket.slaDue}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due date:</span>{" "}
                  {selectedTicket.createdAt}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Queue:</span>{" "}
                  {selectedTicket.queue}
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Ticket type:
                  </span>{" "}
                  {selectedTicket.type}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
                {selectedTicket.messages.map((message) => {
                  const isAgent = message.role === "Agent" && !message.internal;
                  const isCustomer = message.role === "Customer";
                  const isInternal =
                    message.internal || message.role === "Internal";

                  const alignment = isAgent
                    ? "justify-end"
                    : isInternal
                    ? "justify-center"
                    : "justify-start";

                  const bubbleBase =
                    "max-w-[100%] rounded-2xl border px-4 py-3 shadow-xl";
                  const bubbleTheme = isInternal
                    ? "bg-amber-50 border-amber-200"
                    : isAgent
                    ? "bg-orange-50 border-orange-200"
                    : "bg-blue-50 border-blue-200";
                  const headingColor = isInternal
                    ? "text-amber-800"
                    : isAgent
                    ? "text-orange-800"
                    : "text-blue-800";

                  return (
                    <>
                      <div
                        key={message.id}
                        className={`flex ${alignment} items-start gap-3 `}
                      >
                        {isCustomer && (
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "#1d4ed8",
                              fontSize: "0.75rem",
                            }}
                          >
                            {initials(message.author)}
                          </Avatar>
                        )}

                        <div className={`${bubbleBase} ${bubbleTheme}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <Typography
                                variant="subtitle2"
                                className={`font-semibold ${headingColor}`}
                              >
                                {message.author}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500"
                              >
                                {message.role}
                              </Typography>
                            </div>
                            <Typography
                              variant="caption"
                              className="text-gray-500"
                            >
                              {message.timestamp}
                            </Typography>
                          </div>
                          <Typography
                            component="pre"
                            className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700"
                          >
                            {message.content}
                          </Typography>
                          {message.internal && (
                            <Typography
                              variant="caption"
                              className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700"
                            >
                              Internal note
                            </Typography>
                          )}
                        </div>

                        {isAgent && (
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "#f97316",
                              fontSize: "0.75rem",
                            }}
                          >
                            {initials(message.author)}
                          </Avatar>
                        )}
                      </div>
                      <div className="mx-12">
                        <UserTimeLine />
                      </div>
                    </>
                  );
                })}
              </div>
            </div>
            <Divider />

            <AnimatePresence initial={false}>
              {isOpenReply && (
                <motion.div
                  key="reply-box"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    height: isOpenReply ? "auto" : 0,
                    opacity: 1,
                    overflow: "hidden",
                  }}
                  exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                  // transition={{ duration: 0.1, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-2 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <Typography variant="subtitle2">
                        Customer Reply
                      </Typography>
                      <IconButton size="small">
                        <Close fontSize="small" />
                      </IconButton>
                    </div>
                    <div className="flex flex-col gap-3">
                      <textarea
                        rows={4}
                        maxLength={365}
                        className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder={`Reply to ${selectedTicket.requester.name}…`}
                      />
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="flex gap-4 items-center">
                        <IconButton
                          component="label"
                          size="small"
                          role={undefined}
                          tabIndex={-1}
                          // startIcon={}
                        >
                          <AttachFile fontSize="small" />
                          <VisuallyHiddenInput
                            type="file"
                            onChange={(event) =>
                            {
                              if (uploadFile.length < 1) {
                                setUploadFile(event.target.files);
                            }
                            setUploadFile(event.target.files)
                            }}
                          />
                        </IconButton>
                        {uploadFile && uploadFile.length > 0 && (
                          <Tooltip
                            title={
                              <div>
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: 12 }}
                                >
                                  {uploadFile?.[0]?.name} |{" "}
                                  {uploadFile?.[0]?.size}
                                </Typography>
                              </div>
                            }
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontSize: 10, cursor: "pointer" }}
                            >
                              {uploadFile?.[0]?.name?.slice(0, 6) + "...."}
                            </Typography>
                          </Tooltip>
                        )}
                      </div>
                      <Button variant="contained" size="small">
                        Send
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center flex flex-col items-center gap-4 px-6">
              <img
                src={emailPlaceholder}
                alt="Email placeholder"
                className="w-32 h-32 object-contain"
              />
              <div>
                <Typography variant="h6" className="text-gray-800">
                  Keep your phone connected
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 mt-1 max-w-sm"
                >
                  Select a ticket to view the full conversation. Stay connected
                  to reply quickly and keep your workspace in sync.
                </Typography>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHomeScreen;
