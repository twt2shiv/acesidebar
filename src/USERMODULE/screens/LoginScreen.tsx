import React from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Link,
  Divider,
  InputAdornment,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { loginSchema } from "../../zodSchema/AuthSchema";
import { useAuth } from "../../contextApi/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import {
  useLoginMutation,
  useLazyLoginPrecheckQuery,
} from "../../services/auth";
import { decrypt } from "../../utils/encryption";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ErrorIcon from "@mui/icons-material/Error";
import SecureLoginImage from "../../assets/image/login/secure-login-i1.jpg";

import GoogleRecaptcha, {
  GoogleRecaptchaRef,
} from "../../components/reusable/GoogleRecaptcha";
import { sessionManager } from "../../utils/SessionManager";

type RegisterFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const PRIMARY_COLOR = "#2567B3";
  const LINK_COLOR = "#1770e6";
  const NEUTRAL_BORDER = "#d9d9d9";
  const { signIn } = useAuth();
  const navigation = useNavigate();
  const VISIBLE_RECAPTCHA_KEY = process.env.REACT_APP_GOOGLE_VISIBLE_SITE_KEY;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "admin123",
      password: "Shiv@123456",
    },
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { showToast } = useToast();
  const [login, { isLoading }] = useLoginMutation();
  const [isForgot, setIsForgot] = useState<boolean>(false);
  const [forgotMode, setForgotMode] = useState<"password" | "username">(
    "password"
  );
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState<string>("");
  const [isForgotCaptchaVerified, setIsForgotCaptchaVerified] =
    useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const forgotRecaptchaRef = useRef<GoogleRecaptchaRef>(null);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("COM0001");
  const [companyNameTouched, setCompanyNameTouched] = useState<boolean>(false);
  const [companyNameSubmitted, setCompanyNameSubmitted] =
    useState<boolean>(false);
  const [triggerLoginPrecheck, { isFetching: isPrecheckLoading }] =
    useLazyLoginPrecheckQuery();
  const [precheckError, setPrecheckError] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("Ajaxter");
  const [isStep2Loading, setIsStep2Loading] = useState<boolean>(false);
  const [hostLoading, setHostLoading] = useState<boolean>(true);

  // Decide which step to show based on current host
  useEffect(() => {
    setHostLoading(true);
    const host = window.location.hostname.split(":")[0];
    const isTmsHost = host.startsWith("tms.");
    if (isTmsHost) {
      setShowLoginForm(false);
      // show step 1 (domain entry)
    } else {
      setShowLoginForm(true); // show step 2 (login) for non-tms hosts (incl. localhost)
      setIsStep2Loading(true);
    }
    setHostLoading(false);
  }, []);

  // On step 2 (non tms hosts), fetch and set brand name from tenant subdomain; on error redirect to tms host
  useEffect(() => {
    const { hostname } = window.location;
    const host = hostname.split(":")[0];
    const isTmsHost = host.startsWith("tms.");
    if (isTmsHost) return;

    // Determine tenant from subdomain
    const parts = host.split(".");
    let tenantSub = "";
    if (host === "localhost") {
      tenantSub = ""; // no tenant for plain localhost
    } else if (host.endsWith(".localhost")) {
      // e.g., tenant.localhost
      tenantSub = parts.length >= 2 ? parts[0] : "";
    } else {
      // e.g., tenant.example.com or a.b.c.example.com
      tenantSub = parts[0];
    }

    if (!tenantSub) {
      // Plain localhost: no tenant precheck, show form immediately
      setIsStep2Loading(false);
      return;
    }

    if (tenantSub) {
      (async () => {
        try {
          const res: any = await triggerLoginPrecheck({ tenant: tenantSub });
          if (res?.data?.success && res?.data?.data?.name) {
            setBrandName(res.data.data.name);
            setIsStep2Loading(false);
          } else {
            // Redirect back to tms host on failure
            const { protocol, port } = window.location;
            const parts = host.split(".");
            const isLocalLike =
              host === "localhost" || host.endsWith(".localhost");
            const apexDomain = isLocalLike
              ? "localhost"
              : parts.length > 2
              ? parts.slice(-2).join(".")
              : host;
            const targetHost = isLocalLike
              ? `tms.${apexDomain}${port ? `:${port}` : ""}`
              : `tms.${apexDomain}`;
            window.location.href = `${protocol}//${targetHost}`;
          }
        } catch {
          const { protocol, port } = window.location;
          const parts = host.split(".");
          const isLocalLike =
            host === "localhost" || host.endsWith(".localhost");
          const apexDomain = isLocalLike
            ? "localhost"
            : parts.length > 2
            ? parts.slice(-2).join(".")
            : host;
          const targetHost = isLocalLike
            ? `tms.${apexDomain}${port ? `:${port}` : ""}`
            : `tms.${apexDomain}`;
          window.location.href = `${protocol}//${targetHost}`;
        }
      })();
    }
  }, [triggerLoginPrecheck]);

  // Get dynamic domain suffix from current window host
  const getDynamicDomain = () => {
    const { hostname, port } = window.location;
    const domain = hostname.split(":")[0];
    const endsWithLocalhost =
      domain === "localhost" || domain.endsWith(".localhost");
    if (endsWithLocalhost) {
      // Always show localhost with port (if any) and no leading dot
      return port ? `localhost:${port}` : "localhost";
    }
    // Extract apex domain (e.g., app.example.com -> .example.com)
    const parts = domain.split(".");
    if (parts.length > 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
    return `.${domain}`;
  };

  const handleDomainNext = async () => {
    setCompanyNameSubmitted(true);
    const trimmedName = companyName.trim();
    setPrecheckError("");

    if (!trimmedName) {
      setPrecheckError("Please enter a company name");
      return;
    }

    // Validate minimum length
    if (trimmedName.length < 3) {
      setPrecheckError("Company name must be at least 3 characters");
      return;
    }

    // Validate maximum length
    if (trimmedName.length > 15) {
      setPrecheckError("Company name must be at most 15 characters");
      return;
    }

    // Validate company name format: alphanumeric and hyphens only
    const companyPattern = /^[a-zA-Z0-9-]+$/;
    if (!companyPattern.test(trimmedName)) {
      setPrecheckError(
        "Company name can only contain letters, numbers, and hyphens"
      );
      return;
    }

    // Redirect to tenant.HOSTNAME[:PORT] immediately
    const tenant = trimmedName;
    const { protocol, hostname, port } = window.location;
    const hostWithoutPort = hostname.split(":")[0];
    const isLocalLike =
      hostWithoutPort === "localhost" || hostWithoutPort.endsWith(".localhost");
    const apexDomain = (() => {
      if (isLocalLike) return "localhost";
      const parts = hostWithoutPort.split(".");
      return parts.length > 2 ? parts.slice(-2).join(".") : hostWithoutPort;
    })();
    const targetHost = isLocalLike
      ? `${tenant}.${apexDomain}${port ? `:${port}` : ""}`
      : `${tenant}.${apexDomain}`;
    window.location.href = `${protocol}//${targetHost}`;
  };

  const handleGoBack = () => {
    // Redirect to tms.HOSTNAME (or tms.localhost:PORT on localhost)
    const { protocol, hostname, port } = window.location;
    const hostWithoutPort = hostname.split(":")[0];
    const isLocalLike =
      hostWithoutPort === "localhost" || hostWithoutPort.endsWith(".localhost");
    const apexDomain = (() => {
      if (isLocalLike) return "localhost";
      const parts = hostWithoutPort.split(".");
      return parts.length > 2 ? parts.slice(-2).join(".") : hostWithoutPort;
    })();
    const targetHost = isLocalLike
      ? `tms.${apexDomain}${port ? `:${port}` : ""}`
      : `tms.${apexDomain}`;

    window.location.href = `${protocol}//${targetHost}`;
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const isRemembered = localStorage.getItem("rememberMe") === "true";

    if (rememberedEmail && isRemembered) {
      setValue("email", rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  // Watch form values for validation
  const watchedValues = watch();
  const email = watchedValues.email || "";
  const password = watchedValues.password || "";

  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    termsAccepted &&
    isCaptchaVerified;

  // Generate session ID when component mounts (when someone visits login page)
  useEffect(() => {
    // Create a new session when someone visits the login page
    const session = sessionManager.createSession();
    console.log("Login page visited - Session created:", session.sessionId);

    // Cleanup function to stop session checking when component unmounts
    return () => {
      // Don't clear session here as user might navigate away temporarily
      // Session will be managed by SessionManager
    };
  }, []);

  const forgotSchema = z.object({
    email: z.string().email("Invalid email"),
  });
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: {
      errors: forgotErrors,
      isSubmitted: isForgotSubmitted,
      touchedFields: forgotTouched,
    },
  } = useForm<{ email: string }>({
    resolver: zodResolver(forgotSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const handleToggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const executeLogin = async (data: RegisterFormData, token: string) => {
    if (!token) {
      showToast("Please complete the security verification", "error");
      return;
    }

    const isSessionValid = sessionManager.checkSessionExpiration();
    if (!isSessionValid) {
      return;
    }

    try {
      const payload = {
        username: data.email,
        password: data.password,
        captcha: token,
      };
      const result = await login(payload);

      if (
        result.data?.success === true &&
        result.data?.type === "login_success"
      ) {
        localStorage.setItem("userToken", result.data.data.token);
        const decryptedData = JSON.stringify(decrypt(result.data.data.user));
        localStorage.setItem("userData", decryptedData);

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberedEmail", data.email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedEmail");
        }

        signIn();
        setIsCaptchaVerified(false);
        setCaptchaToken("");
        navigation("/");
        return;
      } else if (
        result.data?.success === true &&
        result.data?.type === "session_limit_reached"
      ) {
        localStorage.setItem("userToken", result.data.data.token);
        const decryptedData: any = decrypt(result.data.data.user);

        const storeDate: any = {
          name: decryptedData?.name,
          userId: decryptedData?.uID,
        };

        localStorage.setItem("userData", JSON.stringify(storeDate));

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberedEmail", data.email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedEmail");
        }

        signIn();
        setIsCaptchaVerified(false);
        setCaptchaToken("");
        navigation("/session-management");
        return;
      } else {
        const errorMessage =
          result.data?.message || "Login failed. Please try again.";
        showToast(errorMessage, "error");
        resetRecaptchaState();

        setValue("email", "");
        setValue("password", "");
        setTimeout(() => {
          const emailField = document.querySelector(
            'input[name="email"]'
          ) as HTMLInputElement;
          if (emailField) {
            emailField.focus();
          }
        }, 100);
        return;
      }
    } catch (error) {
      showToast(
        "Network error. Please check your connection and try again.",
        "error"
      );

      resetRecaptchaState();

      setValue("email", "");
      setValue("password", "");

      setTimeout(() => {
        const emailField = document.querySelector(
          'input[name="email"]'
        ) as HTMLInputElement;
        if (emailField) {
          emailField.focus();
        }
      }, 100);
    }
  };

  const handleRecaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setIsCaptchaVerified(true);
  };

  const resetRecaptchaState = () => {
    setIsCaptchaVerified(false);
    setCaptchaToken("");
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.reset();
      } catch {
        /* noop */
      }
    }
  };

  const handleRecaptchaError = (error: string) => {
    resetRecaptchaState();
    if (!error.includes("verification")) {
      showToast("Please complete the security verification", "error");
    }
  };

  const handleRecaptchaExpire = () => {
    resetRecaptchaState();
    showToast(
      "Security verification expired.\nPlease complete the security verification again.",
      "error"
    );
  };

  // Forgot password captcha handlers
  const handleForgotRecaptchaVerify = (token: string) => {
    setForgotCaptchaToken(token);
    setIsForgotCaptchaVerified(true);
  };

  const handleForgotRecaptchaError = (error: string) => {
    setIsForgotCaptchaVerified(false);
    setForgotCaptchaToken("");
    if (!error.includes("verification")) {
      showToast("Please complete the security verification", "error");
    }
  };

  const handleForgotRecaptchaExpire = () => {
    setIsForgotCaptchaVerified(false);
    setForgotCaptchaToken("");
    showToast(
      "Security verification expired.\nPlease complete the verification again.",
      "error"
    );
  };

  const handleLoginAttempt = handleSubmit(async (data) => {
    if (!isCaptchaVerified || !captchaToken) {
      showToast("Please complete the security verification", "error");
      return;
    }

    await executeLogin(data, captchaToken);
  });

  const onForgotSubmit = async ({ email }: { email: string }) => {
    if (!isForgotCaptchaVerified || !forgotCaptchaToken) {
      showToast("Please complete the security verification", "error");
      return;
    }

    try {
      const payload = {
        email: email,
        captcha: forgotCaptchaToken,
      };

      if (forgotMode === "password") {
        showToast(`Password reset instructions sent to ${email}`, "success");
      } else {
        showToast(`Username recovery details sent to ${email}`, "success");
      }

      setIsForgotCaptchaVerified(false);
      setForgotCaptchaToken("");
      if (forgotRecaptchaRef.current) {
        forgotRecaptchaRef.current.reset();
      }

      setIsForgot(false);
      setForgotMode("password");
    } catch (error) {
      showToast(
        "Failed to send reset instructions. Please try again.",
        "error"
      );

      setIsForgotCaptchaVerified(false);
      setForgotCaptchaToken("");
      if (forgotRecaptchaRef.current) {
        forgotRecaptchaRef.current.reset();
      }
    }
  };

  const isStep1 = !showLoginForm;
  const headingText = isForgot
    ? forgotMode === "password"
      ? "Reset your password"
      : "Recover your username"
    : "Jump back in";
  const subheadingText = isForgot
    ? forgotMode === "password"
      ? "Enter your email address and we'll send instructions to reset your password."
      : "Enter your email address and we'll send your workspace username."
    : isStep1
    ? "Enter your workspace domain to reach your team's ticket portal."
    : `Welcome back to the ${
        brandName || "Ajaxter"
      } support workspace. Sign in to pick up your tickets, tasks, and chats.`;

  if (hostLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  console.log("host loading", brandName);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: { md: 1200, lg: 1280 },
          mx: "auto",
          px: { xs: 3, sm: 4, md: 6 },
          gap: { xs: 6, md: 8 },
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            py: { xs: 6, md: 8 },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            {!isStep2Loading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 6,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: PRIMARY_COLOR,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: "#1a1a1a",
                  }}
                >
                  {(brandName || "Ajaxter").toUpperCase()} SUPPORT
                </Typography>
              </Box>
            )}
            {!showLoginForm && (
              <>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: "22px", sm: "26px" },
                    fontWeight: 700,
                    color: "#1a1a1a",
                    lineHeight: 1.1,
                  }}
                >
                  {headingText}
                </Typography>
                <Typography
                  sx={{
                    mt: 2,
                    color: "#5f6368",
                    fontSize: { xs: "14px", sm: "14px" },
                    lineHeight: 1.5,
                  }}
                >
                  {subheadingText}
                </Typography>
              </>
            )}

            {!showLoginForm ? (
              <Box sx={{ mt: 5 }}>
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDomainNext();
                  }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="yourworkspace"
                    value={companyName}
                    onChange={(e) => {
                      const value = e.target.value;
                      let filteredValue = value.replace(/[^a-zA-Z0-9-]/g, "");
                      filteredValue = filteredValue.replace(/-+$/, "");
                      if (filteredValue.length <= 15) {
                        setCompanyName(filteredValue);
                      }
                    }}
                    onBlur={() => setCompanyNameTouched(true)}
                    error={
                      (companyNameSubmitted || companyNameTouched) &&
                      !companyName.trim()
                        ? true
                        : false
                    }
                    inputProps={{
                      maxLength: 15,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnLockIcon
                            sx={{
                              color:
                                (companyNameSubmitted || companyNameTouched) &&
                                !companyName.trim()
                                  ? "#d32f2f"
                                  : PRIMARY_COLOR,
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ margin: 0, height: "100%" }}
                        >
                          <Box
                            sx={{
                              backgroundColor: "#f3f4f6",
                              padding: "0 16px",
                              minHeight: "56px",
                              marginLeft: "12px",
                              marginRight: "-1px",
                              borderLeft: `1px solid ${NEUTRAL_BORDER}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                color: "#5f6368",
                                fontWeight: 500,
                                fontSize: "16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getDynamicDomain()}
                            </Typography>
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mt: 4,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        fontSize: "16px",
                        paddingRight: "0 !important",
                        "& fieldset": {
                          borderColor: NEUTRAL_BORDER,
                        },
                        "&:hover fieldset": {
                          borderColor: PRIMARY_COLOR,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: PRIMARY_COLOR,
                        },
                        "&.Mui-error fieldset": {
                          borderColor: "#d32f2f",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        paddingRight: "12px !important",
                      },
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleDomainNext();
                      }
                    }}
                  />
                </Box>

                {precheckError && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1.5,
                    }}
                  >
                    <ErrorIcon sx={{ color: "#d32f2f", fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: "#d32f2f" }}>
                      {precheckError}
                    </Typography>
                  </Box>
                )}

                <Button
                  type="button"
                  fullWidth
                  onClick={handleDomainNext}
                  disabled={
                    isPrecheckLoading ||
                    !companyName.trim() ||
                    companyName.trim().length < 3 ||
                    companyName.trim().length > 15
                  }
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontSize: "17px",
                    fontWeight: 600,
                    backgroundColor: PRIMARY_COLOR,
                    color: "#ffffff",
                    "&:hover": {
                      backgroundColor: "#1e4d8a",
                    },
                    "&:disabled": {
                      backgroundColor: "#f3f4f6",
                      color: "#9e9e9e",
                    },
                  }}
                >
                  {isPrecheckLoading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    "Open workspace"
                  )}
                </Button>

                <Divider sx={{ my: 4 }} />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    sx={{
                      borderRadius: "999px",
                      borderColor: PRIMARY_COLOR,
                      color: PRIMARY_COLOR,
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        borderColor: "#1e4d8a",
                        backgroundColor: "rgba(37, 103, 179, 0.08)",
                      },
                    }}
                  >
                    Demo
                  </Button>
                  <Typography
                    sx={{
                      color: "#5f6368",
                      fontSize: "14px",
                    }}
                  >
                    New to Ajaxter TMS ?{" "}
                    <Typography
                      component="span"
                      role="button"
                      tabIndex={0}
                      sx={{
                        color: LINK_COLOR,
                        fontWeight: 600,
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                        outline: "none",
                      }}
                      onClick={() => navigation("/signup")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigation("/signup");
                        }
                      }}
                    >
                      Create an Account
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 5 }}>
                {isStep2Loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 6,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : isForgot ? (
                  <Box
                    component="form"
                    onSubmit={handleForgotSubmit(onForgotSubmit)}
                    noValidate
                  >
                    <Typography
                      sx={{
                        color: "#5f6368",
                        fontSize: "15px",
                        mt: 3,
                        mb: 3,
                      }}
                    >
                      {forgotMode === "password"
                        ? "We'll email you instructions to reset your password."
                        : "We'll email you your workspace username."}
                    </Typography>
                    <TextField
                      {...registerForgot("email")}
                      fullWidth
                      variant="outlined"
                      label="Email address"
                      sx={{
                        mb: 3,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          fontSize: "16px",
                          "& fieldset": {
                            borderColor: NEUTRAL_BORDER,
                          },
                          "&:hover fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                        },
                      }}
                      error={
                        isForgotSubmitted || forgotTouched.email
                          ? !!forgotErrors.email
                          : false
                      }
                    />

                    <Box sx={{ mb: 3 }}>
                      {process.env.REACT_APP_GOOGLE_VISIBLE_SITE_KEY ? (
                        <GoogleRecaptcha
                          ref={forgotRecaptchaRef}
                          siteKey={
                            process.env.REACT_APP_GOOGLE_VISIBLE_SITE_KEY
                          }
                          onVerify={handleForgotRecaptchaVerify}
                          onError={handleForgotRecaptchaError}
                          onExpire={handleForgotRecaptchaExpire}
                          theme="light"
                          size="normal"
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: "error.main", p: 2 }}
                        >
                          reCAPTCHA site key not configured
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <IconButton
                        onClick={() => {
                          setIsForgot(false);
                          setForgotMode("password");
                          setIsForgotCaptchaVerified(false);
                          setForgotCaptchaToken("");
                          if (forgotRecaptchaRef.current) {
                            forgotRecaptchaRef.current.reset();
                          }
                        }}
                        sx={{
                          color: PRIMARY_COLOR,
                          padding: "8px",
                          border: `1px solid ${NEUTRAL_BORDER}`,
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          "&:hover": {
                            backgroundColor: "rgba(37, 103, 179, 0.08)",
                            borderColor: PRIMARY_COLOR,
                          },
                        }}
                      >
                        <ArrowBackIcon sx={{ fontSize: 24 }} />
                      </IconButton>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!isForgotCaptchaVerified}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          borderRadius: "999px",
                          textTransform: "none",
                          fontSize: "16px",
                          fontWeight: 600,
                          backgroundColor: PRIMARY_COLOR,
                          "&:hover": {
                            backgroundColor: "#1e4d8a",
                          },
                          "&:disabled": {
                            backgroundColor: "#f3f4f6",
                            color: "#9e9e9e",
                          },
                        }}
                      >
                        {forgotMode === "password"
                          ? "Reset password"
                          : "Send username"}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    component="form"
                    onSubmit={handleLoginAttempt}
                    noValidate
                  >
                    <TextField
                      {...register("email")}
                      fullWidth
                      variant="outlined"
                      label="Workspace username or email"
                      sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          fontSize: "16px",
                          "& fieldset": {
                            borderColor: NEUTRAL_BORDER,
                          },
                          "&:hover fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: "14px",
                          color: "#1a1a1a",
                        },
                      }}
                      autoComplete="email"
                      error={
                        isSubmitted || touchedFields.email
                          ? !!errors.email
                          : false
                      }
                    />

                    <TextField
                      {...register("password")}
                      fullWidth
                      variant="outlined"
                      label="Workspace password"
                      type={showPassword ? "text" : "password"}
                      sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          fontSize: "16px",
                          "& fieldset": {
                            borderColor: NEUTRAL_BORDER,
                          },
                          "&:hover fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: PRIMARY_COLOR,
                          },
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: "14px",
                          color: "#1a1a1a",
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleToggleVisibility}
                              edge="end"
                              sx={{ color: "#5f6368" }}
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      autoComplete="current-password"
                      error={
                        isSubmitted || touchedFields.password
                          ? !!errors.password
                          : false
                      }
                    />

                    {VISIBLE_RECAPTCHA_KEY ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 1,
                          mb: 2,
                        }}
                      >
                        <GoogleRecaptcha
                          ref={recaptchaRef}
                          siteKey={VISIBLE_RECAPTCHA_KEY}
                          onVerify={handleRecaptchaVerify}
                          onError={handleRecaptchaError}
                          onExpire={handleRecaptchaExpire}
                          theme="light"
                          size="normal"
                        />
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ color: "error.main", p: 2 }}
                      >
                        Visible reCAPTCHA site key not configured
                      </Typography>
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          sx={{
                            color: PRIMARY_COLOR,
                            "&.Mui-checked": {
                              color: PRIMARY_COLOR,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "14px", color: "#1a1a1a" }}
                        >
                          I agree to the{" "}
                          <Link
                            href="#"
                            target="_blank"
                            underline="none"
                            rel="noopener noreferrer"
                            sx={{ "&:hover": { textDecoration: "underline" } }}
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="#"
                            target="_blank"
                            underline="none"
                            rel="noopener noreferrer"
                            sx={{ "&:hover": { textDecoration: "underline" } }}
                          >
                            Privacy Policy
                          </Link>
                        </Typography>
                      }
                    />

                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <IconButton
                        onClick={handleGoBack}
                        sx={{
                          color: PRIMARY_COLOR,
                          padding: "8px",
                          border: `1px solid ${NEUTRAL_BORDER}`,
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          flexShrink: 0,
                          "&:hover": {
                            backgroundColor: "rgba(37, 103, 179, 0.08)",
                            borderColor: PRIMARY_COLOR,
                          },
                        }}
                      >
                        <ArrowBackIcon sx={{ fontSize: 24 }} />
                      </IconButton>

                      <Button
                        variant="contained"
                        disabled={!isFormValid || isLoading}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          borderRadius: "999px",
                          textTransform: "none",
                          fontSize: "16px",
                          fontWeight: 600,
                          backgroundColor: PRIMARY_COLOR,
                          color: "#ffffff",
                          "&:hover": {
                            backgroundColor: "#1e4d8a",
                          },
                          "&:disabled": {
                            backgroundColor: "#f3f4f6",
                            color: "#9e9e9e",
                          },
                        }}
                        type="submit"
                      >
                        {isLoading ? (
                          <CircularProgress size={20} sx={{ color: "white" }} />
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                        color: "#5f6368",
                        fontSize: "14px",
                      }}
                    >
                      <Link
                        component="button"
                        underline="none"
                        sx={{
                          color: LINK_COLOR,
                          fontWeight: 600,
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => {
                          setForgotMode("username");
                          setIsForgot(true);
                        }}
                      >
                        Forgot workspace username?
                      </Link>
                      <Typography component="span" sx={{ color: "#d0d0d0" }}>
                        |
                      </Typography>
                      <Link
                        component="button"
                        underline="none"
                        sx={{
                          color: LINK_COLOR,
                          fontWeight: 600,
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => {
                          setForgotMode("password");
                          setIsForgot(true);
                        }}
                      >
                        Forgot password?
                      </Link>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            position: "relative",
            overflow: "hidden",
            px: { xs: 4, md: 8 },
            py: { xs: 6, md: 8 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            <Box
              sx={{
                position: "relative",
                width: { xs: 220, sm: 260, md: 320 },
                height: { xs: 220, sm: 260, md: 320 },
                marginX: "auto",
                mb: 5,
              }}
            >
              <img src={SecureLoginImage} alt="Secure Login" />
            </Box>

            <Typography
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              Trusted by support teams. Built for collaboration.
            </Typography>
            <Typography
              sx={{
                mt: 2,
                color: "#5f6368",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Triage tickets, coordinate follow-up tasks, and stay in sync with
              live chat threads in one secure workspace. Keep every
              conversation, SLA, and customer request on track.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          padding: { xs: 2, md: 3 },
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "#f8f8f8",
          mt: "auto",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 1, md: 2 },
            mb: 2,
          }}
        >
          {[
            "Legal",
            "Privacy Policy",
            "Terms of Use",
            "Cookie Policy",
            "Dispute Policy",
            "DMCA Policy",
            "Do Not Sell My Personal Information",
            "Report Abuse",
          ].map((link, index) => (
            <React.Fragment key={link}>
              {index > 0 && (
                <Typography
                  component="span"
                  sx={{ color: "#666", fontSize: "12px", fontWeight: 600 }}
                >
                  |
                </Typography>
              )}
              <Link
                href="#"
                sx={{
                  color: "#1a1a1a",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                  px: 0.5,
                }}
              >
                {link}
              </Link>
            </React.Fragment>
          ))}
        </Box>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "#666",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          © Copyright{" "}
          {new Date().getFullYear() === 2025
            ? "2025"
            : `2025 - ${new Date().getFullYear()}`}{" "}
          Ajaxter. All rights reserved.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "#666",
            fontSize: "12px",
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          All registered trademarks herein are the property of their respective
          owners.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginScreen;
