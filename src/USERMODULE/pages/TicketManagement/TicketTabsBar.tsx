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

  const handleTabClick = (ticketNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveTicketTab(ticketNumber);
    navigate(`/tickets/${ticketNumber}`);
  };

  const handleCloseTab = (
    ticketNumber: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
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
              aria-selected={isActive}
              tabIndex={0}
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
