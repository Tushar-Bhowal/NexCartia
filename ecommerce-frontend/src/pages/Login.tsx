import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import {
  HiArrowLeft,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import loginImage from "../assets/login.jpg";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "@/components/Shared/PasswordStrengthMeter";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase";
import InputLoader from "@/components/Shared/InputLoader";
import {
  useGoogleLoginMutation,
  useSigninMutation,
  useSingupMutation,
} from "@/redux/api/userApi";
import { MessageResponse } from "@/types/api-types";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  password: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  password: "",
};

const fieldClass = (invalid: boolean) =>
  `peer block w-full rounded-md border bg-white px-3 pb-2.5 pt-4 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
    invalid
      ? "shake border-red-500 focus:ring-red-500/30"
      : "border-gray-300 focus:border-green-150 focus:ring-green-150/30"
  }`;

// Persistent label notched into the top border; tints green while its field is focused.
// Kept static (not animated from center) so text, <select>, and the native date input all match —
// a date input always shows its own dd/mm/yyyy hint and can't animate from a centered position.
const floatLabel =
  "pointer-events-none absolute left-2.5 top-2 z-10 origin-left -translate-y-4 scale-75 bg-white px-1 text-sm text-gray-500 transition-colors peer-focus:text-green-150";

interface FloatingInputProps {
  id: string;
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  invalid: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}

const FloatingInput = ({
  id,
  name,
  type,
  label,
  value,
  onChange,
  invalid,
  autoComplete,
  rightSlot,
}: FloatingInputProps) => (
  <div className="relative">
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      className={`${fieldClass(invalid)}${rightSlot ? " pr-11" : ""}`}
    />
    <label htmlFor={id} className={floatLabel}>
      {label}
    </label>
    {rightSlot}
  </div>
);

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showMeter, setShowMeter] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [signup, { isLoading: isSignupLoading }] = useSingupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] =
    useGoogleLoginMutation();
  const navigate = useNavigate();

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData(initialFormData);
    setInvalidFields([]);
    setShowMeter(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setInvalidFields((prev) => prev.filter((field) => field !== name));

    if (name === "password") {
      setShowMeter(value.length > 0);
    }
  };

  const validateForm = (isGoogleSignup: boolean = false) => {
    const invalidFieldsList: string[] = [];

    if (isSignUp || isGoogleSignup) {
      if (!formData.name && !isGoogleSignup) invalidFieldsList.push("name");
      if (!formData.gender) invalidFieldsList.push("gender");
      if (!formData.dateOfBirth) invalidFieldsList.push("dateOfBirth");
    }

    if (!isGoogleSignup) {
      if (!formData.email) invalidFieldsList.push("email");
      if (!formData.password) invalidFieldsList.push("password");
    }

    setInvalidFields(invalidFieldsList);
    return invalidFieldsList.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isSignUp) {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  };

  const handleSignUp = async () => {
    try {
      const response = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        dob: formData.dateOfBirth,
      }).unwrap();

      toast.success(response.message);
      navigate("/");
      setFormData(initialFormData);
    } catch (error) {
      const err = error as FetchBaseQueryError;
      const message = (err.data as MessageResponse)?.message;
      toast.error(message || "Sign Up Failed");
    }
  };

  const handleSignIn = async () => {
    try {
      const response = await signin({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      toast.success(response.message);
      navigate("/");
      setFormData(initialFormData);
    } catch (error) {
      const err = error as FetchBaseQueryError;
      const message = (err.data as MessageResponse)?.message;
      toast.error(message || "Sign In Failed");
    }
  };

  const googleLoginHandler = async () => {
    // New Google accounts still need gender + date of birth, which only the sign-up form collects
    const withDetails =
      isSignUp && !!formData.gender && !!formData.dateOfBirth;

    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const idToken = await user.getIdToken();

      const res = await googleLogin({
        idToken,
        ...(withDetails && {
          gender: formData.gender,
          dob: formData.dateOfBirth,
        }),
      }).unwrap();

      toast.success(res.message);
      navigate("/");
      setFormData(initialFormData);
    } catch (error) {
      const err = error as FetchBaseQueryError;
      if (err.status === 404 && isSignUp) validateForm(true);
      const message = (err.data as MessageResponse)?.message;
      toast.error(message || "Google authentication failed");
    } finally {
      // the server session is what matters; don't keep a Firebase session around
      await auth.signOut().catch(() => undefined);
    }
  };

  const isLoading =
    (isSignUp ? isSignupLoading : isSigninLoading) || isGoogleLoading;

  return (
    <div className="flex min-h-screen pt-16">
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .shake {
            animation: shake 0.5s ease-in-out;
          }
        `}
      </style>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Back to home"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <HiArrowLeft className="h-4 w-4" />
            </Link>
            <p className="text-sm text-gray-600">
              {isSignUp ? "Already a member? " : "Don't have an account? "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-medium text-green-150 hover:text-green-150/80"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <div className="mt-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp
                ? "Start shopping in under a minute."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignUp && (
              <FloatingInput
                id="name"
                name="name"
                type="text"
                label="Full name"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                invalid={invalidFields.includes("name")}
              />
            )}

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              invalid={invalidFields.includes("email")}
            />

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className={`${fieldClass(
                      invalidFields.includes("gender")
                    )} ${formData.gender ? "text-gray-900" : "text-gray-400"}`}
                  >
                    <option value="" disabled hidden></option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <label htmlFor="gender" className={floatLabel}>
                    Gender
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className={`${fieldClass(
                      invalidFields.includes("dateOfBirth")
                    )} text-gray-600`}
                  />
                  <label htmlFor="dateOfBirth" className={floatLabel}>
                    Date of birth
                  </label>
                </div>
              </div>
            )}

            <div>
              <FloatingInput
                id="password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                label="Password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={formData.password}
                onChange={handleInputChange}
                invalid={invalidFields.includes("password")}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {passwordVisible ? (
                      <HiOutlineEyeOff className="h-5 w-5" />
                    ) : (
                      <HiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                }
              />
              {isSignUp && showMeter && (
                <PasswordStrengthMeter password={formData.password} />
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-md bg-green-150 text-sm font-medium text-white hover:bg-green-150/90"
            >
              {isLoading ? (
                <InputLoader />
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 uppercase tracking-wider text-gray-400">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={googleLoginHandler}
              disabled={isLoading}
              variant="outline"
              className="h-11 w-full gap-3 rounded-md border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaGoogle className="h-4 w-4 text-red-500" />
              Continue with Google
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={loginImage}
          alt="Featured products"
        />
      </div>
    </div>
  );
};

export default AuthForm;
