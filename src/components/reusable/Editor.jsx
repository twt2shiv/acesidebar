import React, { useEffect, useState, useRef } from "react";
import { Editor } from "primereact/editor";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckIcon from "@mui/icons-material/Check";
import ReplyIcon from "@mui/icons-material/Reply";
import FlakyIcon from "@mui/icons-material/Flaky";
import PrivateConnectivityIcon from "@mui/icons-material/PrivateConnectivity";
import PublicIcon from "@mui/icons-material/Public";
import { useDispatch, useSelector } from "react-redux";

import {
  Avatar,
  IconButton,
  Paper,
  Typography,
  ClickAwayListener,
  MenuList,
  MenuItem,
  FormControl,
  Select,
  Chip,
  LinearProgress,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomToolTip from "../../reusable/CustomToolTip";
import { useToast } from "../../hooks/useToast";
import { useUploadFileApiMutation } from "../../services/uploadDocServices";
import EmailAutocomplete from "./EmailAutocomplete";

import { useLazyGetAgentsBySeachQuery } from "../../services/agentServices";
import { setSelectedIndex } from "../../reduxStore/Slices/shotcutSlices";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import avatarEditor from "../../assets/icons/avatar-editor.png";

const MAX_WORDS = 350;

const selectionsOptions = [
  {
    id: 1,
    name: "Reply",
    value: "1",
  },
  {
    id: 2,
    name: "Add note",
    value: "2",
  },
  {
    id: 4,
    name: "Need Approval",
    value: "4",
  },
];
const optionsofPrivate = [
  {
    id: 1,
    icon: <PrivateConnectivityIcon fontSize="small" />,
    title: "Private",
    subTitle: "Only visible to you",
    value: "private",
  },
  {
    id: 2,
    icon: <PublicIcon fontSize="small" />,
    title: "Public",
    subTitle: "Visible to everyone",
    value: "public",
  },
];

const StackEditor = ({
  initialContent,
  onChange,
  isFull = true,
  shouldFocus = false,
  shouldFocusNotify = false,
  onFocus,
  removeIcon = false,

  ...props
}) => {
  const {
    isEditorExpended,
    onCloseReply,
    signatureValue,
    isValues,
    customHeight = "calc(100vh - 368px)",
    handleChangeValue,
    selectedValue,
    changeNotify = () => {},
    notifyTag = [],

    ticketData,
    setIsReply,
    onWordLimitChange = () => {},
  } = props;
  const ticketId = ticketData?.ticketId;

  const isMounted = React.useRef(true);
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef(null);
  const signatureEditorRef = useRef(null);
  const notifyInputRef = useRef(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const optionsRef = React.useRef(null);
  const { selectedIndex } = useSelector((state) => state.shotcut);
  const [showCc, setShowCc] = React.useState(false);
  const [showBcc, setShowBcc] = React.useState(false);
  const [optionChangeKey, setOptionChangeKey] = useState(0);
  const [currentSignature, setCurrentSignature] = useState("");
  const [ccValue, setCcValue] = React.useState([]);
  const [bccValue, setBccValue] = React.useState([]);
  const [localNotifyTag, setLocalNotifyTag] = React.useState(notifyTag || []);
  const [approvalTo, setApprovalTo] = React.useState([]);
  const [approvalCc, setApprovalCc] = React.useState([]);
  const [showApprovalCc, setShowApprovalCc] = React.useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadFileApi] = useUploadFileApiMutation();
  const [triggerSeachAgent] = useLazyGetAgentsBySeachQuery();
  const [wordCount, setWordCount] = React.useState(0);
  const [remainingWords, setRemainingWords] = React.useState(MAX_WORDS);

  const normalizePlainText = React.useCallback((value = "") => {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const getWordCountFromPlainText = React.useCallback(
    (value = "") => {
      const normalized = normalizePlainText(value);
      if (!normalized) return 0;

      const tokens = normalized.split(" ");

      return tokens.reduce((count, token) => {
        const cleanedToken = token.replace(/[^\p{L}\p{N}]/gu, "");
        if (cleanedToken.length >= 3) {
          return count + 1;
        }
        return count;
      }, 0);
    },
    [normalizePlainText]
  );

  const getPlainTextFromHtml = React.useCallback((html = "") => {
    if (typeof window === "undefined") {
      return html;
    }
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    return text;
  }, []);

  const updateWordMetrics = React.useCallback(
    (plainText = "") => {
      const count = getWordCountFromPlainText(plainText);
      const remaining = Math.max(0, MAX_WORDS - count);

      setWordCount(count);
      setRemainingWords(remaining);

      onWordLimitChange({
        wordCount: count,
        remainingWords: remaining,
        isLimitReached: remaining <= 0,
      });

      return count;
    },
    [getWordCountFromPlainText, onWordLimitChange, showToast]
  );

  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (a[i].email !== b[i].email || a[i].name !== b[i].name) {
        return false;
      }
    }
    return true;
  };

  const handleSelectedOption = (newValue) => {
    setLocalNotifyTag(newValue);
    changeNotify(newValue);
  };

  const handleApprovalToChange = (value) => {
    const normalized = Array.isArray(value) ? value : value ? [value] : [];
    setApprovalTo(normalized);
  };

  const handleApprovalCcChange = (value) => {
    const normalized = Array.isArray(value) ? value : value ? [value] : [];
    setApprovalCc(normalized);
  };

  // Handle deletion for all Autocomplete components
  const handleDelete = (index, type) => {
    if (type === "cc") {
      const newCcValue = ccValue.filter((_, i) => i !== index);
      setCcValue(newCcValue);
    } else if (type === "bcc") {
      const newBccValue = bccValue.filter((_, i) => i !== index);
      setBccValue(newBccValue);
    } else if (type === "notify") {
      const newNotifyTag = localNotifyTag.filter((_, i) => i !== index);
      setLocalNotifyTag(newNotifyTag);
      changeNotify(newNotifyTag);
    } else if (type === "approvalTo") {
      const newApprovalTo = approvalTo.filter((_, i) => i !== index);
      handleApprovalToChange(newApprovalTo);
    } else if (type === "approvalCc") {
      const newApprovalCc = approvalCc.filter((_, i) => i !== index);
      handleApprovalCcChange(newApprovalCc);
    }
  };

  useEffect(() => {
    if (editorRef.current && shouldFocus) {
      const quill = editorRef.current.getQuill();
      if (quill) {
        setTimeout(() => {
          try {
            quill.focus();
            const length = quill.getLength();
            quill.setSelection(length, 0);
            if (onFocus) {
              onFocus();
            }
          } catch (error) {
            console.error("Error focusing quill editor:", error);
          }
        }, 300);
      } else {
        setTimeout(() => {
          const quill = editorRef.current?.getQuill();
          if (quill && shouldFocus) {
            try {
              quill.focus();
              const length = quill.getLength();
              quill.setSelection(length, 0);

              if (onFocus) {
                onFocus();
              }
            } catch (error) {
              console.error("Error focusing quill editor on retry:", error);
            }
          }
        }, 500);
      }
    }
  }, [shouldFocus, onFocus]);

  // Focus the Notify input when requested and when in Add note mode
  useEffect(() => {
    if (shouldFocusNotify && selectedIndex !== "1") {
      const inputEl = notifyInputRef.current;
      if (inputEl && typeof inputEl.focus === "function") {
        setTimeout(() => {
          try {
            inputEl.focus();
          } catch (e) {}
        }, 200);
      }
    }
  }, [shouldFocusNotify, selectedIndex]);

  useEffect(() => {
    if (shouldFocus && editorRef.current) {
      const timeoutId = setTimeout(() => {
        const quill = editorRef.current?.getQuill();
        if (quill && shouldFocus) {
          try {
            quill.focus();
            const length = quill.getLength();
            quill.setSelection(length, 0);

            if (onFocus) {
              onFocus();
            }
          } catch (error) {
            console.error("Error in additional focus attempt:", error);
          }
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocus, onFocus]);

  useEffect(() => {
    if (!isValues) return;
    if (isValues === "Reply") {
      dispatch(setSelectedIndex("1"));
    } else {
      dispatch(setSelectedIndex("2"));
    }
  }, [isValues]);

  useEffect(() => {
    if (signatureValue) {
      setCurrentSignature(signatureValue);
    } else {
      setCurrentSignature("");
    }
  }, [signatureValue]);

  useEffect(() => {
    if (notifyTag && !arraysEqual(notifyTag, localNotifyTag)) {
      setLocalNotifyTag(notifyTag);
    }
  }, [notifyTag]);

  useEffect(() => {
    let attached = false;
    let cancelled = false;

    const attachToolbarHandlers = () => {
      if (cancelled) return;
      const quill = editorRef.current?.getQuill?.();
      if (!quill) {
        setTimeout(attachToolbarHandlers, 300);
        return;
      }

      const toolbar = quill.getModule("toolbar");
      if (!toolbar) return;

      toolbar.addHandler("video", () => {
        const url = prompt("Enter video URL (YouTube, Vimeo, etc):");
        if (url) {
          const range = quill.getSelection();
          quill.insertEmbed(range.index, "video", url);
        }
      });

      // Override image button to upload to server instead of base64
      toolbar.addHandler("image", () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          try {
            const url = await uploadPastedImage(file);
            const range = quill.getSelection(true) || {
              index: quill.getLength(),
              length: 0,
            };
            quill.insertEmbed(range.index, "image", url, "user");
            quill.setSelection(range.index + 1, 0, "silent");
          } catch (err) {
            showToast(err?.message || "Failed to upload image", "error");
          }
        };
        input.click();
      });

      attached = true;
    };

    attachToolbarHandlers();
    return () => {
      cancelled = true;
      attached = false;
    };
  }, [optionChangeKey]);

  // Upload image helper
  const uploadPastedImage = async (file) => {
    setUploadingCount((c) => c + 1);
    const formData = new FormData();
    const fileName = file?.name || `pasted_${Date.now()}.png`;
    formData.append("image", file, fileName);
    formData.append("ticket", ticketId);

    try {
      const response = await uploadFileApi(formData);

      if (response?.data?.success !== true) {
        // throw new Error(response?.data?.message || "Image upload failed");
        showToast(response?.data?.message || "Image upload failed", "error");
      }

      const url = response?.data?.data?.url;
      if (!url) showToast("Upload succeeded but URL missing", "error");
      return url;
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  // Helpers to control image sizing inside the editor
  const IMAGE_DEFAULT_WIDTH = 45;
  const setImageElementSize = (imageElement) => {
    try {
      if (!imageElement) return;
      // imageElement.style.width = `${IMAGE_DEFAULT_WIDTH}%`;
      imageElement.style.maxWidth = `${IMAGE_DEFAULT_WIDTH}%`;
    } catch (_) {}
  };

  const setImageSizeByUrl = (quillInstance, imageUrl) => {
    try {
      if (!quillInstance || !imageUrl) return;
      const root = quillInstance.root;
      const imgs = Array.from(root.querySelectorAll("img"));
      imgs
        .filter((img) => (img?.src || "") === imageUrl)
        .forEach((img) => setImageElementSize(img));
    } catch (_) {}
  };

  // Handle paste images into editor: upload then insert URL
  useEffect(() => {
    let removeListener = () => {};
    let cancelled = false;
    let pasteInProgress = false;

    const attach = () => {
      if (cancelled) return;
      const quill = editorRef.current?.getQuill?.();
      if (!quill) {
        setTimeout(attach, 300);
        return;
      }

      const replaceDataUrlImagesInEditor = async () => {
        const root = quill.root;
        const imgs = Array.from(root.querySelectorAll("img"));
        const dataImgs = imgs.filter((img) =>
          (img?.src || "").startsWith("data:image")
        );
        for (const img of dataImgs) {
          try {
            const src = img.src;
            const res = await fetch(src);
            const blob = await res.blob();
            const file = new File([blob], `pasted_${Date.now()}.png`, {
              type: blob.type || "image/png",
            });
            const url = await uploadPastedImage(file);
            img.src = url;
            setImageElementSize(img);
          } catch (err) {
            // Remove the base64 image if upload fails
            try {
              img.remove();
            } catch (_) {}
            showToast(err?.message || "Failed to upload pasted image", "error");
          }
        }
      };

      const handlePaste = async (event) => {
        if (pasteInProgress) return; // de-duplicate re-entrant paste
        const clipboard = event.clipboardData;
        if (!clipboard) return;

        const items = clipboard.items ? Array.from(clipboard.items) : [];
        const filesList = clipboard.files ? Array.from(clipboard.files) : [];

        let imageFiles = [];
        if (items.length) {
          imageFiles = items
            .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
            .map((i) => i.getAsFile())
            .filter(Boolean);
        }

        if (imageFiles.length === 0 && filesList.length) {
          imageFiles = filesList.filter(
            (f) => f.type && f.type.startsWith("image/")
          );
        }

        // If there are file images in clipboard, prevent default and upload/insert
        if (imageFiles.length > 0) {
          event.preventDefault();
          try {
            event.stopPropagation();
          } catch (_) {}
          try {
            if (typeof event.stopImmediatePropagation === "function")
              event.stopImmediatePropagation();
          } catch (_) {}
          pasteInProgress = true;
          if (!process.env.REACT_APP_API_URL) {
            showToast("Missing API URL configuration", "error");
            pasteInProgress = false;
            return;
          }

          const originalSelection = quill.getSelection(true) || {
            index: quill.getLength(),
            length: 0,
          };

          for (const file of imageFiles) {
            try {
              const url = await uploadPastedImage(file);
              const currentIndex =
                (quill.getSelection(true)?.index ?? originalSelection.index) ||
                quill.getLength();
              quill.insertEmbed(currentIndex, "image", url, "user");
              quill.setSelection(currentIndex + 1, 0, "silent");
              setImageSizeByUrl(quill, url);
            } catch (err) {
              // On failure, ensure no base64 image remains
              const root = quill.root;
              const imgs = Array.from(root.querySelectorAll("img"));
              const dataImgs = imgs.filter((img) =>
                (img?.src || "").startsWith("data:image")
              );
              dataImgs.forEach((img) => {
                try {
                  img.remove();
                } catch (_) {}
              });
              showToast(err?.message || "Failed to upload image", "error");
            }
          }
          pasteInProgress = false;
          return;
        }

        // Otherwise let Quill paste happen, then replace any data URL images with uploaded URLs
        setTimeout(replaceDataUrlImagesInEditor, 0);
      };

      const root = quill.root;
      root.addEventListener("paste", handlePaste, true);
      removeListener = () =>
        root.removeEventListener("paste", handlePaste, true);
    };

    attach();
    return () => {
      cancelled = true;
      removeListener();
    };
  }, [optionChangeKey]);

  useEffect(() => {
    if (signatureEditorRef.current) {
      const quill = signatureEditorRef.current.getQuill();
      if (!quill) return;

      quill.enable(false);

      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .ql-editor {
          min-height: 100px !important;
          max-height: 150px !important;
          overflow-y: auto !important;
          background-color: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          padding: 12px !important;
          color: #6b7280 !important;
          font-style: italic !important;
        }
        
        .ql-editor:focus {
          outline: none !important;
          border-color: #d1d5db !important;
        }
        
        .ql-editor p {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .ql-editor strong {
          color: #374151 !important;
        }
      `;
      quill.root.appendChild(styleElement);
    }
  }, []);

  useEffect(() => {
    if (signatureEditorRef.current) {
      const quill = signatureEditorRef.current.getQuill();
      if (!quill) return;

      quill.root.innerHTML =
        currentSignature ||
        '<p style="color: #9ca3af; font-style: italic;">No signature selected</p>';
    }
  }, [currentSignature]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const focusEditor = React.useCallback(() => {
    const quill = editorRef.current?.getQuill?.();
    if (!quill) return;
    try {
      const length = quill.getLength();
      quill.focus();
      quill.setSelection(length, 0);
    } catch (error) {
      console.error("Failed to focus editor", error);
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    const html = initialContent || "";
    const plain = getPlainTextFromHtml(html);
    updateWordMetrics(plain);
  }, [initialContent, getPlainTextFromHtml, updateWordMetrics]);

  const handleEditorTextChange = React.useCallback(
    (event) => {
      const plainText = event?.textValue ?? "";
      const wordTotal = getWordCountFromPlainText(plainText);
      const quill = editorRef.current?.getQuill?.();

      if (wordTotal > MAX_WORDS) {
        quill?.history?.undo?.();
        return;
      }

      updateWordMetrics(plainText);
      onChange(event.htmlValue);
    },
    [getWordCountFromPlainText, onChange, updateWordMetrics]
  );

  const handleSelect = (index) => {
    setIsOptionsOpen(false);
    setIsReply(index === "2" ? false : true);
    dispatch(setSelectedIndex(index));
    setShowBcc(false);
    setShowCc(false);
    setShowApprovalCc(false);
    handleApprovalToChange([]);
    handleApprovalCcChange([]);

    setOptionChangeKey((prevKey) => prevKey + 1);

    setTimeout(focusEditor, 150);
  };

  const renderHeader = () => {
    return (
      <div className="w-full flex justify-between items-center p-0 ">
        <div className="w-full">
          <span className="ql-formats ">
            <button className="ql-code" aria-label="Code"></button>

            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
            {!removeIcon && (
              <>
                <button className="ql-link" aria-label="Link"></button>{" "}
                <button className="ql-image" aria-label="Image"></button>
              </>
            )}

            {/* <button className="ql-video" aria-label="Video"></button> */}

            <select className="ql-color " aria-label="Font Color"></select>
          </span>
        </div>

        {isFull && (
          <div className="space-x-3 flex items-center w-full justify-end">
            {remainingWords <= 50 && (
              <span
                className={`text-xs font-medium ${
                  remainingWords <= 20 ? "text-red-500" : "text-orange-500"
                }`}
              >
                {remainingWords} words left
              </span>
            )}
            <button
              className="ql-fullscreen"
              aria-label="Full Screen"
              onClick={toggleFullscreen}
            >
              <FullscreenIcon fontSize="small" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const header = renderHeader();
  const handleClose = (event) => {
    if (optionsRef.current && optionsRef.current.contains(event.target)) {
      return;
    }

    setIsOptionsOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setIsOptionsOpen(false);
    } else if (event.key === "Escape") {
      setIsOptionsOpen(false);
    }
  }

  const renderIcon =
    selectedIndex === "1" ? (
      <ReplyIcon fontSize="small" />
    ) : selectedIndex === "4" ? (
      <FlakyIcon fontSize="small" />
    ) : null;

  const renderComponentBasedOnSelection = (
    <div className="flex items-center  ">
      {selectedIndex === "1" ? (
        <span className="text-sm  ">Email: {ticketData?.assignee?.email}</span>
      ) : selectedIndex === "4" ? (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-gray-700">
            Need Approval
          </span>
          <span className="text-xs text-gray-500">Only visible to you</span>
        </div>
      ) : (
        // <Box sx={{ minWidth: 200 }}>
        <FormControl fullWidth>
          {/* <InputLabel id="demo-simple-select-label">Add Element</InputLabel> */}
          <Select
            id="demo-simple-select"
            value={selectedValue}
            onChange={(e) => handleChangeValue(e.target.value)}
            MenuProps={{
              sx: {
                zIndex: isFullscreen ? 10001 : 9999,
              },
            }}
            sx={{
              height: 40,
              width: 300,
              "& fieldset": { border: "none" }, // Removes the outline border
              "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Another safe way
            }}
          >
            {optionsofPrivate.map((item) => (
              <MenuItem key={item?.id} value={item?.value} sx={{ width: 300 }}>
                <div className="flex items-center gap-2">
                  <div>{item?.icon}</div>
                  <div className="flex flex-col ">
                    <span>{item?.title}</span>
                    <span className="text-xs text-gray-500">
                      {item?.subTitle}
                    </span>
                  </div>
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        // </Box>
      )}
    </div>
  );
  const renderToolTipComponent = (
    <Paper
      elevation={0}
      sx={{
        boxShadow: "0 2px 4px rgba(202, 202, 202, 0.8)",
      }}
    >
      <ClickAwayListener onClickAway={handleClose}>
        <MenuList
          autoFocusItem={isOptionsOpen}
          id="composition-menu"
          aria-labelledby="composition-button"
          onKeyDown={handleListKeyDown}
        >
          {selectionsOptions.map((item, index) => {
            const isSelected = selectedIndex === item.value;
            return (
              <MenuItem
                key={index}
                onClick={() => handleSelect(item.value)}
                selected={isSelected}
                sx={{
                  mb: 0.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  borderRadius: "0px",
                  // px: 2,
                  // py: 1,
                  backgroundColor: isSelected ? "#000" : "transparent",
                  color: isSelected ? "#000" : "#000",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isSelected ? "#d2d3d4a6" : "#d2d3d4a6",
                    color: isSelected ? "" : "#000",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#e6e7e7bd !important",
                    color: "#000 !important",
                    "&:hover": {
                      backgroundColor: "#b4b4b4a6 !important",
                    },
                  },
                }}
              >
                <span>{item.name}</span>
                {isSelected && (
                  <CheckIcon sx={{ color: "#2566b0", fontSize: 20, ml: 2 }} />
                )}
              </MenuItem>
            );
          })}
        </MenuList>
      </ClickAwayListener>
    </Paper>
  );

  const renderComponentBasedOnOptions = (
    <div className="flex items-center justify-between mb-2 px-2">
      {selectedIndex === "1" ? (
        <>
          <div>
            <span className="font-semibold text-gray-600 text-sm">To:</span>{" "}
            <span className="text-sm text-gray-600">
              {ticketData?.assignor?.email}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!showCc && (
              <p
                className="text-xs text-gray-500 cursor-pointer hover:underline font-bold"
                onClick={() => setShowCc(true)}
              >
                CC
              </p>
            )}
            {!showBcc && (
              <p
                className="text-xs text-gray-500 cursor-pointer hover:underline font-bold"
                onClick={() => setShowBcc(true)}
              >
                BCC
              </p>
            )}
          </div>
        </>
      ) : selectedIndex === "4" ? (
        <div className="w-full flex  gap-2">
          <div className="w-full flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-600 text-sm">To:</span>
            <EmailAutocomplete
              label="Specify Email"
              value={approvalTo}
              onChange={handleApprovalToChange}
              qtkMethod={triggerSeachAgent}
              type="approvalTo"
              onDelete={handleDelete}
              optionLabelKey="email"
              renderOptionExtra={(user) => (
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              )}
              width={400}
            />
            {!showApprovalCc && (
              <p
                className="text-xs text-gray-500 cursor-pointer hover:underline ml-auto font-bold"
                onClick={() =>
                  setShowApprovalCc((prev) => {
                    const next = !prev;
                    if (!next) {
                      handleApprovalCcChange([]);
                    }
                    return next;
                  })
                }
              >
                CC
              </p>
            )}
          </div>
          {showApprovalCc && (
            <div className="w-full flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-600 text-sm">CC:</span>
              <EmailAutocomplete
                label="Carbon Copy"
                value={approvalCc}
                onChange={handleApprovalCcChange}
                qtkMethod={triggerSeachAgent}
                type="approvalCc"
                onDelete={handleDelete}
                optionLabelKey="email"
                renderOptionExtra={(user) => (
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
                width={400}
              />
              <IconButton
                size="small"
                onClick={() => {
                  handleApprovalCcChange([]);
                  setShowApprovalCc(false);
                }}
                sx={{
                  color: "text.secondary",
                  border: "1px solid #e0e0e0",
                  ml: 1,
                  "&:hover": {
                    color: "error.main",
                    borderColor: "error.light",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </div>
      ) : selectedIndex === "2" && selectedValue === "public" ? (
        <div className="w-full" />
      ) : (
        <div className="w-full flex items-center gap-2">
          <span className="font-semibold text-gray-600 text-sm">Notify:</span>
          <EmailAutocomplete
            label="Specify Email"
            value={localNotifyTag}
            onChange={(value) => handleSelectedOption(value)}
            qtkMethod={triggerSeachAgent}
            type="notify"
            onDelete={handleDelete}
            renderOptionExtra={(user) => (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}
            width={400}
          />
        </div>
      )}
    </div>
  );

  const baseEditorHeight = React.useMemo(() => {
    if (selectedIndex === "2") {
      return selectedValue === "public"
        ? "calc(100vh - 340px)"
        : "calc(100vh - 377px)";
    }

    if (selectedIndex === "4") {
      return "calc(100vh - 370px)";
    }

    return customHeight;
  }, [selectedIndex, selectedValue, customHeight]);

  const editorHeight = React.useMemo(() => {
    if (isFullscreen) {
      return baseEditorHeight;
    }

    if (isEditorExpended) {
      return "480px";
    }

    if ((showCc || showBcc) && currentSignature) {
      return "calc(100vh - 576.5px)";
    }

    if (showCc || showBcc) {
      return "calc(100vh - 401px)";
    }

    if (currentSignature) {
      return "calc(100vh - 540px)";
    }

    return baseEditorHeight;
  }, [
    baseEditorHeight,
    currentSignature,
    isEditorExpended,
    isFullscreen,
    showBcc,
    showCc,
  ]);

  const editorPlaceholder = React.useMemo(() => {
    if (selectedIndex === "1") {
      return "Reply to the customer...";
    }
    if (selectedIndex === "2") {
      setOptionChangeKey((prevKey) => prevKey + 1);
      return selectedValue === "private"
        ? "Add a private note (that will be not visible to customer only to your team)"
        : "Add a public note (that will be visible to the customer)";
    }
    if (selectedIndex === "4") {
      return "Add your approval request (that will be not visible to the customer)";
    }
    return "Start typing...";
  }, [selectedIndex, selectedValue]);

  const editorBackgroundColor =
    selectedIndex === "4"
      ? "#ecf9f9"
      : selectedValue === "private"
      ? "#fff3cd"
      : "transparent";

  return (
    <div
      className={
        isFullscreen ? "editor-fullscreen relative " : " w-full h-full"
      }
    >
      {uploadingCount > 0 && (
        <div className="w-full px-2 mb-2">
          <LinearProgress />
        </div>
      )}
      {isFull && (
        <>
          <div
            className="flex items-center justify-between p-2 mb-2"
            style={isFullscreen ? { position: "relative", zIndex: 10000 } : {}}
          >
            <div className="flex items-center gap-2 z-[10000]">
              <Avatar src={avatarEditor} sx={{ width: 25, height: 25 }} />

              <CustomToolTip
                title={renderToolTipComponent}
                placement="bottom-start"
                open={isOptionsOpen}
                width={300}
                bg="#fff"
                // close={() => setIsOptionsOpen(false)}
              >
                <span
                  onClick={() => setIsOptionsOpen(true)}
                  className="cursor-pointer  relative z-[10000]"
                  ref={optionsRef}
                >
                  {renderIcon}
                  <KeyboardArrowDownIcon fontSize="small" />
                </span>
              </CustomToolTip>

              {renderComponentBasedOnSelection}
            </div>
            <div>
              {!isFullscreen && (
                <IconButton onClick={onCloseReply} size="small">
                  <KeyboardArrowUpIcon sx={{ transform: "rotate(180deg)" }} />
                </IconButton>
              )}
            </div>
          </div>

          <div
            style={isFullscreen ? { position: "relative", zIndex: 10000 } : {}}
          >
            {renderComponentBasedOnOptions}
          </div>
        </>
      )}

      {selectedIndex === "1" && (
        <div
          className="flex items-center gap-4 mb-2 px-2"
          style={isFullscreen ? { position: "relative", zIndex: 10000 } : {}}
        >
          {showCc && (
            <div className="flex items-center gap-2">
              <EmailAutocomplete
                label="Carbon Copy"
                value={ccValue}
                onChange={setCcValue}
                qtkMethod={triggerSeachAgent}
                type="cc"
                onDelete={handleDelete}
                renderOptionExtra={(user) => (
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
                width={400}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setCcValue([]);
                  setShowCc(false);
                }}
                sx={{
                  color: "text.secondary",
                  border: "1px solid #e0e0e0",
                  "&:hover": {
                    color: "error.main",
                    borderColor: "error.light",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          )}

          {showBcc && (
            <div className="flex items-center gap-2">
              <EmailAutocomplete
                label="Blind Carbon Copy"
                value={bccValue}
                onChange={setBccValue}
                qtkMethod={triggerSeachAgent}
                type="bcc"
                onDelete={handleDelete}
                renderOptionExtra={(user) => (
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
                width={400}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setBccValue([]);
                  setShowBcc(false);
                }}
                sx={{
                  color: "text.secondary",
                  border: "1px solid #e0e0e0",
                  "&:hover": {
                    color: "error.main",
                    borderColor: "error.light",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </div>
      )}
      {/* <div className="flex flex-col h-full w-full overflow-y-scroll"> */}

      {/* Main Editor for Message */}
      <div className="mb-0">
        <Editor
          ref={editorRef}
          key={optionChangeKey}
          value={initialContent}
          onTextChange={handleEditorTextChange}
          style={{
            height: editorHeight,
            backgroundColor: editorBackgroundColor,
          }}
          headerTemplate={header}
          placeholder={editorPlaceholder}
        />
      </div>

      {/* Signature Editor (Read-only) */}
      {currentSignature && (
        <Editor
          ref={signatureEditorRef}
          value={currentSignature}
          readOnly={true}
          style={{
            height:
              selectedIndex !== "1" && currentSignature
                ? "calc(100vh - 568px)"
                : "175px",
            borderTop: "none",
          }}
          placeholder="No signature selected"
          showHeader={false}
        />
      )}
    </div>
  );
};

export default React.memo(StackEditor);
