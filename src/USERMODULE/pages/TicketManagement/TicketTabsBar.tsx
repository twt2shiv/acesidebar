import React from "react";
import { useNavigate } from "react-router-dom";
import { useTicketsLayout } from "../../../contextApi/TicketsLayoutContext";
import CloseIcon from "@mui/icons-material/Close";
import "./TicketTabsBar.css";

const TicketTabsBar: React.FC = () => {
  const {
    ticketTabs,
    activeTicketTab,
    setActiveTicketTab,
    removeTicketTab,
  } = useTicketsLayout();
  const navigate = useNavigate();

  if (!ticketTabs.length) return null;

  const handleTabClick = (ticketNumber: string) => {
    setActiveTicketTab(ticketNumber);
    navigate(`/tickets/${ticketNumber}`);
  };

  const handleCloseTab = (ticketNumber: string) => {
    const remaining = ticketTabs.filter(
      (tab) => tab.ticketNumber !== ticketNumber
    );
    removeTicketTab(ticketNumber);
    if (ticketNumber === activeTicketTab) {
      const next = remaining[remaining.length - 1];
      navigate(next ? `/tickets/${next.ticketNumber}` : "/tickets");
    }
  };

  return (
    <div className="ticket-tabs-wrapper">
      <div className="ticket-tabs custom-scrollbar">
        {ticketTabs.map((tab) => {
          const isActive = tab.ticketNumber === activeTicketTab;
          const tabClass = `ticket-tab${isActive ? " active" : ""}`;
          return (
            <div
              key={tab.ticketNumber}
              className={tabClass}
              onClick={() => handleTabClick(tab.ticketNumber)}
            >
              <div className="ticket-tab-box">
                <div className="ticket-tab__titles">
                  <span>#{tab.ticketNumber}</span>
                  <span>{tab.subject || "Loading ticket..."}</span>
                </div>
                <button
                  className="ticket-tab__close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.ticketNumber);
                  }}
                  aria-label="Close tab"
                  title="Close tab"
                >
                  <CloseIcon sx={{ fontSize: 16, color: "#d32f2f" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketTabsBar;

