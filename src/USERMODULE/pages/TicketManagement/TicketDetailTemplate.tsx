import React, { useEffect, useRef, useState } from "react";
import { Box, Grow, Skeleton, Zoom } from "@mui/material";
import { Apps, AddTask, More } from "@mui/icons-material";
import CustomSideBarPanel from "../../../components/reusable/CustomSideBarPanel";
import Tasks from "../task/Tasks";
import Sidebar from "../../../components/layout/Sidebar";
import TicketDetailHeader from "./TicketDetailHeader";
import TicketThreadSection from "./TicketThreadSection";
import TicketPropertiesSidebar from "./TicketPropertiesSidebar";
import CustomerInfoSection from "./CustomerInfoSection";
import InteractionHistorySection from "./InteractionHistorySection";
import IconsSection from "./IconsSection";
import InfoTab from "./InfoTab";
import { Button, Typography, Modal } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import ForwardPanel from "./ForwardPanel";
import { useCommanApiMutation } from "../../../services/threadsApi";
import { useGetTicketDetailStaffViewQuery } from "../../../services/ticketDetailAuth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TicketDetailSkeleton from "../../skeleton/TicketDetailSkeleton";
import { useAuth } from "../../../contextApi/AuthContext";
import {
  setIsReply,
  setSelectedIndex,
} from "../../../reduxStore/Slices/shotcutSlices";
import { useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import { useGetTicketListQuery } from "../../../services/ticketAuth";
import { AnimatePresence, motion } from "framer-motion";
import MoreOptionsPage from "../../../components/MoreOptionsPage";
import DrawerTask from "../drawerTask/DrawerTask";
import { useTicketsLayout } from "../../../contextApi/TicketsLayoutContext";

const TicketDetailTemplate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { addTicketTab, updateTicketTab, setActiveTicketTab } =
    useTicketsLayout();
  const openTicketNumber = useParams().id;
  const [openMoreOptions, setOpenMoreOptions] = useState(false);
  const handleMoreClose = () => {
    setOpenMoreOptions(false);
  };

  const handleMoreOpen = () => {
    setOpenMoreOptions((p) => !p);
  };
  const { data: ticket, isFetching: isTicketDetailLoading } =
    useGetTicketDetailStaffViewQuery(
      openTicketNumber
        ? { ticketNumber: openTicketNumber }
        : { ticketNumber: "" },
      { skip: !openTicketNumber }
    );

  // Fetch a chunk of tickets to enable previous/next navigation
  const { data: ticketListData } = useGetTicketListQuery({
    page: 1,
    limit: 100,
  });
   const location = useLocation();

  const ticketIds: string[] = Array.isArray(ticketListData?.data)
    ? ticketListData.data
        .map((t: any) => String(t?.ticketNumber ?? t?.ticketId ?? t?.id))
        .filter(Boolean)
    : [];
  const currentId = String(openTicketNumber ?? "");
  const currentIndex = ticketIds.findIndex((id) => id === currentId);
  const hasPreviousTicket = currentIndex > 0;
  const hasNextTicket =
    currentIndex >= 0 && currentIndex < ticketIds.length - 1;
  const handlePreviousTicket = () => {
    if (!hasPreviousTicket) return;
    const prevId = ticketIds[currentIndex - 1];
    if (prevId) {
      addTicketTab({ ticketNumber: prevId });
      navigate(`/tickets/${prevId}`);
    }
  };
  const handleNextTicket = () => {
    if (!hasNextTicket) return;
    const nextId = ticketIds[currentIndex + 1];
    if (nextId) {
      addTicketTab({ ticketNumber: nextId });
      navigate(`/tickets/${nextId}`);
    }
  };

  const [forwardOpen, setForwardOpen] = React.useState(false);
  const [forwardFields, setForwardFields] = React.useState({
    from:
      ticket?.header?.requester ||
      "MsCorpres Automation PvtLtd (support@postmanreply.com)",
    subject: ticket?.header?.subject ? `Fwd: ${ticket?.header?.subject}` : "",
    to: "",
    cc: [],
    bcc: [],
    threadID: "",
    message: ticket?.header?.description || "",
    documents: [],
  });
  const [showReplyEditor, setShowReplyEditor] = React.useState(false);
  const [showEditorNote, setShowEditorNote] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [expandedAccordion, setExpandedAccordion] = React.useState<
    string | null
  >("customer");
  const [isCustomerInfoVisible, setIsCustomerInfoVisible] =
    React.useState(false);
  const [customerInfoContent, setCustomerInfoContent] = React.useState<
    "customer" | "info" | "chat"
  >("customer");
  const [isAddTask, setIsAddTask] = React.useState(false);
  // Optimistic override for ticket header edits (subject/description/etc.)
  const [headerOverride, setHeaderOverride] = React.useState<any>(null);
  const displayHeader = React.useMemo(() => {
    const base = ticket?.header;
    if (!base) return base;
    const subject = headerOverride?.subject ?? base?.subject;
    const description = headerOverride?.description ?? base?.description;
    // Some consumers use body; maintain both
    const body = headerOverride?.description ?? base?.body;
    return { ...base, subject, description, body };
  }, [ticket, headerOverride]);

  const [triggerForward] = useCommanApiMutation();

  const handleBack = () => {
    // setOpenTicketNumber(null);
    navigate("/tickets");
  };

  // Pass this to children to allow opening the forward panel
  const handleOpenForward = () => setForwardOpen(true);
  const handleCloseForward = () => {
    dispatch(setSelectedIndex("2"));
    setForwardOpen(false);
  };
  const handleForwardFieldChange = (field: string, value: string) => {
    setForwardFields((prev) => ({ ...prev, [field]: value }));
  };
  const handleForwardSend = () => {
    if (!ticket) return;

    const urlValues = {
      threadID: forwardFields.threadID,
      type: forwardFields.threadID ? "thread" : "ticket",
      ticket: ticket?.header?.ticketId,
      code: "f4ed9e5da4bf4aed9e228bd1b1eae791",
    };
    const payload = {
      url: forwardFields.threadID
        ? `forward/${urlValues.ticket}/ticket?code=${urlValues.code}`
        : `forward/${urlValues.ticket}/ticket`,
      body: {
        //@ts-ignore
        from: user?.email,
        to: forwardFields.to,
        cc: forwardFields.cc,
        bcc: forwardFields.bcc,

        subject:
          ticket?.header?.subject && urlValues.threadID
            ? `FWD: ${ticket?.header?.subject}`
            : forwardFields.subject,
        message: ticket?.header?.description || forwardFields.message,
        attachments: forwardFields.documents.map((file: any) => {
          return {
            file_id: file.file_id,
            file_name: file.file_name,
            file_type: file.file_type,
            file_size: file.file_size,
            base64_data: file.base64_data,
          };
        }),
      },
    };

    // Call your API
    triggerForward(payload).then((response: any) => {
      if (response?.type === "error") {
        showToast(response?.message, "error");
      } else {
        dispatch(setSelectedIndex("2"));
        setForwardOpen(false);
        setForwardFields({
          from: "",
          subject: "",
          to: "",
          cc: [],
          bcc: [],
          message: ticket?.header?.description || "",
          documents: [],
          threadID: "",
        });
      }
    });
  };

  const handleReply = () => {
    setShowReplyEditor(true);
    setValue("Reply");
  };

  const handleCloseReply = () => setShowReplyEditor(false);
  const handleAddNote = () => {
    setShowEditorNote(true);
    dispatch(setIsReply(false));
    setValue("Note");
  };
  const handleAddNoteClose = () => setShowEditorNote(false);
  const handleDelete = () => setDeleteModalOpen(true);
  const handleCloseDelete = () => setDeleteModalOpen(false);
  const handleConfirmDelete = () => {
    // TODO: Implement delete logic
    setDeleteModalOpen(false);
    handleBack(); // After delete, go back to dashboard
  };

  const handleAccordionChange = (panel: string) => {
    if (expandedAccordion === panel) {
      // If clicking on the currently expanded panel, collapse it
      setExpandedAccordion(null);
    } else {
      // If clicking on a different panel, expand it
      setExpandedAccordion(panel);
    }
  };

  // Auto-open Customer accordion if both are collapsed
  React.useEffect(() => {
    if (expandedAccordion === null) {
      setExpandedAccordion("customer");
    }
  }, [expandedAccordion]);

  const handleInfoClick = () => {
    if (customerInfoContent === "info" && isCustomerInfoVisible) {
      // If same option is clicked and visible, hide it
      setIsCustomerInfoVisible(false);
    } else {
      // Otherwise, show it with the selected content
      setCustomerInfoContent("info");
      setIsCustomerInfoVisible(true);
    }
  };

  const handlePersonClick = () => {
    if (customerInfoContent === "customer" && isCustomerInfoVisible) {
      // If same option is clicked and visible, hide it
      setIsCustomerInfoVisible(false);
    } else {
      // Otherwise, show it with the selected content
      setCustomerInfoContent("customer");
      setIsCustomerInfoVisible(true);
    }
  };

  const handleChatClick = () => {
    if (customerInfoContent === "chat" && isCustomerInfoVisible) {
      // If same option is clicked and visible, hide it
      setIsCustomerInfoVisible(false);
    } else {
      // Otherwise, show it with the selected content
      setCustomerInfoContent("chat");
      setIsCustomerInfoVisible(true);
    }
  };

  useEffect(() => {
    if (openTicketNumber) {
      const ticketNumber = String(openTicketNumber);
      addTicketTab({ ticketNumber });
      setActiveTicketTab(ticketNumber);
    }
  }, [openTicketNumber, addTicketTab, setActiveTicketTab]);

  useEffect(() => {
    if (ticket?.header?.ticketNumber) {
      updateTicketTab(String(ticket.header.ticketNumber), {
        subject: ticket.header.subject,
        requester: ticket.header.requester,
        status: ticket.header.status,
      });
    }
  }, [
    ticket?.header?.ticketNumber,
    ticket?.header?.subject,
    ticket?.header?.requester,
    ticket?.header?.status,
    updateTicketTab,
  ]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          position: "relative",
          overflow: "hidden",
          height:   location.pathname === "/tickets" ||location.pathname.startsWith("/tickets/") ? "calc(100vh - 125px)" : "calc(100vh - 98px)",
        }}
      >
        <Sidebar open={false} handleDrawerToggle={() => {}} />
        <Box
          id="ticket-header"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
        <div className="sticky top-0 z-[99]">
          <TicketDetailHeader
            ticket={displayHeader}
            onBack={handleBack}
            onForward={handleOpenForward}
            onReply={handleReply}
            onDelete={handleDelete}
            onNote={handleAddNote}
            ticketNumber={openTicketNumber}
            onPreviousTicket={handlePreviousTicket}
            onNextTicket={handleNextTicket}
            hasPreviousTicket={hasPreviousTicket}
            hasNextTicket={hasNextTicket}
            isTicketLoading={isTicketDetailLoading}
          />
        </div>
        <div
         
          style={{
            display: "grid",
            gridTemplateColumns: isCustomerInfoVisible
              ? "1fr 2fr 1fr auto"
              : "1fr 3fr auto",
            transition :  "gridTemplateColumns 0.1s ease-in-out", 
          }}
        >
          <div
            id="ticket-properties-sidebar"
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
          >
            {isTicketDetailLoading || !ticket ? (
              <Box className="flex flex-col w-full h-full p-2" sx={{ gap: 1 }}>
                <Skeleton variant="rounded" width="100%" height={36} />
                <Skeleton variant="rounded" width="90%" height={24} />
                <Skeleton variant="rounded" width="70%" height={24} />
                <Skeleton variant="rounded" width="100%" height={80} />
                <Skeleton variant="rounded" width="100%" height={40} />
                <Skeleton variant="rounded" width="60%" height={32} />
              </Box>
            ) : (
              <TicketPropertiesSidebar ticket={displayHeader} />
            )}
            {/* Forward Panel positioned inside the left column */}
          </div>
          <div
            style={{ width: "100%", height: "100%", overflow: "auto" }}
            className="bg-white"
            id="ticket-thread"
          >
            {isTicketDetailLoading || !ticket ? (
              <TicketDetailSkeleton />
            ) : (
              <TicketThreadSection
                thread={ticket?.response}
                header={displayHeader}
                onForward={handleOpenForward}
                showReplyEditor={showReplyEditor}
                onCloseReply={handleCloseReply}
                showEditorNote={showEditorNote}
                onCloseEditorNote={handleAddNoteClose}
                value={value}
              />
            )}
          </div>
          {isCustomerInfoVisible && (
            <AnimatePresence >
              <div
                id="ticket-customer-info"
                className="w-full h-[calc(100vh-240px)]  overflow-y-auto overflow-x-hidden p-2.5 transition-all duration-300 ease-in-out translate-x-0 opacity-100 custom-scrollbar"
              >
                {customerInfoContent === "customer" ? (
                  <motion.div
                    key="customer"
                    initial={{ x: "100%", opacity: 0.5 }} // start off-screen to the right
                    animate={{ x: 0, opacity: 1 }} // animate into place
                    exit={{ x: "100%", opacity: 0 }} // animate out when hidden
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                  >
                    {/* Customer Information Section */}
                    <CustomerInfoSection
                      isExpanded={expandedAccordion === "customer"}
                      onToggle={() => handleAccordionChange("customer")}
                      ticketData={displayHeader}
                    />

                    <InteractionHistorySection
                      isExpanded={expandedAccordion === "interaction"}
                      onToggle={() => handleAccordionChange("interaction")}
                    />
                  </motion.div>
                ) : customerInfoContent === "info" ? (
                  <motion.div
                    key="info"
                    initial={{ x: "100%", opacity: 0.5 }} // start off-screen to the right
                    animate={{ x: 0, opacity: 1 }} // animate into place
                    exit={{ x: "100%", opacity: 0 }} // animate out when hidden
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <InfoTab />
                  </motion.div>
                ) : (
                  /* Chat UI Content */
                  <motion.div
                    key="chat"
                    initial={{ x: "100%", opacity: 0.5 }} // start off-screen to the right
                    animate={{ x: 0, opacity: 1 }} // animate into place
                    exit={{ x: "100%", opacity: 0 }} // animate out when hidden
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{
                      width: "100%",
                      height: "calc(100vh - 235px)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 16px",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#4caf50",
                          borderRadius: "50%",
                          marginRight: "8px",
                        }}
                      ></div>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        Live Chat
                      </span>
                    </div>
                    {/* Scrollable Chat Messages Area - Middle */}
                    <div
                      className="custom-scrollbar"
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderBottom: "1px solid #e0e0e0",
                        overflowY: "auto",
                        height: "calc(100vh - 180px)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Sample Messages */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#2566b0",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "18px 18px 4px 18px",
                              maxWidth: "70%",
                              fontSize: "14px",
                            }}
                          >
                            Hello! How can I help you with this ticket?
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#e0e0e0",
                              color: "#333",
                              padding: "8px 12px",
                              borderRadius: "18px 18px 18px 4px",
                              maxWidth: "70%",
                              fontSize: "14px",
                            }}
                          >
                            I need help with my account access issue
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#1976d2",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "18px 18px 4px 18px",
                              maxWidth: "70%",
                              fontSize: "14px",
                            }}
                          >
                            I'll look into that for you right away. Can you
                            provide more details?
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#e0e0e0",
                              color: "#333",
                              padding: "8px 12px",
                              borderRadius: "18px 18px 18px 4px",
                              maxWidth: "70%",
                              fontSize: "14px",
                            }}
                          >
                            Sure, I'm getting a 403 error when trying to access
                            the dashboard
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#1976d2",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "18px 18px 4px 18px",
                              maxWidth: "70%",
                              fontSize: "14px",
                            }}
                          >
                            I see the issue. Let me check your permissions and
                            get this resolved for you.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-end",
                        marginTop: "14px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Type your message..."
                        style={{
                          flex: 1,
                          padding: "8px 8px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "20px",
                          outline: "none",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        style={{
                          backgroundColor: "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        →
                      </button>
                    </div>
                    {/* </div> */}
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          )}

          <div
            id="ticket-icons-section"
            style={{
              width: "100%",
              height: "calc(100vh - 240px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 8px",
            }}
          >
            {/* Main Icons Section */}
            <IconsSection
              onInfoClick={handleInfoClick}
              onPersonClick={handlePersonClick}
              onChatClick={handleChatClick}
              chatCount={ticket?.chatMessages?.length || 0}
              activeContent={customerInfoContent}
            />

            {/* Bottom Icons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <ClickAwayListener onClickAway={handleMoreClose}>
                <div>
                  <Tooltip
                    onClose={handleMoreClose}
                    open={openMoreOptions}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    slots={{
                      transition: Grow,
                    }}
                    sx={{
                      backgroundColor: "#fff",
                      zIndex: 0,
                    }}
                    title={
                      <MoreOptionsPage
                        ticket={displayHeader}
                        ticketNumber={openTicketNumber}
                        onTicketUpdated={(updated: any) => {
                          try {
                            setHeaderOverride({
                              subject: updated?.subject,
                              description: updated?.description,
                            });
                          } catch (_) {}
                        }}
                        onMenuClose={handleMoreClose}
                      />
                    }
                    slotProps={{
                      popper: {
                        disablePortal: true,
                        keepMounted: true,
                      },
                      tooltip: {
                        sx: {
                          backgroundColor: "#fff",
                          color: "#333",
                          boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                          fontSize: "0.875rem",
                          borderRadius: "8px",
                          p: 1,
                          mb: 1,
                        },
                      },
                      arrow: {
                        sx: {
                          color: "#f0efefff",
                        },
                      },
                    }}
                    arrow
                    placement="left"
                  >
                    <button
                      onClick={handleMoreOpen}
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e8eaec";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                    >
                      <Apps style={{ fontSize: "20px", color: "#666" }} />
                    </button>
                  </Tooltip>
                  {/* </Tooltip> */}
                </div>
              </ClickAwayListener>

              {/* AddTask Icon */}
              <div style={{ position: "relative" }}>
                {/* <button
                  onClick={() => {
                    setIsAddTask(true);
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8eaec";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                >
                  <AddTask style={{ fontSize: "20px", color: "#666" }} />
                </button> */}

                {/* Blue Counter Badge */}
                {/* <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    minWidth: "20px",
                    padding: "0 2px",
                  }}
                >
                 
                  {ticket?.other?.taskCount || 0}
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </Box>

      <CustomSideBarPanel
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography sx={{ flex: 1, fontSize: "17px", fontWeight: 600 }}>
              Forward
            </Typography>
          </Box>
        }
        open={forwardOpen}
        close={handleCloseForward}
        width={600}
      >
        <ForwardPanel
          open={forwardOpen}
          onClose={handleCloseForward}
          fields={forwardFields}
          onFieldChange={handleForwardFieldChange}
          onSend={handleForwardSend}
        />
      </CustomSideBarPanel>

      <Modal
        open={deleteModalOpen}
        onClose={handleCloseDelete}
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            width: { xs: "90vw", sm: "400px" },
            maxWidth: "90vw",
          }}
        >
          <Typography variant="h6" id="delete-modal-title" sx={{ mb: 2 }}>
            Confirm Delete
          </Typography>
          <Typography id="delete-modal-description" sx={{ mb: 3 }}>
            Are you sure you want to delete this ticket?
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              onClick={handleCloseDelete}
              variant="contained"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Add Task Panel */}
      <CustomSideBarPanel
        open={isAddTask}
        close={() => setIsAddTask(false)}
        title={"Add Task"}
        width={"80%"}
      >
        <DrawerTask isAddTask={isAddTask} ticketId={ticket?.header?.ticketId} />
      </CustomSideBarPanel>
    </Box>
    </>
  );
};

export default TicketDetailTemplate;
