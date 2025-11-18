import React, { use, useCallback, useEffect, useRef, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import StackEditor from "../../../components/reusable/Editor";
import AddBoxIcon from "@mui/icons-material/AddBox";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import emptyimg from "../../../assets/image/overview-empty-state.svg";
import web from "../../../assets/icons/ticket_source_web.gif";
import email from "../../../assets/icons/ticket_source_email.gif";
import fileicon from "../../../assets/archive.png";
import DownloadIcon from "@mui/icons-material/Download";
import userAvatar from "../../../assets/ticket-user-avatar.png";
import agentAvatar from "../../../assets/ticket-agent-avatar.png";
import {
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Typography,
  Chip,
  ClickAwayListener,
  Box,
  ListItem,
  Tooltip,
  Button,
  Avatar,
  CircularProgress,
  List,
  ListItemText,
  Rating,
  Modal,
  Fade,
  Backdrop,
  Menu,
  ButtonGroup,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import ShortcutIcon from "@mui/icons-material/Shortcut";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../reduxStore/Store";
import ImageViewComponent from "../../components/ImageViewComponent";

import {
  setForwardData,
  setIsReply,
  setReplyValue,
} from "../../../reduxStore/Slices/shotcutSlices";
import CustomModal from "../../../components/layout/CustomModal";
import {
  useCommanApiMutation,
  useGetAttacedFileQuery,
  useGetShortCutListQuery,
} from "../../../services/threadsApi";
import CustomToolTip from "../../../reusable/CustomToolTip";
import { createFormDataHeaders } from "../../../utils/requestHeaders";
import {
  useAttachedFileMutation,
  useLazyDownloadAttachedFileQuery,
} from "../../../services/uploadDocServices";
import { useToast } from "../../../hooks/useToast";
import { useParams } from "react-router-dom";
import ReplyStatusOptions from "../../components/ReplyStatusOptions";
import CustomSideBarPanel from "../../../components/reusable/CustomSideBarPanel";

const signatureValues: any = [
  {
    id: 1,
    name: "None",
    value: "1",
    signature: "",
  },
  {
    id: 2,
    name: "My Signature",
    value: "2",
    signature: `<p>Best regards,</p>
<p><strong>John Doe</strong><br>
Senior Support Engineer<br>
Email: john.doe@company.com<br>
Phone: +1 (555) 123-4567<br>
Company Name<br>
www.company.com</p>`,
  },
  {
    id: 3,
    name: "Department Signature (Support)",
    value: "3",
    signature: `<p>Best regards,</p>
<p><strong>Support Team</strong><br>
Technical Support Department<br>
Email: support@company.com<br>
Phone: +1 (555) 987-6543<br>
Company Name<br>
www.company.com<br>
Working Hours: Mon-Fri 9AM-6PM EST</p>`,
  },
];

const TicketSubjectBar = ({ header }: any) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl">
      {header?.sentiment ? JSON.parse(header.sentiment).emoji : "🙂"}
    </span>
    <span className="font-semibold text-xl text-gray-800">
      {header?.subject || "Ticket Subject"}
    </span>
  </div>
);

const replyOptions = [
  {
    id: 1,
    name: "Forward",
    value: "1",
    icon: <ShortcutIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: 2,
    name: "Edit",
    value: "2",
    icon: <EditIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: 3,
    name: "Delete",
    value: "3",
    icon: <DeleteIcon sx={{ fontSize: 18 }} />,
  },
];

const ThreadItem = ({
  item,
  onForward,
  marginBottomClass,
  subjectTitle,
  openOptionsId,
  onToggleOptions,
}: any) => {
  const [reviewThread] = useCommanApiMutation();
  const [triggerFlag, { isLoading: flagLoading }] = useCommanApiMutation();
  const { showToast } = useToast();
  const [isReported, setIsReported] = useState<boolean>(item?.isFlagged);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalOpen2, setIsModalOpen2] = useState<boolean>(false);

  const ticketId = useParams().id;
  const optionsRef = React.useRef<any>(null);
  const [trackDownloadId, setTrackDownloadId] = useState<string>("");
  const [ratingValue, setRatingValue] = useState(item?.score ?? 0);
  const dispatch = useDispatch();
  const [triggerDownload, { isLoading: isDownloading }] =
    useLazyDownloadAttachedFileQuery();

  const handleReplyClick = (e: any) => {
    onForward();
  };

  const handleSelect = (value: string) => {
    if (value === "1") {
      const payloadForward = {
        subject: `#Forward: ${subjectTitle}`,
        message: item.message,
        threadID: item.entryId,
      };
      dispatch(setForwardData(payloadForward));

      handleReplyClick(null);
      onToggleOptions(null);
    } else if (value === "2") {
      onToggleOptions(null);
    } else {
      onToggleOptions(null);
    }
  };

  const handleReview = (value: any) => {
    const pathId = window.location.pathname.split("/").pop();

    const payload = {
      url: "rate-ticket",
      method: "PUT",
      body: {
        ticket: pathId,
        rate: value,
        thread: item.entryId,
      },
    };

    reviewThread(payload).then((response: any) => {
      if (response?.type === "error" || response?.data?.type === "error") {
        showToast(
          response?.data?.message ||
            response?.message ||
            "Something went wrong",
          "error"
        );
        return;
      } else {
        setRatingValue(value);
      }
    });
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    if (!fileId || !ticketId) {
      showToast("Invalid attachment ID or ticketId", "error");
      return;
    }

    const payload = {
      ticketNumber: ticketId,
      signature: fileId,
    };

    try {
      const res = await triggerDownload(payload).unwrap();

      if (res instanceof Blob) {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "attachment";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast("Download completed", "success");
        return;
      }

      if (res?.success === true && res?.data) {
        const byteCharacters = atob(res.data);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/octet-stream",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "attachment";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showToast("Download completed", "success");
        setTrackDownloadId("");
      } else {
        showToast(
          res?.message || "An error occurred while downloading",
          "error"
        );
      }
    } catch (error) {
      console.log(error);
      showToast("Failed to download file", "error");
    }
  };
   const handleClose = (event: any) => {
    if (optionsRef.current && optionsRef.current.contains(event.target)) {
      return;
    }

    setIsModalOpen2(false);
  };

  const renderReplyOption = (
      <ClickAwayListener onClickAway={handleClose}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "8px 12px",
        backgroundColor: "white",

        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",

        animation: "slideInFromTop 0.2s ease-out",
        "@keyframes slideInFromTop": {
          "0%": {
            opacity: 0,
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      }}
    >
    
     
        {replyOptions.map((option, index) => {
          return (
            <IconButton
              key={index}
              onClick={() => {
                handleSelect(option.value);
              }}
              size="small"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#666",
                transition: "all 0.2s ease",
                minWidth: "60px",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  color: "#2566b0",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {option.icon}
              <Typography
                variant="caption"
                sx={{
                  fontSize: "10px",
                  fontWeight: 500,
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {option.name}
              </Typography>
            </IconButton>
          );
        })}
   
    </Box>
       </ClickAwayListener>
  );
  //@ts-ignore
  const isCurrentUser = item?.replyType === "AGENT";
  const bubbleBackgroundColor = isReported
    ? "#fee2e2"
    : isCurrentUser && item?.entryType === "pbR"
    ? "#f7faff"
    : isCurrentUser && item?.entryType === "PrvN"
    ? "#fef1e1"
    : "#fafafa";
  const bubbleFooter = isCurrentUser
    ? "IP: 127.0.0.1 | Location: India"
    : "IP: 127.0.0.1 | Location: India";
  // const isRatingDisabled = isCurrentUser;

  const decodeHtmlEntities = (encoded: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = encoded ?? "";
      return textarea.value;
    } catch {
      return encoded ?? "";
    }
  };

 

  const sanitizeMessageHtml = (html: string) => {
    if (!html) return "";
    let out = html;
    // Remove script tags and their content
    out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    // Remove event handler attributes like onclick, onerror, etc. (both quote styles)
    out = out.replace(/on[a-z]+\s*=\s*"[^"]*"/gi, "");
    out = out.replace(/on[a-z]+\s*=\s*'[^']*'/gi, "");
    // Neutralize javascript: URLs
    out = out.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
    out = out.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
    out = out.replace(/src\s*=\s*"javascript:[^"]*"/gi, 'src="#"');
    out = out.replace(/src\s*=\s*'javascript:[^']*'/gi, "src='#'");
    return out;
  };

  const handleReportTicket = (flagValue: boolean) => {
    const status = isReported ? 0 : 1;
    const payload = {
      url: `report-thread/${ticketId}/${item.entryId}/${status}`,
      method: "PUT",
    };
    triggerFlag(payload)
      .then((response: any) => {
        if (response?.type === "error") {
          return;
        } else {
          setIsReported((v) => !v);
          setTrackDownloadId("");
        }
      })
      .catch((error) => {});
  };

  return (
    <div className={`w-full flex p-2 overflow-auto ${marginBottomClass}`}>
      {/* Email content */}
      <div className="flex-1">
        <div
          className={`rounded flex ${
            isCurrentUser ? " flex-row-reverse" : "flex-row "
          }`}
        >
          <div className=" relative flex px-4 py-2 flex-col items-center">
            <div
              style={{
                position: "absolute",
                top: "15px",
                [isCurrentUser ? "left" : "right"]: `0px`,
                width: 0,
                height: 0,
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                [isCurrentUser
                  ? "borderLeft"
                  : "borderRight"]: `12px solid ${bubbleBackgroundColor}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "15px",
                [isCurrentUser ? "left" : "right"]: `-20px`,
              }}
            >
              <Avatar
                src={item?.replyType === "AGENT" ? agentAvatar : userAvatar}
                alt={item?.replyType}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            {!item?.subject && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  [isCurrentUser ? "left" : "right"]: `-16px`,
                }}
              >
                {!isCurrentUser && (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg font-bold text-gray-600 border border-[#c3d9ff]">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTrackDownloadId(item.entryId);
                        handleReportTicket(item?.isFlagged);
                      }}
                    >
                      {flagLoading && trackDownloadId === item.entryId ? (
                        <CircularProgress size={16} />
                      ) : (
                        <EmojiFlagsIcon
                          sx={{ color: isReported ? "#ef4444" : "#9ca3af" }}
                          fontSize="small"
                        />
                      )}
                    </IconButton>
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            className="w-[100%] flex flex-col items-center justify-between border border-gray-200 shadow-[0_2px_3px_0_rgb(172,172,172,0.4)] rounded-lg"
            style={{ backgroundColor: bubbleBackgroundColor }}
            onMouseEnter={() => {
              setIsHovered(true);
            }}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center justify-between  w-full px-8 py-2">
              <div className={`w-full  flex flex-col`}>
                <div
                  className={`flex  items-center justify-between  w-full border-b-2 ${
                    item?.entryType === "PrvN"
                      ? "border-[#f8d2a4ff]"
                      : "border-gray-200"
                  } pb-4  ${isCurrentUser ? " flex-row-reverse" : "flex-row "}`}
                >
                  <div className="flex items-center gap-2">
                    {" "}
                    <span className="font-semibold text-[#2566b0] text-sm">
                      {item?.repliedBy?.name ?? item?.ticketId ?? "User"}
                    </span>
                    {item?.subject && isHovered && (
                      <IconButton
                        size="small"
                        onClick={() => setIsModalOpen(true)}
                        sx={{
                          color: "#666",
                          backgroundColor: "transparent",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                            color: "#2566b0",
                          },
                        }}
                      >
                        <OpenInFullIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                  <div className="flex flex-col ">
                    {!item?.subject && (
                      <>
                        <div
                          className={`flex items-center gap-2 ${
                            isCurrentUser ? "justify-start" : "justify-end"
                          }`}
                        >
                          <img src={isCurrentUser ? email : web} alt="ip" />
                          <span className="text-xs text-gray-400 ">
                            {item?.repliedAt?.timestamp}
                          </span>{" "}
                          {/* OpenInFull Icon - Only visible on hover */}
                          {isHovered && (
                            <IconButton
                              size="small"
                              onClick={() => setIsModalOpen(true)}
                              sx={{
                                color: "#666",
                                backgroundColor: "transparent",
                                "&:hover": {
                                  backgroundColor: "#f5f5f5",
                                  color: "#2566b0",
                                },
                              }}
                            >
                              <OpenInFullIcon fontSize="small" />
                            </IconButton>
                          )}
                          <CustomToolTip
                            title={renderReplyOption}
                            open={isModalOpen2}
                            // close={() => setIsModalOpen2(false)}
                            // open={isOpen}

                            placement={"bottom"}
                          >
                            <IconButton
                              ref={optionsRef}
                              size="small"
                              onClick={() => setIsModalOpen2(true)}
                              sx={{
                                color: "#666",
                                backgroundColor: "transparent",
                                "&:hover": {
                                  backgroundColor: "#f5f5f5",
                                  color: "#2566b0",
                                },
                              }}
                            >
                              <ArrowDropDownIcon
                                fontSize="small"
                                sx={{
                                  transform: isModalOpen2
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s ease",
                                }}
                              />
                            </IconButton>
                          </CustomToolTip>
                        </div>
                        <span className="text-xs text-gray-500">
                          {bubbleFooter}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className="w-4/5 text-xs text-gray-500 my-3 message-container"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeMessageHtml(
                      decodeHtmlEntities(item?.message ?? item?.body)
                    ),
                  }}
                />

                {item?.attachments?.length > 0 && (
                  <div className="mt-4">
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Attachments ({item?.attachments?.length} files)
                    </Typography>
                    <List
                      disablePadding
                      sx={{ width: 260, bgcolor: "transparent", px: 0.8 }}
                    >
                      {item?.attachments?.map((file: any) => (
                        <ListItem disablePadding key={file?.fileSignature}>
                          <ListItemText
                            primary={
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>
                                    <img
                                      src={fileicon}
                                      alt=""
                                      className="w-5"
                                    />
                                  </span>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      maxWidth: "120px", // adjust width
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      verticalAlign: "bottom",
                                    }}
                                  >
                                    {file?.fileName}
                                  </span>
                                </div>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setTrackDownloadId(file?.fileSignature);
                                    downloadFile(
                                      file?.fileSignature,
                                      file?.fileName
                                    );
                                  }}
                                >
                                  {isDownloading &&
                                  trackDownloadId === file?.fileSignature ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DownloadIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </div>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </div>
                )}
              </div>
            </div>
            {!item?.subject && (
              <div
                className="flex items-center justify-between w-full py-3 px-8 bg-white border-t-2 border-[#c3d9ff] bg-[#e2f2fd] rounded-b-lg"
                style={{
                  borderTopColor: isReported
                    ? "#ffb6b6"
                    : item?.entryType === "PrvN"
                    ? "#f8d2a4ff"
                    : "#c3d9ff",
                }}
              >
                {/* {item?.attachments.length > 0 ? (
                <span className="text-xs text-gray-500 cursor-pointer hover:text-decoration-underline ">
                  {item?.attachments.fileName}
                </span>
              ) : ( */}
                <span />
                {/* )} */}
                {!isCurrentUser && (
                  <span className="flex gap-1">
                    <Rating
                      name="rate-of-thread"
                      value={ratingValue}
                      onChange={(event, newValue: any) =>
                        handleReview(newValue)
                      }
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={(e: any) => {
          e.stopPropagation();
          setIsModalOpen(false);
        }}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={isModalOpen}>
          <Box
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "95vw",
              height: "90vh",
              maxWidth: "1400px",
              maxHeight: "90vh",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <Box
              sx={{
                width: "100%",
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f8f9fa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 3,
                py: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={item?.replyType === "AGENT" ? agentAvatar : userAvatar}
                  alt={item?.replyType}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#2566b0" }}
                  >
                    {item?.repliedBy?.name ?? item?.ticketId ?? "User"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {item?.repliedAt?.timestamp}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setIsModalOpen(false)}
                sx={{
                  color: "#666",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    color: "#2566b0",
                  },
                }}
              >
                <CloseFullscreenIcon
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    transform: "rotate(180deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </IconButton>
            </Box>

            {/* Modal Content */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                backgroundColor: bubbleBackgroundColor,
              }}
            >
              {/* Message Content */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "white",
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                  height: "100%",
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#333", lineHeight: 1.6 }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeMessageHtml(
                        decodeHtmlEntities(item?.message ?? item?.body)
                      ),
                    }}
                  />
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "#fffde7",

                borderTop: "1px solid #fbc02d",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#666" }}>
                {bubbleFooter}
              </Typography>
              {!!item?.subject ||
                (!isCurrentUser && (
                  <Rating
                    name="rate-of-thread"
                    value={ratingValue}
                    onChange={(event, newValue: any) => handleReview(newValue)}
                  />
                ))}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

const ThreadList = ({
  thread,
  onReplyClick,
  onForward,
  subject,
  openOptionsId,
  onToggleOptions,
}: any) => {
  return (
    <div className="">
      {thread && thread.length > 0 ? (
        thread.map((item: any, idx: number) => {
          const next = thread[idx + 1];
          const isCurrentStaff = item?.replyType === "S";
          const isNextStaff = next ? next?.replyType === "S" : undefined;
          const marginBottomClass =
            next === undefined || isCurrentStaff !== isNextStaff
              ? "mb-10"
              : "mb-3";

          return (
            <ThreadItem
              key={idx}
              item={item}
              onReplyClick={onReplyClick}
              onForward={onForward}
              marginBottomClass={marginBottomClass}
              subjectTitle={subject.subject}
              openOptionsId={openOptionsId}
              onToggleOptions={onToggleOptions}
            />
          );
        })
      ) : (
        // <div className="text-gray-400">No thread items.</div>
        <ThreadItem
          item={subject}
          onReplyClick={onReplyClick}
          onForward={onForward}
          marginBottomClass={""}
          openOptionsId={openOptionsId}
          onToggleOptions={onToggleOptions}
          // subjectTitle={subject.subject}
        />
      )}
    </div>
  );
};

const TicketThreadSection = ({
  thread,
  header,
  onForward,
  showReplyEditor,
  showEditorNote,
  onCloseReply,
  onCloseEditorNote,
  value,
  onThreadAdded,
}: any) => {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { refetch } = useGetAttacedFileQuery({ ticketId: header?.ticketId });

  // Global state for managing which reply options panel is open
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null);

  // Function to toggle reply options panel
  const handleToggleOptions = (entryId: string | null) => {
    setOpenOptionsId(entryId);
  };

  const [commonApi, { isLoading: threadLoading }] = useCommanApiMutation();
  const [showEditor, setShowEditor] = useState<any>(false);
  const [isSubmitDisabledByWordLimit, setIsSubmitDisabledByWordLimit] =
    useState(false);
  const [showShotcut, setShowShotcut] = useState(false);
  const [slashTriggered, setSlashTriggered] = useState(false);
  const shotcutRef = React.useRef(null);
  const [stateChangeKey, setStateChangeKey] = useState(0);
  const [isEditorExpended, setIsEditorExpended] = useState(false);
  const [selectedOptionValue, setSelectedOptionValue] = useState("1");
  const [images, setImages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [canned, setCanned] = useState(false);
  const [suggest, setSuggest] = useState(false);
  const [selectedValue, setSelectedValue] = useState("public");
  //@ts-ignore
  const { isReply, replyValue, selectedIndex } = useSelector(
    (state: RootState) => state.shotcut
  );
  const [isReplyStatusOpen, setIsReplyStatusOpen] = useState<boolean>(false);
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedButtonText, setSelectedButtonText] = useState<string>(
    "Submit as In Progress"
  );
  const [signature, setSignature] = useState("");
  const [signatureUpdateKey, setSignatureUpdateKey] = useState(0);
  const [shouldFocusEditor, setShouldFocusEditor] = useState(false);
  const [shouldFocusNotify, setShouldFocusNotify] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState<any>(false);
  const [notifyTag, setNotifyTag] = useState([]);
  const { data: shortcutList, isLoading: shortcutLoading } =
    useGetShortCutListQuery({ refetchOnMountOrArgChange: true, skip: suggest });
  const [attachedFile, { isLoading: attachedLoading }] =
    useAttachedFileMutation();

  const handleChangeValue = (event: any) => {
    setSelectedValue(event);
    // setShowBcc(false);
  };

  const handleSignatureChange = (event: string) => {
    setSelectedOptionValue(event);

    // Get selected signature object
    const selectedSignature = signatureValues.find(
      (sig: any) => sig.value === event
    );

    if (selectedSignature) {
      if (selectedSignature.value === "1") {
        // "None" → clear signature
        setSignature(""); // Clear signature state
      } else {
        // Set new signature content
        setSignature(selectedSignature.signature); // Update signature state
      }

      // Force editor re-render
      setSignatureUpdateKey((prev) => prev + 1);
    }
  };

  // console.log(signature,"Signature Value");

  // Function to check if current content has a signature
  const hasSignature = (content: string) => {
    return content?.includes("Best regards,") && selectedOptionValue !== "1";
  };

  // Function to get current signature name
  const getCurrentSignatureName = () => {
    const currentSignature = signatureValues.find(
      (sig: any) => sig.value === selectedOptionValue
    );
    return currentSignature?.name || "None";
  };

  const handleEditorChange = (value: string) => {
    if (value === null) {
      return;
    }

    // Check for slash commands without stripping HTML
    const textForSlashCheck = value?.replace(/<[^>]*>/g, "");

    if (!slashTriggered && textForSlashCheck?.includes("/")) {
      setShowShotcut(true);
      setSlashTriggered(true);
    }

    // Reset trigger if "/" is removed
    if (!textForSlashCheck.includes("/")) {
      setSlashTriggered(false);
    }

    dispatch(setReplyValue(value));
  };
  useEffect(() => {
    if (slashTriggered || !replyValue) return;
    setShowShotcut(false);
  }, [slashTriggered, replyValue]);

  // Handler for Reply button
  const handleReplyButton = () => {
    const newShowEditor = !showEditor;

    setShowEditor(newShowEditor);
    if (newShowEditor) {
      setShouldFocusEditor(true);
    }
  };

  useEffect(() => {
    if (!value) return;
    handleReplyButton();
    if (value === "Add note") {
      setSelectedValue("private");
      setShouldFocusNotify(true);
    } else {
      setShouldFocusNotify(false);
    }
  }, [value]);

  const handleIconClick = () => {
    if (images.length > 3) {
      alert("You can upload a maximum of 4 images");
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file, file.name);
    formData.append("ticket", String(header?.ticketId));

    attachedFile(formData)
      .then((res: any) => {
        if (res?.data?.success !== true) {
          showToast(res?.data?.message || "Image upload failed", "error");
          return;
        }
        const data = res?.data?.data;
        const imageData = {
          fileId: data?.signature,
          name: data?.fileName,
          size: data?.size,
          type: data?.mime,
        };
        setImages((prevImages: any) => [...prevImages, imageData]);
      })
      .catch((err: any) => {
        showToast(err?.data?.message || "Image upload failed", "error");
      });
  };

  // Extract signature key from an uploaded image URL
  const extractSignatureFromUrl = (url: string): string | null => {
    try {
      // match last hyphen-separated token before extension, e.g. ...-ac2dd664.png
      const match = url.match(
        /-([a-zA-Z0-9]+)\.(png|jpg|jpeg|gif|webp)(\?.*)?$/
      );
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Upload a data URL image and return signature key
  const uploadDataUrlImage = async (
    dataUrl: string,
    ticket: string | number
  ) => {
    // Convert data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `pasted_${Date.now()}.png`, {
      type: blob.type || "image/png",
    });

    const formData = new FormData();
    formData.append("image", file, file.name);
    formData.append("ticket", String(ticket));

    const headers = createFormDataHeaders(true);

    const endpoint = `${process.env.REACT_APP_API_URL}ticket/reply/image/upload`;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await resp.json();
    if (data?.status !== true) {
      throw new Error(data?.message || "Image upload failed");
    }
    const signature = data?.data?.signature || data?.signature;
    if (!signature) throw new Error("Upload succeeded but signature missing");
    return signature as string;
  };

  // Transform editor HTML to replace images with signature;{key}
  const transformMessageHtmlForSubmit = async (
    html: string
  ): Promise<string> => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html || "", "text/html");
      const imgs = Array.from(doc.body.querySelectorAll("img"));
      // Process images sequentially; ensure exactly one signature per logical image
      for (const img of imgs) {
        const src = img.getAttribute("src") || "";
        if (!src) continue;
        if (src.startsWith("data:image")) {
          // Upload inline base64 image and replace with signature token
          const sig = await uploadDataUrlImage(src, header?.ticketId);
          img.setAttribute("src", `signature;${sig}`);
        } else {
          const sig = extractSignatureFromUrl(src);
          if (sig) {
            img.setAttribute("src", `signature;${sig}`);
          }
        }
      }
      // Deduplicate any duplicated consecutive signature images that Quill might have inserted
      const cleanImgs = Array.from(doc.body.querySelectorAll("img"));
      const toRemove: Element[] = [];
      for (let i = 1; i < cleanImgs.length; i++) {
        const prev = cleanImgs[i - 1];
        const curr = cleanImgs[i];
        const ps = prev.getAttribute("src") || "";
        const cs = curr.getAttribute("src") || "";
        if (
          ps.startsWith("signature;") &&
          cs.startsWith("signature;") &&
          ps === cs
        ) {
          toRemove.push(curr);
        }
      }
      toRemove.forEach((el) => el.parentElement?.removeChild(el));
      return doc.body.innerHTML;
    } catch {
      return html;
    }
  };

  // Handler for Save button
  const handleSave = async () => {
    if (replyValue === null || !replyValue) {
      return;
    }

    const finalMessage = await transformMessageHtmlForSubmit(replyValue);

    const payload = {
      url: "reply-ticket",
      body: {
        ticket: header?.ticketId,

        reply: {
          type: selectedValue,
          isReply: isReply === true ? "R" : "N",
          to: "example@example.com",
          cc: [],
          bcc: [],
          message: finalMessage,
          signatureKey: signature,
          attachments: [
            {
              filename: "image.jpg",
              base64_data: images,
            },
          ],
          note: notifyTag.map((item: any) => item?.email) ?? [],
        },
      },
    };

    commonApi(payload)
      .then((res: any) => {
        dispatch(setReplyValue(""));
        setSignature("");
        setSelectedOptionValue("1");
        setSignatureUpdateKey(0);
        setShowEditor(false);
        // Optimistically append the new thread item without refetching
        try {
          const serverData = res?.data?.data || {};
          const newThreadItem = {
            entryId: serverData?.entryId || `temp-${Date.now()}`,
            message: finalMessage,
            body: finalMessage,
            repliedBy: serverData?.repliedBy || {
              name: header?.agentName || "You",
            },
            replyType: "AGENT",
            subject: null,
            attachments:
              images?.map((img) => ({
                fileSignature: img?.fileId,
                fileName: img?.name,
                size: img?.size,
                mime: img?.type,
              })) || [],
            isFlagged: false,
            entryType: selectedValue === "private" ? "PrvN" : "pbR",
            repliedAt: { timestamp: new Date().toISOString() },
          };
          onThreadAdded && onThreadAdded(newThreadItem);
        } catch (_) {
          // noop if parent does not handle
        }
        // Keep existing refetch for attachments only
        refetch();
        if (onCloseReply) onCloseReply();
      })
      .catch((error: any) => {
        console.error(error);
      });
  };

  const handleRemoveImage = (id: string | number) => {
    const updatedImages = images.filter((image) => image.fileId !== id);
    setImages(updatedImages);
  };

  const onReplyClose = () => {
    setShowEditor(false);
    setShouldFocusEditor(false);
    onCloseReply();
    onCloseEditorNote();
  };

  useEffect(() => {
    if (showReplyEditor || showEditorNote) {
      setShowEditor(true);
      setShouldFocusEditor(true);
    }
  }, [showEditorNote, showReplyEditor]);

  return (
    <div className="flex flex-col gap-2  w-full h-[100%]  overflow-hidden border border-r-2 border-[#e0e0e0]">
      <div className="w-full p-2 ">
        <div className="sticky top-0 z-[99]">
          <TicketSubjectBar header={header} />
        </div>
        <div className="flex flex-col gap-0 w-full h-[calc(100vh-272px)]  overflow-y-auto relative  will-change-transform ">
          <ThreadList
            thread={thread}
            onForward={onForward}
            subject={header}
            openOptionsId={openOptionsId}
            onToggleOptions={handleToggleOptions}
          />
        </div>
        <div
          className="rounded p-1 w-[75.8%]  bg-white  flex z-[999] absolute bottom-0 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)"
          id="reply-editor-container"
        >
          <Accordion
            elevation={0}
            expanded={showEditor || showReplyEditor || showEditorNote}
            onChange={handleReplyButton}
            sx={{
              width: "100%",
              position: "relative",
              background: "transparent",
              boxShadow: "none",
              "&:before": { display: "none" },
            }}
          >
            {/* {!showEditor && !showReplyEditor && !showEditorNote && ( */}
            <AccordionSummary
              component="div"
              expandIcon={
                showEditor || showReplyEditor || showEditorNote ? null : (
                  <ExpandMoreIcon sx={{ transform: "rotate(180deg)" }} />
                )
              }
              aria-controls="panel2-content"
              id="panel2-header"
              sx={{
                // mx: 1,

                backgroundColor:
                  showEditor || showReplyEditor || showEditorNote
                    ? "transparent"
                    : "#f9fafb",
                border:
                  showEditor || showReplyEditor || showEditorNote
                    ? "none"
                    : "1px solid #d1d5db",
                borderRadius: "50px",
                padding: "0px 20px",
                // width: "100% !important",
                minHeight: "55px !important",
                display:
                  !showEditor && !showReplyEditor && !showEditorNote
                    ? "flex"
                    : "none",
                alignItems: "center",
                cursor: "text !important",
                "&:hover": {
                  borderColor:
                    showEditor || showReplyEditor || showEditorNote
                      ? "transparent"
                      : "#9ca3af",
                  backgroundColor:
                    showEditor || showReplyEditor || showEditorNote
                      ? "transparent"
                      : "#f3f4f6",
                },
                "& .MuiAccordionSummary-content": {
                  margin: 0,
                  borderRadius: "none",
                },
              }}
            >
              <div className="flex items-center justify-between w-full">
                <Typography
                  component="span"
                  sx={{
                    fontSize: "14px",
                    color: "#374151",
                    fontStyle: "italic",
                    borderRadius: "none",
                  }}
                >
                  Reply....
                </Typography>
              </div>
            </AccordionSummary>
            {/* )} */}

            <AccordionDetails sx={{ p: 0, height: "100%" }}>
              <div
                ref={shotcutRef}
                style={{
                  overflow: "hidden",
                  padding: 0,
                  maxHeight: "100%",
                }}
              >
                <StackEditor
                  initialContent={replyValue}
                  signatureValue={signature}
                  onChange={(value: any) => handleEditorChange(value)}
                  isEditorExpended={isEditorExpended}
                  isExpended={() => setIsEditorExpended(!isEditorExpended)}
                  onCloseReply={onReplyClose}
                  isValues={value}
                  onForward={onForward}
                  shouldFocus={shouldFocusEditor}
                  shouldFocusNotify={shouldFocusNotify}
                  onFocus={() => {
                    setShouldFocusEditor(false);
                    setShouldFocusNotify(false);
                  }}
                  handleChangeValue={handleChangeValue}
                  selectedValue={selectedValue}
                  changeNotify={(value: any) => setNotifyTag(value)}
                  notifyTag={notifyTag}
                  // ticketId={header?.ticketId}
                  setIsReply={(value: any) => dispatch(setIsReply(value))}
                  ticketData={header}
                  onWordLimitChange={({ remainingWords }: any) => {
                    setIsSubmitDisabledByWordLimit(remainingWords <= 0);
                  }}
                />
              </div>

              <div className="w-full flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <FormControl fullWidth>
                    <Select
                      value={selectedOptionValue}
                      onChange={(e) => {
                        handleSignatureChange(e.target.value);
                      }}
                      size="small"
                      sx={{
                        width: 300,
                        "& fieldset": { border: "none" },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      }}
                    >
                      {signatureValues.map((item: any) => (
                        <MenuItem
                          key={item?.id}
                          value={item?.value}
                          sx={{ width: 300 }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{item?.name}</span>
                            {hasSignature(replyValue) &&
                              item.value === selectedOptionValue &&
                              item.value !== "1" && (
                                <Chip
                                  label="Active"
                                  size="small"
                                  color="success"
                                  sx={{ fontSize: "0.7rem", height: "20px" }}
                                />
                              )}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <div className="flex items-center gap-2 ">
                    {images?.length > 0 && (
                      <CustomToolTip
                        title={
                          <ImageViewComponent
                            images={images}
                            handleRemove={(id: any) => handleRemoveImage(id)}
                            ticketId={header?.ticketId}
                          />
                        }
                        open={showImagesModal}
                        close={() => setShowImagesModal(false)}
                        placement={"top"}
                        width={400}
                      >
                        <span
                          className="bg-[#2566b0] w-6 text-sm rounded-full h-6 flex items-center justify-center text-white cursor-pointer"
                          onClick={() => setShowImagesModal(true)}
                        >
                          {images.length}
                        </span>
                      </CustomToolTip>
                    )}
                    <Divider orientation="vertical" flexItem />
                    <Tooltip
                      title={"Attach file < 10MB"}
                      placement={"top-start"}
                    >
                      <div className="flex items-center gap-1">
                        {" "}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        {attachedLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <IconButton size="small" onClick={handleIconClick}>
                            <AttachFileIcon
                              fontSize="small"
                              sx={{ transform: "rotate(45deg)" }}
                            />
                          </IconButton>
                        )}
                      </div>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem />
                    <Tooltip title={"Canned Responses"}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSuggest(false);
                          setCanned(!canned);
                        }}
                      >
                        <PublishedWithChangesIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem />
                    <Tooltip title={"Suggested Solutions"}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCanned(false);
                          setSuggest(!suggest);
                        }}
                      >
                        <MenuBookIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex items-center gap-2 mx-2">
                  <Button
                    variant="contained"
                    onClick={() => {
                      dispatch(setReplyValue(""));
                      setSignature("");
                      setSelectedOptionValue("1");
                      setStateChangeKey((prev) => prev + 1);
                      setSignatureUpdateKey(0);
                      setNotifyTag([]);
                      setImages([]);
                    }}
                    sx={{
                      backgroundColor: "#e5e7eb",
                      color: "#374151", // Tailwind: text-gray-700
                      fontWeight: 600,
                      fontSize: "0.875rem", // text-sm
                      padding: "6px 16px", // py-1.5 px-4
                      borderRadius: "0.375rem", // rounded
                      "&:hover": {
                        backgroundColor: "#d1d5db", // Tailwind: hover:bg-gray-300
                      },
                    }}
                  >
                    Reset
                  </Button>

                  <CustomToolTip
                    title={
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "#fff", px: 1, py: 0.6 }}
                      >{`Submit as ${header?.status?.name}`}</Typography>
                    }
                    bg="#000000b2"
                  >
                    <Button
                      onClick={handleSave}
                      disabled={threadLoading || isSubmitDisabledByWordLimit}
                      sx={{
                        backgroundColor: "#374151",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        padding: "6px 16px",
                        borderRadius: "0.375rem",
                        "&:hover": {
                          backgroundColor: "#4b5563",
                        },
                        "&:disabled": {
                          backgroundColor: "#374151",
                          opacity: 0.7,
                        },
                      }}
                    >
                      {threadLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </CustomToolTip>

                  {/* Status Dropdown Menu */}
                  <Menu
                    anchorEl={statusMenuAnchorEl}
                    open={isReplyStatusOpen}
                    onClose={() => {
                      setIsReplyStatusOpen(false);
                      setStatusMenuAnchorEl(null);
                    }}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    PaperProps={{
                      sx: {
                        mb: 0.5,
                        minWidth: 200,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      },
                    }}
                  >
                    <ReplyStatusOptions
                      onSetData={(data: any) => {
                        // data should contain both value and label
                        if (data?.label) {
                          setSelectedButtonText(data.label);
                        }
                        setIsReplyStatusOpen(false);
                        setStatusMenuAnchorEl(null);
                        // You can add logic here to handle the status change
                      }}
                    />
                  </Menu>
                </div>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>

      <CustomSideBarPanel
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PublishedWithChangesIcon fontSize="small" />
            <Typography sx={{ flex: 1, fontSize: "17px", fontWeight: 600 }}>
              Canned Responses
            </Typography>
          </Box>
        }
        open={canned}
        close={() => setCanned(false)}
        width={600}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100% - 64px)",
            gap: 2,
            p: 2,
            overflow: "auto",
          }}
        >
          {/* Accordion Item 1 */}
          <Accordion>
            <AccordionSummary
              component="div"
              expandIcon={<ExpandMoreIcon />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                },
              }}
            >
              {/* Left Section (Expand Icon + Title) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Section 1</Typography>
              </Box>

              <IconButton
                size="small"
                onClick={(e: any) => {
                  e.stopPropagation(); // Prevent accordion toggle

                  dispatch(
                    setReplyValue(
                      replyValue + "Content for section 1 inside the drawer."
                    )
                  );
                }}
              >
                <AddBoxIcon />
              </IconButton>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Content for section 1 inside the drawer.</Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </CustomSideBarPanel>

      <CustomSideBarPanel
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <MenuBookIcon fontSize="small" />
            <Typography sx={{ flex: 1, fontSize: "17px", fontWeight: 600 }}>
              Solution
            </Typography>
          </Box>
        }
        open={suggest}
        close={() => setSuggest(false)}
        width={600}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100% - 64px)",
            gap: 2,
            p: 2,
            overflow: "auto",
          }}
        >
          {shortcutList?.length > 0 ? (
            <>
              {(shortcutList ?? [])?.map((item: any) => (
                <ListItem
                  key={item.key}
                  disablePadding
                  sx={{
                    backgroundColor: "#fff",
                    borderBottom: "1px solid #e5e7eb", // Tailwind border-gray-200
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box display="flex" gap={2} width="100%" alignItems="center">
                    <Box flex={1}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          color: "#2c3e50",
                          fontSize: "0.9rem",
                          lineHeight: 1.2,
                          mb: 0.5,
                        }}
                      >
                        {item.shortcut}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#4b5563", // Tailwind text-gray-600
                          fontSize: "0.85rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          dispatch(setReplyValue(replyValue + item.text));
                        }}
                      >
                        <AddBoxIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center mt-4">
              <img src={emptyimg} alt="notes" className="mx-auto w-40 h-40" />
            </div>
          )}
        </Box>
      </CustomSideBarPanel>

      {isSuccessModal && (
        <CustomModal
          open={isSuccessModal}
          onClose={() => {}}
          title={"Ticket Save"}
          msg="Ticket save successfully"
          primaryButton={{
            title: "Go Next",
            onClick: () => {},
          }}
          secondaryButton={{
            title: "Ticket List",
            onClick: () => {
              setIsSuccessModal(false);
            },
          }}
        />
      )}
    </div>
  );
};

export default TicketThreadSection;
