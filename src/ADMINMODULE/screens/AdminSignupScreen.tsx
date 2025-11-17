import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import CheckIcon from "@mui/icons-material/Check";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import EastIcon from "@mui/icons-material/East";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";

import GoogleRecaptcha, {
  GoogleRecaptchaRef,
} from "../../components/reusable/GoogleRecaptcha";
import lockIconGreen from "../../assets/icons/lock_icon_green.svg";
import { ContactPhone } from "@mui/icons-material";
import {
  useAdminSignUpMutation,
  useAdminSignUpOtpVerifyMutation,
  useCreateAdminAccountMutation,
} from "../../services/auth";
import { useToast } from "../../hooks/useToast";

// Constants
const PRIMARY_COLOR = "#2567B3";
const PRIMARY_DARK = "#1E4D8A";
const SECONDARY_BG = "#F5F7FB";
const TOTAL_STEPS = 4;
const MAX_RESEND_ATTEMPTS = 2;
const RESEND_TIMER_SECONDS = 60;
const OTP_LENGTH = 6;

// Button Styles
const primaryButtonStyles = {
  px: { xs: 4, md: 6 },
  background: PRIMARY_COLOR,
  borderRadius: 0,
  py: 1.25,
  fontWeight: 600,
  fontSize: 16,
  boxShadow: "0 18px 30px -18px rgba(37, 103, 179, 0.65)",
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  "&:hover": {
    background: PRIMARY_DARK,
  },
};

const outlinedButtonStyles = {
  px: { xs: 4, md: 6 },
  borderRadius: 0,
  py: 1.25,
  fontWeight: 600,
  fontSize: 16,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
};

// Helper Component for Helper Text with Icon
const HelperTextWithIcon = ({ message }: { message: string }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      color: "warning.main",
    }}
  >
    <LightbulbIcon sx={{ fontSize: 18 }} />
    <Typography variant="caption" sx={{ color: "inherit" }}>
      {message}
    </Typography>
  </Box>
);

// Animation styles for step content transition
const stepContentAnimation = {
  "@keyframes slideDown": {
    "0%": {
      opacity: 0,
      transform: "translateY(-20px)",
    },
    "100%": {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
  animation: "slideDown 0.4s ease-out",
};

const signUpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email")
    .max(30, "Email must be 30 characters or less"),
});

const personalInfoSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(4, "Full name must be at least 4 characters")
    .max(18, "Full name must be 18 characters or less")
    .refine(
      (val) => /^[A-Za-z\s]+$/.test(val),
      "Only letters and spaces allowed. No numbers or special characters."
    )
    .refine((val) => {
      const spaceCount = (val.match(/\s/g) || []).length;
      return spaceCount >= 1 && spaceCount <= 3;
    }, "Must contain 1 to 3 spaces")
    .refine(
      (val) => /^[A-Za-z]+(\s[A-Za-z]+){1,3}$/.test(val.trim()),
      "Invalid format. Use only letters with 1 to 3 spaces between words."
    ),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
    invalid_type_error: "Please select a gender",
  }),
  organizationName: z
    .string({ required_error: "Organization name is required" })
    .min(4, "Organization name must be at least 4 characters")
    .max(20, "Organization name must be 20 characters or less"),
});

