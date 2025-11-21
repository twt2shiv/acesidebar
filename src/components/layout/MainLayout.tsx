import { Suspense, useEffect } from "react";
import {
  Box,
  CssBaseline,
  styled,
} from "@mui/material";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { usePopupContext } from "../../contextApi/PopupContext";
import { useStatus } from "../../contextApi/StatusContext";
import { useHelpCenter } from "../../contextApi/HelpCenterContext";
import logo from "../../assets/image/logo.svg";
import PrivateTurnstile from "../common/PrivateTurnstile";
import OfflineStatusModal from "../popup/OfflineStatusModal";
import HelpCenterSlider from "./HelpCenterSlider";
import { useDispatch, useSelector } from "react-redux";
import { setToggle } from "../../reduxStore/Slices/shotcutSlices";
import { RootState } from "../../reduxStore/Store";
import { useGetUserIsAvailableQuery } from "../../services/auth";
import { useAuth } from "../../contextApi/AuthContext";
import { setStartTime } from "../../reduxStore/Slices/setUpSlices";
import LeftMenu from "../../USERMODULE/pages/TicketManagement/LeftMenu";
import TicketTabsBar from "../../USERMODULE/pages/TicketManagement/TicketTabsBar";
import UserLeftMenu from "../../USERMODULE/pages/UserManagement/UserLeftMenu";
import GlobalBackButtonPrevention from "../GlobalBackButtonPrevention";
import { TicketsLayoutProvider } from "../../contextApi/TicketsLayoutContext";
import CookiesBanner from "../common/CookiesBanner";
import EventDrawerPage from "../../pages/EventDrawerPage";

const Main = styled("main", {
  shouldForwardProp: (prop) =>
    prop !== "open" && prop !== "isPopupOpen" && prop !== "helpCenterOpen",
})<{
  open?: boolean;
  isPopupOpen?: boolean;
  helpCenterOpen?: boolean;
}>(({ theme, open, isPopupOpen, helpCenterOpen }) => ({
  flexGrow: 1,
  padding: "5px",
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),

  backgroundColor: "#fff",
  width: "100%",
  height: "100%",
  overflow: "auto",
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  ...(helpCenterOpen && {
    marginLeft: "300px", // 80px (sidebar) + 400px (help center) = 480px
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(isPopupOpen && {
    WebkitFilter: "blur(2.5px)",
    filter: "blur(2.5px)",
    overflow: "hidden",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitOverflowScrolling: "touch",
    touchAction: "none",
    msTouchAction: "none",
    msOverflowStyle: "-ms-autohiding-scrollbar",
    msContentZooming: "none",
    msScrollChaining: "none",
    msUserSelect: "none",
  }),
}));

const MainContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(8),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: "auto",
}));

const MainLayout = () => {
  const { user } = useAuth();
  const { isAnyPopupOpen } = usePopupContext();
  const { showOfflineModal, setShowOfflineModal } = useStatus();
  const { helpCenterOpen, closeHelpCenter } = useHelpCenter();
  const { isOpen } = useSelector((state: RootState) => state.shotcut);
  const dispatch = useDispatch();
  const { setCurrentStatus } = useStatus();
  const { data } = useGetUserIsAvailableQuery({
    //@ts-ignore
    userId: user?.uID,
    //@ts-ignore
    skip: !user?.uID,
    refetchOnMountOrArgChange: true,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const isEventDrawerOpen = location.hash === "#event";

  const handleEventDrawerClose = () => {
    if (isEventDrawerOpen) {
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }
  };

  const handleDrawerToggle = () => {
    dispatch(setToggle(!isOpen));
  };

  const handleCloseOfflineModal = () => {
    setShowOfflineModal(false);
  };

  useEffect(() => {
    if (data) {
      setCurrentStatus(
        data?.is_offline === "OFFLINE" ? "offline" : "available"
      );
      dispatch(setStartTime(data?.offline_start));
    }
  }, [data]);

  return (
    <Box sx={{ display: "flex", overflow: "hidden" }}>
      <GlobalBackButtonPrevention />
      <CssBaseline />
      <TopBar open={isOpen} handleDrawerToggle={handleDrawerToggle} />

      <Sidebar
        open={isOpen}
        handleDrawerToggle={handleDrawerToggle}
        onClose={closeHelpCenter}
      />

      {location.pathname === "/tickets" ||
        location.pathname === "/" ||
        location.pathname.startsWith("/tickets/") ? (
        <TicketsLayoutProvider>
          <LeftMenu />
          <Main
            open={isOpen}
            isPopupOpen={isAnyPopupOpen}
            helpCenterOpen={helpCenterOpen}
            sx={{ position: "relative" }}
          >
            <TicketTabsBar />
            <MainContent className="custom-scrollbar">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center">
                    {" "}
                    <img src={logo} alt="Ajaxter Logo" className="w-[300px]  " />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </MainContent>

            {/* Help Center Slider - positioned inside main content */}
            <HelpCenterSlider open={helpCenterOpen} onClose={closeHelpCenter} />
          </Main>
        </TicketsLayoutProvider>
      ) : (
        <>
          {(location.pathname === "/user" || location.pathname.startsWith("/user/")) && <UserLeftMenu />}
          <Main
            open={isOpen}
            isPopupOpen={isAnyPopupOpen}
            helpCenterOpen={helpCenterOpen}
            sx={{ position: "relative", }}
          >
            <MainContent className="custom-scrollbar" style={{}}>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center">
                    {" "}
                    <img src={logo} alt="Ajaxter Logo" className="w-[300px]  " />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </MainContent>

            {/* Help Center Slider - positioned inside main content */}
            <HelpCenterSlider open={helpCenterOpen} onClose={closeHelpCenter} />
          </Main>
        </>
      )}
      {/* <BottomBar /> */}
      <PrivateTurnstile />

      {/* Offline Status Modal */}
      <OfflineStatusModal
        open={showOfflineModal}
        onClose={handleCloseOfflineModal}
      />
      <CookiesBanner />
      <EventDrawerPage open={isEventDrawerOpen} onClose={handleEventDrawerClose} />
    </Box>
  );
};

export default MainLayout;
