import React, { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTicketsLayout } from "../../../contextApi/TicketsLayoutContext";
import CloseIcon from "@mui/icons-material/Close";
import "./TicketTabsBar.css";

const TicketTabsBar: React.FC = () => {
  const {
    ticketTabs,

    removeTicketTab,
  } = useTicketsLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTicketTab = useMemo(
    () => location.pathname.replace("/tickets/", ""),
    [location.pathname]
  );

  const handleTabClick = useCallback(
    (ticketNumber: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      navigate(`/tickets/${ticketNumber}`);
    },
    [navigate]
  );

  const handleCloseTab = useCallback(
    (ticketNumber: string, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();

      // Find the index of the tab being closed
      const closedTabIndex = ticketTabs.findIndex(
        (tab) => tab.ticketNumber === ticketNumber
      );

      // Calculate which tab to navigate to before removing
      let targetTab: string | null = null;
      const isActiveTab = ticketNumber === activeTicketTab;

      if (isActiveTab) {
        if (ticketTabs.length === 1) {
          // Last tab, navigate to tickets list - targetTab stays null
        } else if (closedTabIndex === ticketTabs.length - 1) {
          // Closing the last tab, select the previous one
          targetTab = ticketTabs[closedTabIndex - 1]?.ticketNumber || null;
        } else {
          // Closing a tab in the middle, select the next one (same index)
          targetTab = ticketTabs[closedTabIndex + 1]?.ticketNumber || null;
        }
      }

      // Navigate first to avoid lag
      if (targetTab !== null) {
        navigate(`/tickets/${targetTab}`);
      } else if (isActiveTab) {
        navigate("/tickets");
      }

      // Remove the tab after navigation
      removeTicketTab(ticketNumber);
    },
    [ticketTabs, activeTicketTab, navigate, removeTicketTab]
  );

  if (!ticketTabs.length) return null;

  return (
    <div  className="ticket-tabs-wrapper">
      <ul className="ticket-tabs">
        {ticketTabs.map((tab) => {
          const isActive = tab.ticketNumber === activeTicketTab;
          const tabClass = `ticket-tab${isActive ? " active" : ""}`;
          return (
            <li
              key={tab.ticketNumber}
              className={tabClass}
              onClick={(e) => handleTabClick(tab.ticketNumber, e)}
              role="tab"
              // aria-selected={isActive}
              // tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTabClick(tab.ticketNumber);
                }
              }}
            >
              <div className="ticket-tab-box">
                <div className="ticket-tab__titles">
                  <span>#{tab.ticketNumber}</span>
                  <span>{tab.subject || "Loading ticket..."}</span>
                </div>
                <button
                  className="ticket-tab__close"
                  onClick={(e) => handleCloseTab(tab.ticketNumber, e)}
                  aria-label={`Close tab ${tab.ticketNumber}`}
                  title="Close tab"
                  type="button"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TicketTabsBar;
