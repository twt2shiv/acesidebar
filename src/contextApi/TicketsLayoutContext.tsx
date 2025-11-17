import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface TicketTabMeta {
  ticketNumber: string;
  subject?: string;
  requester?: string;
  status?: string;
}

interface TicketsLayoutContextType {
  leftMenuExpanded: boolean;
  setLeftMenuExpanded: (expanded: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  ticketTabs: TicketTabMeta[];
  activeTicketTab: string | null;
  addTicketTab: (tab: TicketTabMeta) => void;
  removeTicketTab: (ticketNumber: string) => void;
  setActiveTicketTab: (ticketNumber: string | null) => void;
  updateTicketTab: (
    ticketNumber: string,
    updates: Partial<TicketTabMeta>
  ) => void;
}

const TicketsLayoutContext = createContext<TicketsLayoutContextType | undefined>(undefined);

export const TicketsLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leftMenuExpanded, setLeftMenuExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [ticketTabs, setTicketTabs] = useState<TicketTabMeta[]>([]);
  const [activeTicketTab, setActiveTicketTab] = useState<string | null>(null);

  // Close filters when left menu expands
  React.useEffect(() => {
    if (leftMenuExpanded && filtersOpen) {
      setFiltersOpen(false);
    }
  }, [leftMenuExpanded]);

  // Close left menu when filters open
  React.useEffect(() => {
    if (filtersOpen && leftMenuExpanded) {
      setLeftMenuExpanded(false);
    }
  }, [filtersOpen]);

  const addTicketTab = useCallback((tab: TicketTabMeta) => {
    if (!tab.ticketNumber) return;
    setTicketTabs((prev) => {
      const exists = prev.some(
        (item) => item.ticketNumber === tab.ticketNumber
      );
      if (exists) {
        return prev.map((item) =>
          item.ticketNumber === tab.ticketNumber ? { ...item, ...tab } : item
        );
      }
      return [...prev, tab];
    });
    setActiveTicketTab(tab.ticketNumber);
  }, []);

  const removeTicketTab = useCallback((ticketNumber: string) => {
    setTicketTabs((prev) => {
      const filtered = prev.filter((tab) => tab.ticketNumber !== ticketNumber);
      setActiveTicketTab((current) => {
        if (current === ticketNumber) {
          return filtered[filtered.length - 1]?.ticketNumber ?? null;
        }
        return current;
      });
      return filtered;
    });
  }, []);

  const updateTicketTab = useCallback(
    (ticketNumber: string, updates: Partial<TicketTabMeta>) => {
      if (!ticketNumber) return;
      setTicketTabs((prev) =>
        prev.map((tab) =>
          tab.ticketNumber === ticketNumber ? { ...tab, ...updates } : tab
        )
      );
    },
    []
  );

  return (
    <TicketsLayoutContext.Provider
      value={{
        leftMenuExpanded,
        setLeftMenuExpanded,
        filtersOpen,
        setFiltersOpen,
        ticketTabs,
        activeTicketTab,
        addTicketTab,
        removeTicketTab,
        setActiveTicketTab,
        updateTicketTab,
      }}
    >
      {children}
    </TicketsLayoutContext.Provider>
  );
};

export const useTicketsLayout = () => {
  const context = useContext(TicketsLayoutContext);
  if (context === undefined) {
    throw new Error("useTicketsLayout must be used within a TicketsLayoutProvider");
  }
  return context;
};

// Optional hook that returns null if context is not available
export const useTicketsLayoutOptional = () => {
  const context = useContext(TicketsLayoutContext);
  return context;
};