const organizationSchema = z.object({
  tenantDomain: z
    .string({ required_error: "Subdomain is required" })
    .min(4, "Subdomain must be at least 4 characters")
    .max(15, "Subdomain must be 15 characters or less")
    .refine((val) => !val.includes("."), "Cannot contain dots")
    .refine(
      (val) => !val.startsWith("-") && !val.endsWith("-"),
      "Cannot start or end with a hyphen"
    )
    .refine((val) => !val.includes("--"), "Cannot contain consecutive hyphens")
    .transform((val) => val.toLowerCase())
    .refine(
      (val) => /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(val),
      "Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number."
    ),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type OrganizationFormValues = z.infer<typeof organizationSchema>;

const AdminSignupScreen = () => {
  const navigate = useNavigate();
  const VISIBLE_RECAPTCHA_KEY =
    process.env.REACT_APP_GOOGLE_VISIBLE_SITE_KEY ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue: setEmailValue,
    formState: { errors, isSubmitted, touchedFields },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const {
    register: registerPersonal,
    handleSubmit: handlePersonalSubmit,
    reset: resetPersonalForm,
    setValue: setPersonalValue,
    watch: watchPersonal,
    formState: { errors: personalErrors, isValid: isPersonalValid },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      gender: "male",
      organizationName: "",
    },
  });

  const {
    register: registerOrganization,
    handleSubmit: handleOrganizationSubmit,
    reset: resetOrganizationForm,
    watch: watchOrganization,
    setValue: setOrganizationValue,
    formState: { errors: organizationErrors, isValid: isOrganizationValid },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    mode: "onChange",
    defaultValues: {
      tenantDomain: "",
    },
  });
  const { showToast } = useToast();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSignupComplete, setIsSignupComplete] = useState<boolean>(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [personalInfo, setPersonalInfo] =
    useState<PersonalInfoFormValues | null>(null);
  const [resendAttempts, setResendAttempts] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const baseDomain = useMemo(() => {
    const { hostname, port } = window.location;
    const hostWithoutPort = hostname.split(":")[0];
    const isLocalLike =
      hostWithoutPort === "localhost" || hostWithoutPort.endsWith(".localhost");
    if (isLocalLike) {
      return port ? `localhost:${port}` : "localhost";
    }
    const parts = hostWithoutPort.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostWithoutPort;
  }, []);
  const genderValue = watchPersonal("gender");
  const tenantDomainValue = watchOrganization("tenantDomain");

  const recaptchaRef = useRef<GoogleRecaptchaRef>(null);

  const [adminSignUp, { isLoading: signupLoading }] = useAdminSignUpMutation();
  const [adminSignUpOtpVerify, { isLoading: otpVerifyLoading }] =
    useAdminSignUpOtpVerifyMutation();
  const [createAdminAccount, { isLoading: createAdminAccountLoading }] =
    useCreateAdminAccountMutation();

  const handleCheckSteps = () => {
    const refId = localStorage.getItem("refId");
    if (!refId) {
      return;
    }

    const payload = {
      url: "check-redirect",
      body: {
        ref: refId,
      },
    };
    adminSignUp(payload).then((res: any) => {
      if (res?.success) {
        const s = res?.data?.step;
        setStep(s);
        localStorage.setItem("refId", res?.data?.ref);
      }
    });
  };

  // useEffect(() => {
  //   handleCheckSteps();
  // }, []);

  useEffect(() => {
    if (!hasAcceptedTerms && step === 1) {
      setIsCaptchaVerified(false);
      setCaptchaToken("");
      recaptchaRef.current?.reset();
    }
  }, [hasAcceptedTerms, step]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const intervalId = window.setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [resendTimer]);

  const emailValue = watch("email");
  const isEmailInvalid =
    !!(isSubmitted || touchedFields.email) && !!errors.email;

  const isOtpValid = otpDigits.join("").length === OTP_LENGTH;

  const isSubmitDisabled = useMemo(() => {
    if (!emailValue || isEmailInvalid) return true;
    if (!hasAcceptedTerms) return true;
    if (!isCaptchaVerified || !captchaToken) return true;
    return false;
  }, [
    emailValue,
    isEmailInvalid,
    hasAcceptedTerms,
    isCaptchaVerified,
    captchaToken,
  ]);

  const progressStatuses = useMemo(() => {
    return Array.from({ length: TOTAL_STEPS }).map((_, index) => {
      if (index < step - 1) return "completed";
      if (index === step - 1) return "current";
      return "upcoming";
    });
  }, [step]);

  const resetForms = () => {
    setIsSignupComplete(false);
    resetPersonalForm({
      fullName: "",
      gender: "male",
      organizationName: "",
    });
    resetOrganizationForm({
      tenantDomain: "",
    });
  };

  const onEmailSubmit = (data: SignUpFormValues) => {
    const payload = {
      url: "validate-email",
      body: {
        email: data.email.trim(),
      },
    };

    adminSignUp(payload).then((res: any) => {
      if (res?.data?.success) {
        const s = res?.data?.data?.step;

        setStep(s);
        const refId = JSON.stringify(res?.data?.data?.ref);
        localStorage.setItem("refId", refId);
        setSubmittedEmail(data.email.trim());
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setResendAttempts(0);
        setResendTimer(0);
        resetForms();
      }
      if (res?.data?.type === "error") {
        showToast(res?.data?.message, "error");
        return;
      }
    });
  };

  const onOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ref = JSON.parse(localStorage.getItem("refId") as string);
    const otpValue = otpDigits.join("");
    if (otpValue.length !== OTP_LENGTH || !ref || ref === undefined) {
      showToast("Invalid OTP or ref", "error");
      return;
    }
    const payload = {
      param: ref,
      body: {
        email: submittedEmail,
        otp: otpValue,
      },
    };

    adminSignUpOtpVerify(payload).then((res: any) => {
      if (res?.data?.success) {
        const s = res?.data?.data?.step;
        setStep(s);
        const refId = JSON.stringify(res?.data?.data?.ref);
        localStorage.setItem("refId", refId);
        setSubmittedEmail(res?.data?.email);
        setResendTimer(0);

        resetForms();
      }
      if (res?.data?.type === "error") {
        showToast(res?.data?.message, "error");
        return;
      }
    });
  };

  const handleChangeEmail = () => {
    setStep(1);
    setHasAcceptedTerms(false);
    setIsCaptchaVerified(false);
    setCaptchaToken("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setResendAttempts(0);
    setResendTimer(0);
    setEmailValue("email", submittedEmail);
    recaptchaRef.current?.reset();
  };

  const handleResendCode = () => {
    if (resendAttempts >= MAX_RESEND_ATTEMPTS || resendTimer > 0) return;
    console.log("Resend OTP for", submittedEmail);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    otpInputRefs.current[0]?.focus();
    setResendAttempts((prev) => prev + 1);
    setResendTimer(RESEND_TIMER_SECONDS);
  };

  const onPersonalInfoSubmit = (values: PersonalInfoFormValues) => {
    console.log("onPersonalInfoSubmit", values);
    const ref = JSON.parse(localStorage.getItem("refId") as string);
    if (!ref || ref === undefined) {
      showToast("Invalid  ref", "error");
      return;
    }
    const payload = {
      param: {
        ref,
        email: submittedEmail,
      },
      body: {
        email: submittedEmail,
        // otp: otpValue,
      },
    };

    adminSignUpOtpVerify(payload).then((res: any) => {
      if (res?.data?.success) {
        const s = res?.data?.data?.step;
        setStep(s);
        const refId = JSON.stringify(res?.data?.data?.ref);
        localStorage.setItem("refId", refId);
        setSubmittedEmail(res?.data?.email);
        setResendTimer(0);

        resetForms();
      }
      if (res?.data?.type === "error") {
        showToast(res?.data?.message, "error");
        return;
      }
    });
    // setPersonalInfo(values);
    // setStep(4);
  };

  const onOrganizationSubmit = (values: OrganizationFormValues) => {
    const workspaceUrl = values.tenantDomain
      ? `${values.tenantDomain}.${baseDomain}`
      : baseDomain;
    console.log("Collected admin signup details", {
      email: submittedEmail,
      personal: personalInfo,
      organization: values,
      workspaceUrl,
    });
    setIsSignupComplete(true);
  };

  const handleBackToPersonal = () => {
    setIsSignupComplete(false);
    setStep(3);
  };

  const updateOtpDigits = (updater: (prev: string[]) => string[]) => {
    setOtpDigits((prev) => {
      const next = updater(prev);
      return next;
    });
  };

  const handleOtpDigitChange =
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value.replace(/\D/g, "").slice(-1);

      updateOtpDigits((prev) => {
        const next = [...prev];
        next[index] = rawValue;
        return next;
      });

      if (rawValue && index < otpInputRefs.current.length - 1) {
        otpInputRefs.current[index + 1]?.focus();
        otpInputRefs.current[index + 1]?.select?.();
      }
    };

  const handleOtpKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      const isDigit = /^[0-9]$/.test(event.key);

      if (event.key === "Backspace") {
        event.preventDefault();
        if (otpDigits[index]) {
          updateOtpDigits((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        } else if (index > 0) {
          updateOtpDigits((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
          otpInputRefs.current[index - 1]?.focus();
        }
        return;
      }

      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        otpInputRefs.current[index - 1]?.focus();
        return;
      }

      if (
        event.key === "ArrowRight" &&
        index < otpInputRefs.current.length - 1
      ) {
        event.preventDefault();
        otpInputRefs.current[index + 1]?.focus();
        return;
      }

      if (
        !isDigit &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
      }
    };

  const handleOtpPaste =
    (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;

      updateOtpDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < pasted.length && index + i < next.length; i += 1) {
          next[index + i] = pasted[i];
        }
        return next;
      });

      const focusIndex = Math.min(
        index + pasted.length,
        otpInputRefs.current.length - 1
      );
      otpInputRefs.current[focusIndex]?.focus();
      otpInputRefs.current[focusIndex]?.select?.();
    };

  const canResend = resendAttempts < MAX_RESEND_ATTEMPTS && resendTimer === 0;
  const resendHelperText = canResend
    ? "Resend code"
    : resendAttempts >= MAX_RESEND_ATTEMPTS
    ? "Resend limit reached"
    : `Resend in ${resendTimer}s`;

  return (
    <Box
      sx={{ minHeight: "100vh", width: "100%", backgroundColor: SECONDARY_BG }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "35% 65%" },
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            position: { xs: "relative", md: "sticky" },
            top: { md: 0 },
            gridColumn: { xs: "1 / -1", md: "1 / 2" },
            background: `linear-gradient(180deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
            color: "#ffffff",
            px: { xs: 4, sm: 6, md: 8 },
            py: { xs: 6, md: 10 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 6,
            minHeight: { xs: "100%", md: "100vh" },
            alignSelf: "stretch",
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
            <Box
              sx={{
                width: { xs: 72, md: 96 },
                height: { xs: 72, md: 96 },
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid rgba(255,255,255,0.3)",
                fontSize: { xs: 38, md: 48 },
                fontWeight: 600,
              }}
            >
              <ContactPhone fontSize="large" />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  mb: 1,
                  fontSize: { xs: 28, md: 34 },
                }}
              >
                Built for modern support teams
              </Typography>
              <Typography
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6,
                  fontSize: { xs: 14, md: 16 },
                }}
              >
                Manage every interaction in one collaborative workspace tailored
                for Ajaxter customers.
              </Typography>
              <Stack spacing={2} sx={{ mt: 3 }}>
                {[
                  "Launch branded omni-channel portals in minutes.",
                  "Automate routing, SLAs, and approvals with intuitive workflows.",
                  "Give agents AI-assisted responses and shared context for every ticket.",
                ].map((item) => (
                  <Typography
                    key={item}
                    sx={{ fontSize: { xs: 13, md: 15 }, opacity: 0.9 }}
                  >
                    • {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Stack>

          <Stack
            spacing={0}
            sx={{
              position: "absolute",
              top: "50%",
              right: { md: -24 },
              transform: "translateY(-50%)",
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            {progressStatuses.map((status, index) => {
              const isCurrent = status === "current";
              const isCompleted = status === "completed";
              const isLastStep = index === TOTAL_STEPS - 1;
              const showCheckMark =
                isCompleted || (isLastStep && isSignupComplete);
              const ringColor =
                isCurrent || isCompleted || (isLastStep && isSignupComplete)
                  ? "#409a00"
                  : "#d0d4df";
              const innerColor =
                isCurrent || isCompleted || (isLastStep && isSignupComplete)
                  ? "#409a00"
                  : "#b6bcc9";
              const isConnectorActive = index < step - 1;

              return (
                <Box
                  key={`${status}-${index}`}
                  sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow:
                        isCurrent ||
                        isCompleted ||
                        (isLastStep && isSignupComplete)
                          ? "0 18px 30px rgba(114, 87, 255, 0.35)"
                          : "0 12px 24px rgba(34, 61, 120, 0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `4px solid ${ringColor}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {showCheckMark ? (
                      <CheckIcon sx={{ color: "#409a00", fontSize: 22 }} />
                    ) : (
                      <Box
                        sx={{
                          width: isCurrent ? 12 : 8,
                          height: isCurrent ? 12 : 8,
                          borderRadius: "50%",
                          border: isCurrent
                            ? "4px solid rgb(36 98 171 / 63%)"
                            : "none",
                          background: isCurrent ? "#fff" : innerColor,
                          boxShadow: isCurrent
                            ? "0 0 0 4px rgb(36 97 169 / 42%)"
                            : "inset 0 0 4px rgba(0,0,0,0.12)",
                        }}
                      />
                    )}
                  </Box>
                  {index < progressStatuses.length - 1 && (
                    <Box
                      sx={{
                        height: 25,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>

          <Typography sx={{ opacity: 0.7, fontSize: { xs: 13, md: 14 } }}>
            © {new Date().getFullYear()} Ajaxter. All rights reserved.
          </Typography>
        </Box>

        {step === 1 ? (
          <Box
            component="form"
            onSubmit={handleSubmit(onEmailSubmit)}
            sx={{
              gridColumn: { xs: "1 / -1", md: "2 / 3" },
              backgroundColor: "#ffffff",
              px: { xs: 4, sm: 6, md: 8 },
              py: { xs: 6, md: 10 },
              display: "flex",
              flexDirection: "column",
              gap: 4,
              justifyContent: "center",
              overflowY: { md: "auto" },
              maxHeight: { md: "100vh" },
              ...stepContentAnimation,
            }}
          >
            <Box>
              <Typography
                sx={{
                  mt: 2,
                  color: "#1f2a37",
                  fontWeight: 600,
                  fontSize: { xs: 20, md: 24 },
                }}
              >
                Get started with Ajaxter Service Desk to provide your customers
                with responsive, always-on support.
              </Typography>
              <Typography
                sx={{ mt: 1.5, color: "#5f6c86", fontSize: { xs: 14, md: 16 } }}
              >
                Already have an account?{" "}
                <Link
                  component="button"
                  type="button"
                  underline="none"
                  sx={{ fontWeight: 600 }}
                  onClick={() => navigate("/login")}
                >
                  Login instead.
                </Link>
              </Typography>
            </Box>

            <TextField
              {...register("email")}
              variant="outlined"
              fullWidth
              label="Email"
              type="email"
              error={isEmailInvalid}
              helperText={
                isEmailInvalid ? (
                  errors.email?.message
                ) : (
                  <HelperTextWithIcon message="We'll send OTP here." />
                )
              }
              FormHelperTextProps={{
                sx: { marginLeft: 0, display: "flex", alignItems: "center" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 0,
                  "& fieldset": {
                    borderColor: "#d7dce5",
                  },
                  "&:hover fieldset": {
                    borderColor: PRIMARY_COLOR,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: PRIMARY_COLOR,
                  },
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={hasAcceptedTerms}
                  onChange={(event) =>
                    setHasAcceptedTerms(event.target.checked)
                  }
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
                  sx={{ color: "#5f6c86", fontSize: { xs: 13, md: 15 } }}
                >
                  The personal information that you have provided will help us
                  to deliver, develop and promote our products and services. By
                  signing up, you hereby declare that you have read and agree to
                  our{" "}
                  <Link href="#" underline="always">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" underline="always">
                    Privacy Policy
                  </Link>
                  .
                </Typography>
              }
              sx={{
                alignItems: "flex-start",
                m: 0,
                "& .MuiCheckbox-root": { mt: 0.5 },
              }}
            />

            <Box>
              {VISIBLE_RECAPTCHA_KEY ? (
                <GoogleRecaptcha
                  ref={recaptchaRef}
                  siteKey={VISIBLE_RECAPTCHA_KEY}
                  onVerify={(token) => {
                    setCaptchaToken(token ?? "");
                    setIsCaptchaVerified(!!token);
                  }}
                  onExpire={() => {
                    setCaptchaToken("");
                    setIsCaptchaVerified(false);
                  }}
                  theme="light"
                  size="normal"
                />
              ) : (
                <Typography sx={{ color: "error.main" }}>
                  reCAPTCHA site key not configured
                </Typography>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitDisabled || signupLoading}
              sx={{
                mt: 2,
                alignSelf: { xs: "stretch", md: "flex-start" },
                px: { xs: 4, md: 6 },
                background: PRIMARY_COLOR,
                borderRadius: 0,
                py: 1.25,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 18px 30px -18px rgba(37, 103, 179, 0.65)",
                textTransform: "uppercase",
                letterSpacing: 1,
                "&:hover": {
                  background: PRIMARY_DARK,
                },
                "&.Mui-disabled": {
                  backgroundColor: "#d9dce7",
                  color: "#fff",
                },
              }}
              endIcon={
                signupLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <EastIcon sx={{ fontSize: 20 }} />
                )
              }
            >
              Get Started
            </Button>
          </Box>
        ) : step === 2 ? (
          <Box
            component="form"
            onSubmit={onOtpSubmit}
            sx={{
              gridColumn: { xs: "1 / -1", md: "2 / 3" },
              backgroundColor: "#ffffff",
              px: { xs: 4, sm: 6, md: 8 },
              py: { xs: 6, md: 10 },
              display: "flex",
              flexDirection: "column",
              gap: 4,
              justifyContent: "center",
              overflowY: { md: "auto" },
              maxHeight: { md: "100vh" },
              ...stepContentAnimation,
            }}
          >
            <Box>
              <Typography
                sx={{
                  mt: 2,
                  color: "#1f2a37",
                  fontWeight: 600,
                  fontSize: { xs: 20, md: 24 },
                }}
              >
                Check your inbox for the verification code.
              </Typography>
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#5f6c86",
                  fontSize: { xs: 14, md: 16 },
                }}
              >
                <Typography component="span">
                  We’ve emailed a one-time password to{" "}
                  <Typography
                    component="span"
                    sx={{ fontWeight: 600, color: PRIMARY_DARK }}
                  >
                    {submittedEmail}
                  </Typography>
                </Typography>
                <IconButton
                  size="small"
                  sx={{ color: PRIMARY_COLOR }}
                  onClick={handleChangeEmail}
                >
                  <BorderColorIcon fontSize="small" />
                </IconButton>
                <Typography component="span">here.</Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 1.5 },
                justifyContent: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <TextField
                  key={index}
                  value={otpDigits[index]}
                  onChange={handleOtpDigitChange(index)}
                  onKeyDown={handleOtpKeyDown(index)}
                  onPaste={handleOtpPaste(index)}
                  onFocus={(event) => event.target.select()}
                  inputRef={(element) => {
                    otpInputRefs.current[index] = element;
                  }}
                  autoFocus={index === 0}
                  variant="outlined"
                  inputProps={{
                    maxLength: 1,
                    type: "tel",
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    sx: {
                      textAlign: "center",
                      fontSize: 20,
                      fontWeight: 600,
                    },
                  }}
                  sx={{
                    width: { xs: 42, sm: 48 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      "& fieldset": {
                        borderColor: "#d7dce5",
                      },
                      "&:hover fieldset": {
                        borderColor: PRIMARY_COLOR,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: PRIMARY_COLOR,
                      },
                    },
                  }}
                  error={false}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Button
                type="button"
                variant="text"
                onClick={handleResendCode}
                disabled={!canResend}
                sx={{
                  fontWeight: 600,
                  color: canResend ? PRIMARY_COLOR : "#9ca3af",
                  textTransform: "none",
                  px: 0,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                {resendHelperText}
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isOtpValid || otpVerifyLoading}
                endIcon={
                  otpVerifyLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <EastIcon sx={{ fontSize: 20 }} />
                  )
                }
                sx={primaryButtonStyles}
              >
                Verify OTP
              </Button>
            </Box>
          </Box>
        ) : step === 3 ? (
          <Box
            component="form"
            onSubmit={handlePersonalSubmit(onPersonalInfoSubmit)}
            sx={{
              gridColumn: { xs: "1 / -1", md: "2 / 3" },
              backgroundColor: "#ffffff",
              px: { xs: 4, sm: 6, md: 8 },
              py: { xs: 6, md: 10 },
              display: "flex",
              flexDirection: "column",
              gap: 4,
              justifyContent: "center",
              overflowY: { md: "auto" },
              maxHeight: { md: "100vh" },
              ...stepContentAnimation,
            }}
          >
            <Box>
              <Typography
                sx={{
                  mt: 2,
                  color: "#1f2a37",
                  fontWeight: 600,
                  fontSize: { xs: 20, md: 24 },
                }}
              >
                Tell us about yourself.
              </Typography>
              <Typography
                sx={{ mt: 1.5, color: "#5f6c86", fontSize: { xs: 14, md: 16 } }}
              >
                Share your details so we can personalize your admin workspace.
              </Typography>
            </Box>

            <TextField
              {...registerPersonal("fullName")}
              fullWidth
              error={!!personalErrors.fullName}
              helperText={
                personalErrors.fullName?.message || (
                  <HelperTextWithIcon message="Cannot be changed later" />
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <RecentActorsIcon sx={{ color: "#5f6c86", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                let value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                // Prevent multiple consecutive spaces
                value = value.replace(/\s+/g, " ");
                setPersonalValue("fullName", value, { shouldValidate: true });
              }}
            />

            <FormControl component="fieldset" error={!!personalErrors.gender}>
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                value={genderValue ?? ""}
                onChange={(event) =>
                  setPersonalValue(
                    "gender",
                    event.target.value as PersonalInfoFormValues["gender"],
                    {
                      shouldValidate: true,
                      shouldTouch: true,
                    }
                  )
                }
              >
                <FormControlLabel
                  value="male"
                  control={<Radio {...registerPersonal("gender")} />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ManIcon sx={{ fontSize: 20, color: "#5f6c86" }} />
                      <Typography>Male</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="female"
                  control={<Radio {...registerPersonal("gender")} />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <WomanIcon sx={{ fontSize: 20, color: "#5f6c86" }} />
                      <Typography>Female</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="other"
                  control={<Radio {...registerPersonal("gender")} />}
                  label="Other"
                />
              </RadioGroup>
              {personalErrors.gender && (
                <Typography
                  variant="caption"
                  sx={{ color: "error.main", mt: 0.5 }}
                >
                  {personalErrors.gender.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              {...registerPersonal("organizationName")}
              fullWidth
              error={!!personalErrors.organizationName}
              helperText={
                personalErrors.organizationName?.message || (
                  <HelperTextWithIcon message="Organization name cannot be changed later" />
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CorporateFareIcon
                      sx={{ color: "#5f6c86", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isPersonalValid}
                endIcon={<EastIcon sx={{ fontSize: 20 }} />}
                sx={primaryButtonStyles}
              >
                Next
              </Button>
            </Box>
          </Box>
        ) : step === 4 ? (
          isSignupComplete ? (
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: "2 / 3" },
                backgroundColor: "#ffffff",
                px: { xs: 4, sm: 6, md: 8 },
                py: { xs: 6, md: 10 },
                display: "flex",
                flexDirection: "column",
                gap: 3,
                justifyContent: "center",
                alignItems: "flex-start",
                textAlign: "left",
                ...stepContentAnimation,
              }}
            >
              <Typography
                sx={{
                  color: PRIMARY_DARK,
                  fontWeight: 700,
                  fontSize: { xs: 26, md: 30 },
                }}
              >
                Congratulations, all done!
              </Typography>
              <Typography
                sx={{
                  color: "#5f6c86",
                  fontSize: { xs: 15, md: 16 },
                  maxWidth: 520,
                }}
              >
                We'll send you an email after we verify{" "}
                <Typography
                  component="span"
                  sx={{ fontWeight: 600, color: PRIMARY_DARK }}
                >
                  {tenantDomainValue
                    ? `${tenantDomainValue}.${baseDomain}`
                    : `your tenant domain on ${baseDomain}`}
                </Typography>
                . In the meantime, you can head back to the login screen or
                explore our help center.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/login")}
                  sx={primaryButtonStyles}
                >
                  Go to Login
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    window.open("https://support.ajaxter.com", "_blank")
                  }
                  sx={outlinedButtonStyles}
                >
                  Visit Help Center
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={handleOrganizationSubmit(onOrganizationSubmit)}
              sx={{
                gridColumn: { xs: "1 / -1", md: "2 / 3" },
                backgroundColor: "#ffffff",
                px: { xs: 4, sm: 6, md: 8 },
                py: { xs: 6, md: 10 },
                display: "flex",
                flexDirection: "column",
                gap: 4,
                justifyContent: "center",
                overflowY: { md: "auto" },
                maxHeight: { md: "100vh" },
                ...stepContentAnimation,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    mt: 2,
                    color: "#1f2a37",
                    fontWeight: 600,
                    fontSize: { xs: 20, md: 24 },
                  }}
                >
                  Set up your workspace.
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    color: "#5f6c86",
                    fontSize: { xs: 14, md: 16 },
                  }}
                >
                  Choose a tenant domain for your Ajaxter workspace.
                </Typography>
              </Box>

              <TextField
                {...registerOrganization("tenantDomain")}
                placeholder="your-workspace"
                error={!!organizationErrors.tenantDomain}
                helperText={
                  organizationErrors.tenantDomain?.message || (
                    <HelperTextWithIcon message="Use lowercase letters, numbers, or hyphens." />
                  )
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TravelExploreIcon
                        sx={{ color: "#5f6c86", fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  style: { textTransform: "lowercase" },
                }}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  setOrganizationValue("tenantDomain", value, {
                    shouldValidate: true,
                  });
                }}
                sx={{ width: "auto", minWidth: 250, maxWidth: 250 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid #d7dce5",
                  borderRadius: 1,
                  px: 2,
                  py: 1.5,
                  backgroundColor: "#ffffff",
                }}
              >
                <Box
                  component="img"
                  src={lockIconGreen}
                  alt="Secure"
                  sx={{
                    width: 16,
                    height: 16,
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#188038",
                  }}
                >
                  Secure | https://
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 14,
                    color: tenantDomainValue ? "#1f2a37" : "#9ca3af",
                    fontWeight: tenantDomainValue ? 500 : 400,
                  }}
                >
                  {tenantDomainValue
                    ? `${tenantDomainValue}.${baseDomain}`
                    : "Enter website to secure (Example: domain.com)"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleBackToPersonal}
                  sx={outlinedButtonStyles}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isOrganizationValid}
                  endIcon={<EastIcon sx={{ fontSize: 20 }} />}
                  sx={primaryButtonStyles}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )
        ) : null}
      </Box>
    </Box>
  );
};

export default AdminSignupScreen;
