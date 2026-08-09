import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function SignInForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Signed in successfully");
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Unable to sign in";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid="auth-signin-form">
      {error && (
        <p className="text-sm text-destructive" data-testid="signin-error">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="signin-email-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="signin-password-input"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
        data-testid="signin-submit-btn"
      >
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

function SignUpForm({ onSuccess }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      await signup({ email, password, name });
      toast.success("Account created successfully");
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Unable to create account";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid="auth-signup-form">
      {error && (
        <p className="text-sm text-destructive" data-testid="signup-error">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="signup-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="signup-email-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          data-testid="signup-password-input"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
        data-testid="signup-submit-btn"
      >
        {submitting ? "Creating account…" : "Sign Up"}
      </Button>
    </form>
  );
}

const GOOGLE_GSI_SCRIPT = "https://accounts.google.com/gsi/client";

function GoogleSignInButton({ onSuccess }) {
  const { googleLogin } = useAuth();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scriptError, setScriptError] = useState(false);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const el = buttonRef.current;
    if (!googleClientId || !el) return;

    const initGoogle = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        setScriptError(true);
        setLoading(false);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            await googleLogin({ credential: response.credential });
            toast.success("Signed in with Google");
            onSuccess?.();
          } catch (err) {
            const msg = err?.response?.data?.detail || "Google authentication failed";
            toast.error(msg);
          }
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
      setLoading(false);
    };

    if (window.google && window.google.accounts && window.google.accounts.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = GOOGLE_GSI_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      script.onerror = () => {
        setScriptError(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      if (el) {
        el.innerHTML = "";
      }
    };
  }, [googleClientId, googleLogin, onSuccess]);

  if (!googleClientId) return null;

  return (
    <div className="mb-4">
      {loading && (
        <p className="text-xs text-muted-foreground mb-2" data-testid="google-loading">
          Loading Google…
        </p>
      )}
      {scriptError && (
        <p className="text-xs text-destructive mb-2" data-testid="google-error">
          Google Sign-In unavailable
        </p>
      )}
      <div ref={buttonRef} data-testid="google-signin-button" />
    </div>
  );
}

export function AuthModal({ open, onOpenChange }) {
  const { isAuthed } = useAuth();

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle>Welcome to TeraPlayer</DialogTitle>
          <DialogDescription>
            {isAuthed
              ? "You are already signed in."
              : "Sign in or create an account to keep your preferences in sync across devices."}
          </DialogDescription>
        </DialogHeader>

        {isAuthed ? (
          <p>You are already signed in. Close this window to continue.</p>
        ) : (
          <>
            <GoogleSignInButton onSuccess={handleSuccess} />
            <div className="my-4 flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-3 text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
            <Tabs defaultValue="signin" className="w-full" data-testid="auth-tabs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" data-testid="tab-signin">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <SignInForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <SignUpForm onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
